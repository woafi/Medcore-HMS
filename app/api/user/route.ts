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

    // Fetch full user details with related profile based on role
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        phone: true,
        doctor: {
          select: {
            id: true,
            doctor_id: true,
            name: true,
            specialization: true,
            qualification: true,
            profileImage: true,
            gender: true,
            isActive: true,
          },
        },
        receptionist: {
          select: {
            id: true,
            receptionists_id: true,
            name: true,
            profileImage: true,
            gender: true,
            shift: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
