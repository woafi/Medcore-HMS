import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const totalDoctors = await prisma.doctor.count();
    const totalPages = Math.max(1, Math.ceil(totalDoctors / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const doctors = await prisma.doctor.findMany({
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
