import cron from "node-cron";
import prisma from "@/lib/prisma";
import { sendAppointmentReminderEmail } from "./appointmentReminderEmail";
import { createAppointmentDashboardLog } from "./dashboardLog";

type ReminderResult = {
  sent: number;
  failed: number;
  claimed: number;
};

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

function appointmentStartsAt(date: Date, startTime: Date): Date {
  const day = getBangladeshParts(date);
  const time = getBangladeshParts(startTime);
  // Bangladesh has a fixed UTC+06:00 offset and no daylight saving time.
  return new Date(Date.UTC(day.year, day.month - 1, day.day, time.hour - 6, time.minute));
}

/**
 * Finds upcoming SCHEDULED appointments that have not been reminded yet,
 * sends a check-in reminder email to each patient, and stamps the reminder
 * as sent. Uses `reminderClaimedAt` so concurrent runs never double-send.
 */
export async function checkAppointmentReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, claimed: 0 };
  const now = new Date();
  const claimExpiry = new Date(now.getTime() - CLAIM_LEASE_MS);
  let sent = 0;
  let failed = 0;

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
    // Atomically claim the reminder so parallel cron runs cannot double-send.
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
      result.sent += 1;
    } catch (error) {
      console.error(
        `Failed to send reminder for appointment ${appointment.id}:`,
        error
      );
      result.failed += 1;
    }
  }

  return result;
}

const g = globalThis as unknown as {
  __appointmentSchedulerStarted?: boolean;
};

async function runAppointmentReminderCheck() {
  console.log("About to call checkAppointmentReminders");

  try {
    const result = await checkAppointmentReminders();
    console.log("checkAppointmentReminders completed:", result);
    if (result.sent > 0 || result.failed > 0) {
      console.log("Cron result:", result);
    }
  } catch (error) {
    console.error("Appointment cron error:", error);
  }
}

/**
 * Starts an immediate and then one-minute check for appointment reminders.
 * Safe to call multiple times; only the first call starts a scheduler.
 * Uses a global flag so Next.js hot reload in dev cannot double-start it.
 */
export function startAppointmentScheduler() {
  if (g.__appointmentSchedulerStarted) return;

  g.__appointmentSchedulerStarted = true;
  void runAppointmentReminderCheck();

  cron.schedule(
    "* * * * *",
    () => {
      console.log("Checking appointment reminders...");
      void runAppointmentReminderCheck();
    },
    {
      timezone: "Asia/Dhaka",
    }
  );

  console.log("Appointment scheduler started (every minute, Asia/Dhaka).");
}
