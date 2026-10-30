import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteDoctorAction } from "@/app/actions/doctorFormsubmissionAction";

const ITEMS_PER_PAGE = 5;

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
    const specializationFilter = searchParams.get("specialization") || "";

    const where = specializationFilter
      ? { specialization: specializationFilter }
      : {};

    const totalDoctors = await prisma.doctor.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalDoctors / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safeCurrentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });

    return NextResponse.json({
      doctors,
      total: totalDoctors,
      currentPage: safeCurrentPage,
      totalPages,
      itemsPerPage: ITEMS_PER_PAGE,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();

    if (!tokenUser || (tokenUser.role !== "ADMIN" && tokenUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("id");

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required." },
        { status: 400 }
      );
    }

    const result = await deleteDoctorAction(doctorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
