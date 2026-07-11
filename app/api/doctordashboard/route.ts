import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyReceptionDashboard } from "@/lib/pusher";
import { createAppointmentDashboardLog } from "@/lib/dashboardLog";

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getInitials(name: string): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type DashboardMetrics = {
  total: number;
  patientSeen: number;
  remaining: number;
  inProgress: number;
  waiting: number;
  completionPercent: number;
};

// ─── GET ────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const dateParam = searchParams.get("date");

    if (!doctorId || !dateParam) {
      return NextResponse.json(
        { ok: false, error: "doctorId and date are required." },
        { status: 400 }
      );
    }

    // Find the doctor record
    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ id: doctorId }, { userId: doctorId }, { doctor_id: doctorId }],
      },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { ok: false, error: "Doctor not found." },
        { status: 404 }
      );
    }

    // Build date range
    const selectedDate = new Date(dateParam + "T00:00:00.000Z");
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    // Fetch all appointments for this doctor on this day
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        patient: {
          select: {
            fullname: true,
            patientId: true,
            profileImage: true,
            phone: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Compute metrics
    const total = appointments.length;
    const patientSeen = appointments.filter(
      (a) => a.status === "CHECKED_IN" || a.status === "IN_PROGRESS"
    ).length;
    const remaining = total - patientSeen;
    const inProgress = appointments.filter(
      (a) => a.status === "IN_PROGRESS"
    ).length;
    const waiting = appointments.filter(
      (a) => a.status === "WAITING"
    ).length;
    const completionPercent = total > 0 ? Math.round((patientSeen / total) * 100) : 0;

    const metrics: DashboardMetrics = {
      total,
      patientSeen,
      remaining,
      inProgress,
      waiting,
      completionPercent,
    };

    const mappedAppointments = appointments.map((a) => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      patient: {
        name: a.patient.fullname,
        patientId: a.patient.patientId,
        profileImage: a.patient.profileImage,
        phone: a.patient.phone,
        initials: getInitials(a.patient.fullname),
      },
    }));

    return NextResponse.json({
      ok: true,
      metrics,
      appointments: mappedAppointments,
    });
  } catch (error) {
    console.error("Doctor dashboard GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load doctor dashboard." },
      { status: 500 }
    );
  }
}

// ─── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, status, doctorId } = body;

    if (!appointmentId || !status || !doctorId) {
      return NextResponse.json(
        { ok: false, error: "appointmentId, status, and doctorId are required." },
        { status: 400 }
      );
    }

    const validStatuses = ["SCHEDULED", "WAITING", "IN_PROGRESS", "CHECKED_IN"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Fetch the appointment to verify it belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctor: {
          OR: [{ id: doctorId }, { userId: doctorId }, { doctor_id: doctorId }],
        },
      },
      include: {
        patient: { select: { fullname: true, patientId: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { ok: false, error: "Appointment not found or does not belong to this doctor." },
        { status: 404 }
      );
    }

    // Update the appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    // Log the status change
    await createAppointmentDashboardLog({
      type: "appointment-status-changed",
      message: `Appointment ${appointment.id.slice(0, 8)} for patient ${appointment.patient.fullname} (${appointment.patient.patientId}) changed to ${status}.`,
      appointmentId: appointment.id,
    });

    // Notify the reception dashboard
    await notifyReceptionDashboard({
      type: "appointment-updated",
      appointmentId: appointment.id,
      status,
      patientId: appointment.patient.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date.toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: `Appointment status updated to ${status}.`,
      appointment: {
        id: appointment.id,
        status,
      },
    });
  } catch (error) {
    console.error("Doctor dashboard PATCH error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update appointment status." },
      { status: 500 }
    );
  }
}
