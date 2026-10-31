import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAppointmentDashboardLog } from "@/lib/dashboardLog";
import { sendAppointmentReminderEmail } from "@/lib/appointmentReminderEmail";

export const dynamic = "force-dynamic";

const CLAIM_LEASE_MS = 10 * 60 * 1000;
const MAX_APPOINTMENTS_PER_RUN = 100;
const BANGLADESH_TIME_ZONE = "Asia/Dhaka";

function getBangladeshParts(date: Date): Record<string, number> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BANGLADESH_TIME_ZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
}

// Appointments retain the selected calendar date separately from the reusable
// slot's time-of-day. Combine them in the hospital timezone for due checks.
function appointmentStartsAt(date: Date, startTime: Date): Date {
  const day = getBangladeshParts(date);
  const time = getBangladeshParts(startTime);
  // Bangladesh has a fixed UTC+06:00 offset and no daylight saving time.
  return new Date(Date.UTC(day.year, day.month - 1, day.day, time.hour - 6, time.minute));
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const claimExpiry = new Date(now.getTime() - CLAIM_LEASE_MS);
  let sent = 0;
  let failed = 0;

  try {
    const candidates = await prisma.appointment.findMany({
      where: {
        status: "SCHEDULED",
        date: { lte: now },
        reminderSentAt: null,
        patient: { email: { not: null } },
        OR: [
          { reminderClaimedAt: null },
          { reminderClaimedAt: { lt: claimExpiry } },
        ],
      },
      select: { id: true },
      orderBy: { startTime: "asc" },
      take: MAX_APPOINTMENTS_PER_RUN,
    });

    for (const candidate of candidates) {
      const claimedAt = new Date();
      const claim = await prisma.appointment.updateMany({
        where: {
          id: candidate.id,
          status: "SCHEDULED",
          date: { lte: now },
          reminderSentAt: null,
          OR: [
            { reminderClaimedAt: null },
            { reminderClaimedAt: { lt: claimExpiry } },
          ],
        },
        data: { reminderClaimedAt: claimedAt },
      });

      if (claim.count !== 1) continue;

      const appointment = await prisma.appointment.findUnique({
        where: { id: candidate.id },
        select: {
          id: true,
          date: true,
          startTime: true,
          status: true,
          patient: { select: { fullname: true, email: true } },
          doctor: { select: { name: true } },
        },
      });

      if (
        !appointment?.patient.email ||
        appointment.status !== "SCHEDULED" ||
        appointmentStartsAt(appointment.date, appointment.startTime) > now
      ) {
        continue;
      }

      try {
        await sendAppointmentReminderEmail({
          patientEmail: appointment.patient.email,
          patientName: appointment.patient.fullname,
          doctorName: appointment.doctor.name,
          appointmentDate: appointment.date,
          appointmentStartTime: appointment.startTime,
        });

        const markedSent = await prisma.appointment.updateMany({
          where: {
            id: appointment.id,
            status: "SCHEDULED",
            reminderSentAt: null,
            reminderClaimedAt: claimedAt,
          },
          data: { reminderSentAt: new Date() },
        });

        if (markedSent.count === 1) {
          sent += 1;
          await createAppointmentDashboardLog({
            type: "REMINDER_SENT",
            message: `Appointment check-in reminder emailed to ${appointment.patient.fullname}.`,
            appointmentId: appointment.id,
            metadata: { recipient: appointment.patient.email },
          });
        }
      } catch (error) {
        failed += 1;
        console.error(`Appointment reminder failed for ${appointment.id}:`, error);
        // Keep the claim. It becomes eligible automatically once the lease expires.
      }
    }

    return NextResponse.json({ ok: true, candidates: candidates.length, sent, failed });
  } catch (error) {
    console.error("Appointment reminder cron failed:", error);
    return NextResponse.json(
      { ok: false, error: "Appointment reminder job failed." },
      { status: 500 }
    );
  }
}
