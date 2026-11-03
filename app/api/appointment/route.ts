import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { AppointmentStatus, Prisma } from "@prisma/client";

const ITEMS_PER_PAGE = 8;

const STATUS_FILTERS = ["", "SCHEDULED", "WAITING", "IN_PROGRESS", "CHECKED_IN"] as const;

function getOrderBy(sort: string): Prisma.AppointmentOrderByWithRelationInput[] {
  switch (sort) {
    case "department":
      return [{ doctor: { specialization: "asc" } }, { date: "desc" }];
    case "doctor":
      return [{ doctor: { name: "asc" } }, { date: "desc" }];
    default:
      return [{ date: "desc" }, { startTime: "desc" }];
  }
}

function buildWhereClause({
  status,
  q,
  doctorId,
}: {
  status: string;
  q: string;
  doctorId?: string;
}): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};

  if (status && STATUS_FILTERS.includes(status as (typeof STATUS_FILTERS)[number])) {
    where.status = status as AppointmentStatus;
  }

  if (doctorId) {
    where.doctor = {
      OR: [{ id: doctorId }, { userId: doctorId }, { doctor_id: doctorId }],
    };
  }

  const term = String(q || "").trim();
  if (term) {
    where.OR = [
      { patient: { fullname: { contains: term, mode: "insensitive" } } },
      { patient: { patientId: { contains: term, mode: "insensitive" } } },
      { patient: { phone: { contains: term, mode: "insensitive" } } },
      { doctor: { name: { contains: term, mode: "insensitive" } } },
      { doctor: { specialization: { contains: term, mode: "insensitive" } } },
      { doctor: { doctor_id: { contains: term, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function GET(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();

    if (!tokenUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const requestedPage = Number(searchParams.get("page"));
    const currentPage =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    // Status filter
    const statusFilter = searchParams.get("status") || "";

    // Sort
    const sortVal = searchParams.get("sort") || "latest";
    const activeSort = ["latest", "department", "doctor"].includes(sortVal)
      ? sortVal
      : "latest";

    // Search query
    const searchQuery = (searchParams.get("q") || "").trim();

    // Doctor ID filter (for doctor-specific pages)
    const doctorId = searchParams.get("doctorId") || undefined;

    // Doctor info to return with response (for client-side rendering)
    let doctorInfo: { name: string; specialization: string } | null = null;

    // If doctorId is provided, verify the doctor exists and return doctor info
    if (doctorId) {
      const doctor = await prisma.doctor.findFirst({
        where: {
          OR: [{ id: doctorId }, { userId: doctorId }, { doctor_id: doctorId }],
        },
        select: { name: true, specialization: true },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }

      doctorInfo = doctor;
    }

    const where = buildWhereClause({ status: statusFilter, q: searchQuery, doctorId });

    const totalAppointments = await prisma.appointment.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalAppointments / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: getOrderBy(activeSort),
      skip: (safeCurrentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: {
        patient: {
          select: {
            id: true,
            fullname: true,
            patientId: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            doctor_id: true,
          },
        },
      },
    });

    // Serialize dates for JSON response
    const serializedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      date: appointment.date.toISOString(),
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime?.toISOString() ?? null,
      status: appointment.status,
      slotId: appointment.slotId,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      patient: {
        id: appointment.patient.id,
        fullname: appointment.patient.fullname,
        patientId: appointment.patient.patientId,
        phone: appointment.patient.phone,
      },
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.name,
        specialization: appointment.doctor.specialization,
        doctor_id: appointment.doctor.doctor_id,
      },
    }));

    return NextResponse.json({
      appointments: serializedAppointments,
      total: totalAppointments,
      currentPage: safeCurrentPage,
      totalPages,
      itemsPerPage: ITEMS_PER_PAGE,
      doctorInfo,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
