import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

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

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTimeAgo(dateValue: Date | string | number): string {
  const date = new Date(dateValue);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / (60 * 1000)));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function serializeWeeklyPatients(rows: Map<string, { male: number; female: number }>, start: Date): Array<{ key: string; label: string; male: number; female: number }> {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    const key = formatDateKey(date);
    const row = rows.get(key) || { male: 0, female: 0 };

    return {
      key,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      male: row.male,
      female: row.female,
    };
  });
}

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfDay(new Date(todayStart.getTime() - 6 * DAY_MS));

    const [
      totalDoctors,
      totalPatients,
      totalReceptionists,
      totalAppointments,
      todayAppointments,
      appointmentStatuses,
      genderGroups,
      weeklyPatients,
      entityLogsFromDb,
      appointmentLogsFromDb,
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.receptionist.count(),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.patient.groupBy({
        by: ["gender"],
        _count: { gender: true },
      }),
      prisma.patient.findMany({
        where: {
          createdAt: {
            gte: weekStart,
            lte: todayEnd,
          },
          gender: {
            in: ["MALE", "FEMALE"],
          },
        },
        select: {
          createdAt: true,
          gender: true,
        },
      }),
      prisma.dashboardLog.findMany({
        where: { category: "ENTITY" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.dashboardLog.findMany({
        where: { category: "APPOINTMENT" },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    const genderCounts = genderGroups.reduce(
      (result, row) => ({
        ...result,
        [row.gender.toLowerCase()]: row._count.gender,
      }),
      { male: 0, female: 0, other: 0 }
    );

    const weeklyRows = weeklyPatients.reduce((result, patient) => {
      const key = formatDateKey(startOfDay(patient.createdAt));
      const current = result.get(key) || { male: 0, female: 0 };

      if (patient.gender === "MALE") current.male += 1;
      if (patient.gender === "FEMALE") current.female += 1;

      result.set(key, current);
      return result;
    }, new Map());

    const statusCounts = appointmentStatuses.reduce(
      (result, row) => ({
        ...result,
        [row.status]: row._count.status,
      }),
      {
        SCHEDULED: 0,
        WAITING: 0,
        IN_PROGRESS: 0,
        CHECKED_IN: 0,
      }
    );

    const entityLogs = entityLogsFromDb.map((log) => ({
      id: log.id,
      type: log.type,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
      time: formatTimeAgo(log.createdAt),
    }));

    const appointmentLogs = appointmentLogsFromDb.map((log) => ({
      id: log.id,
      type: log.type,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
      time: formatTimeAgo(log.createdAt),
    }));

    return NextResponse.json({
      ok: true,
      metrics: {
        doctors: totalDoctors,
        patients: totalPatients,
        receptionists: totalReceptionists,
        appointments: totalAppointments,
        todayAppointments,
      },
      gender: genderCounts,
      weeklyPatients: serializeWeeklyPatients(weeklyRows, weekStart),
      appointmentStatuses: statusCounts,
      entityLogs,
      appointmentLogs,
      generatedAt: now.toISOString(),
      realtime: {
        channel: "admin-dashboard",
        event: "admin-dashboard-updated",
      },
    });
  } catch (error) {
    console.error("Admin dashboard GET error:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to load admin dashboard." },
      { status: 500 }
    );
  }
}
