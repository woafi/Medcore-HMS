import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ITEMS_PER_PAGE = 8;

export async function GET(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();

    if (!tokenUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedPage = Number(searchParams.get("page"));
    const currentPage =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const totalPatients = await prisma.patient.count();
    const totalPages = Math.max(1, Math.ceil(totalPatients / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      skip: (safeCurrentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 1,
          select: {
            date: true,
            startTime: true,
            status: true,
          },
        },
      },
    });

    const serializedPatients = patients.map((patient) => ({
      id: patient.id,
      patientId: patient.patientId,
      fullname: patient.fullname,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
      age: patient.age,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      bloodGroup: patient.bloodGroup,
      profileImage: patient.profileImage,
      createdAt: patient.createdAt.toISOString(),
      emergencyName: patient.emergencyName,
      emergencyPhone: patient.emergencyPhone,
      relationship: patient.relationship,
      allergies: patient.allergies,
      appointments: patient.appointments.map((a) => ({
        date: a.date.toISOString(),
        startTime: a.startTime.toISOString(),
        status: a.status,
      })),
    }));

    return NextResponse.json({
      patients: serializedPatients,
      total: totalPatients,
      currentPage: safeCurrentPage,
      totalPages,
      itemsPerPage: ITEMS_PER_PAGE,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
