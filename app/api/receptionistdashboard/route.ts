import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  notifyAdminDashboard,
  notifyDoctorDashboard,
  notifyReceptionDashboard,
} from "@/lib/pusher";
import { createAppointmentDashboardLog } from "@/lib/dashboardLog";
import { AppointmentStatus } from "@prisma/client";

interface DateRange {
  start: Date;
  end: Date;
}

interface AppointmentMetric {
  total: number;
  patientSeen: number;
  remaining: number;
  inProgress: number;
  waiting: number;
  completionPercent: number;
}

interface SerializedPatient {
  id: string;
  fullname: string;
  patientId: string;
  phone: string;
  profileImage: string | null;
}

interface SerializedDoctor {
  id: string;
  name: string;
  specialization: string;
  room: number | null;
}

interface SerializedAppointment {
  id: string;
  date: string;
  time: string;
  endTime: string;
  status: string;
  patient: {
    id: string;
    name: string;
    initials: string;
    phone: string;
    patientId: string;
    profileImage: string | null;
  };
  doctor: SerializedDoctor;
}

const APPOINTMENT_STATUSES = new Set([
  "SCHEDULED",
  "WAITING",
  "IN_PROGRESS",
  "CHECKED_IN",
]);

function getDateRange(dateParam: string | null): DateRange | null {
  const selectedDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();

  if (Number.isNaN(selectedDate.getTime())) {
    return null;
  }

  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatInitials(name: string = ""): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function serializeAppointment(appointment: {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  patient: {
    id: string;
    fullname: string;
    patientId: string;
    phone: string | null;
    profileImage: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string;
    room: number | null;
  };
}): SerializedAppointment {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    id: appointment.id,
    date: appointment.date.toISOString(),
    time: formatter.format(appointment.startTime),
    endTime: formatter.format(appointment.endTime),
    status: appointment.status,
    patient: {
      id: appointment.patient.id,
      name: appointment.patient.fullname,
      initials: formatInitials(appointment.patient.fullname) || "PT",
      phone: appointment.patient.phone || "No phone",
      patientId: appointment.patient.patientId,
      profileImage: appointment.patient.profileImage || null,
    },
    doctor: {
      id: appointment.doctor.id,
      name: appointment.doctor.name,
      specialization: appointment.doctor.specialization,
      room: appointment.doctor.room,
    },
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const receptionistId = searchParams.get("receptionistId");
    const date = searchParams.get("date");
    const range = getDateRange(date);

    if (!receptionistId) {
      return NextResponse.json(
        { ok: false, error: "Receptionist ID is required." },
        { status: 400 }
      );
    }

    if (!range) {
      return NextResponse.json(
        { ok: false, error: "Invalid dashboard date." },
        { status: 400 }
      );
    }

    const receptionist = await prisma.receptionist.findFirst({
      where: {
        OR: [{ userId: receptionistId }, { id: receptionistId }],
      },
      select: {
        id: true,
        userId: true,
        name: true,
        receptionists_id: true,
      },
    });

    if (!receptionist) {
      return NextResponse.json(
        { ok: false, error: "Receptionist not found." },
        { status: 404 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
      include: {
        patient: {
          select: {
            id: true,
            fullname: true,
            patientId: true,
            phone: true,
            profileImage: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            room: true,
          },
        },
      },
    });

    const metrics: AppointmentMetric = appointments.reduce(
      (result, appointment) => {
        result.total += 1;

        if (appointment.status === "CHECKED_IN") result.patientSeen += 1;
        if (appointment.status === "IN_PROGRESS") result.inProgress += 1;
        if (appointment.status === "WAITING") result.waiting += 1;
        if (appointment.status !== "CHECKED_IN") result.remaining += 1;

        return result;
      },
      {
        total: 0,
        patientSeen: 0,
        remaining: 0,
        inProgress: 0,
        waiting: 0,
        completionPercent: 0,
      }
    );

    metrics.completionPercent =
      metrics.total === 0 ? 0 : Math.round((metrics.patientSeen / metrics.total) * 100);

    return NextResponse.json({
      ok: true,
      receptionist,
      metrics,
      appointments: appointments
        .filter((a) => a.status === "SCHEDULED" || a.status === "WAITING")
        .map(serializeAppointment),
      realtime: {
        channel: "reception-dashboard",
        event: "appointments-updated",
      },
    });
  } catch (error) {
    console.error("Reception dashboard GET error:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to load reception dashboard." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: {
      appointmentId?: string;
      status?: string;
      receptionistId?: string;
    } = await request.json();
    const appointmentId = String(body?.appointmentId || "");
    const status = String(body?.status || "");
    const receptionistId = String(body?.receptionistId || "");

    if (!appointmentId || !APPOINTMENT_STATUSES.has(status)) {
      return NextResponse.json(
        { ok: false, error: "Valid appointment ID and status are required." },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: status as AppointmentStatus },
      include: {
        patient: { select: { fullname: true } },
        doctor: { select: { name: true } },
      },
    });

    const notificationPayload = {
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      receptionistId,
      date: appointment.date.toISOString(),
      status: appointment.status,
    };

    await createAppointmentDashboardLog({
      type: appointment.status,
      message: `${appointment.patient.fullname} with ${appointment.doctor.name} is ${appointment.status.replaceAll("_", " ")}.`,
      appointmentId: appointment.id,
      metadata: {
        patientFullname: appointment.patient.fullname,
        doctorName: appointment.doctor.name,
      },
    });

    await notifyReceptionDashboard(notificationPayload);
    await notifyDoctorDashboard(notificationPayload);
    await notifyAdminDashboard({
      ...notificationPayload,
      type: "appointment-status-updated",
    });

    return NextResponse.json({ ok: true, appointment });
  } catch (error) {
    console.error("Reception dashboard PATCH error:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to update appointment status." },
      { status: 500 }
    );
  }
}
