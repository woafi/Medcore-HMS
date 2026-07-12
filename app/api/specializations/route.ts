import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tokenUser = await getCurrentUser();

    if (!tokenUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: { specialization: true },
      distinct: ["specialization"],
      orderBy: { specialization: "asc" },
    });

    const specializations = doctors.map((d) => d.specialization);

    return NextResponse.json({ specializations });
  } catch (error) {
    console.error("Error fetching specializations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
