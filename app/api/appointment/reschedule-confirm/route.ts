import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { changeAppointmentSlot } from "@/lib/appointmentSlotChange";
import { verifySlotChangeToken } from "@/lib/slotChangeToken";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const token =
      body && typeof body === "object" && "token" in body && typeof body.token === "string"
        ? body.token
        : null;
    const payload = token ? verifySlotChangeToken(token) : null;
    if (!payload) {
      return NextResponse.json({ ok: false, error: "This link is no longer valid. Please contact hospital reception." }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: payload.appointmentId },
      select: { slotId: true, startTime: true, doctor: { select: { name: true } } },
    });
    if (!appointment) {
      return NextResponse.json({ ok: false, error: "This link is no longer valid. Please contact hospital reception." }, { status: 400 });
    }
    if (appointment.slotId !== payload.slotId) {
      return NextResponse.json({ ok: true, alreadyChanged: true, appointment }, { status: 200 });
    }

    const result = await changeAppointmentSlot(payload.appointmentId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Appointment reschedule confirmation error:", error);
    return NextResponse.json({ ok: false, error: "Unable to confirm the appointment change." }, { status: 500 });
  }
}
