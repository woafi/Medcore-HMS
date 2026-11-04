import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Day } from "@prisma/client";
import {
  notifyAdminDashboard,
  notifyDoctorDashboard,
  notifyReceptionDashboard,
} from "@/lib/pusher";
import { createAppointmentDashboardLog } from "@/lib/dashboardLog";
import { sendNoSlotAvailableEmail } from "@/lib/appointmentReminderEmail";

const DAY_NAMES: Day[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getTargetDays(appointmentDate: Date, existingDay?: Day | null): Set<Day> {
  const days = new Set<Day>();
  if (existingDay) {
    days.add(existingDay);
  }
  // Local day
  days.add(DAY_NAMES[appointmentDate.getDay()]);
  // UTC day
  days.add(DAY_NAMES[appointmentDate.getUTCDay()]);
  // Asia/Dhaka day
  try {
    const dhakaDay = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      weekday: "long",
    }).format(appointmentDate) as Day;
    if (dhakaDay) {
      days.add(dhakaDay);
    }
  } catch {
    // fallback ignore
  }
  return days;
}

function getSlotDateTime(appointmentDate: Date, slotStartTime: Date): Date {
  if (
    slotStartTime.getFullYear() === appointmentDate.getFullYear() &&
    slotStartTime.getMonth() === appointmentDate.getMonth() &&
    slotStartTime.getDate() === appointmentDate.getDate()
  ) {
    return new Date(slotStartTime);
  }

  const combined = new Date(appointmentDate);
  combined.setHours(
    slotStartTime.getHours(),
    slotStartTime.getMinutes(),
    slotStartTime.getSeconds() || 0,
    slotStartTime.getMilliseconds() || 0
  );
  return combined;
}

async function extractAppointmentId(request: NextRequest): Promise<string | null> {
  // 1. Check URL query parameters
  try {
    const url = new URL(request.url);
    const fromQuery =
      url.searchParams.get("appointmentId") || url.searchParams.get("id");
    if (fromQuery && fromQuery.trim()) {
      return fromQuery.trim();
    }
  } catch {
    // ignore URL parsing error
  }

  // 2. Check JSON or Form Body
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body && typeof body === "object") {
        const id = body.appointmentId || body.id;
        if (typeof id === "string" && id.trim()) {
          return id.trim();
        }
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      const id = formData.get("appointmentId") || formData.get("id");
      if (typeof id === "string" && id.trim()) {
        return id.trim();
      }
    } else {
      const text = await request.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          const id = body?.appointmentId || body?.id;
          if (typeof id === "string" && id.trim()) {
            return id.trim();
          }
        } catch {
          // not JSON
        }
      }
    }
  } catch {
    // ignore body parsing error
  }

  return null;
}

export async function appointmentSlotChange(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const appointmentId = await extractAppointmentId(request);

    if (!appointmentId) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "appointmentId is required.",
          message: "appointmentId is required.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch the appointment
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          slot: {
            include: {
              availability: true,
            },
          },
          doctor: true,
          patient: true,
        },
      });

      // 404 if appointment not found
      if (!appointment) {
        return {
          status: 404,
          body: {
            ok: false,
            success: false,
            error: "Appointment not found.",
            message: "Appointment not found.",
          },
        };
      }

      // Check if already cancelled or completed
      const currentStatus = String(appointment.status || "").toUpperCase();
      if (currentStatus === "CANCELLED" || currentStatus === "COMPLETED") {
        return {
          status: 400,
          body: {
            ok: false,
            success: false,
            error:
              "Cannot change slot for an appointment that is already cancelled or completed.",
            message:
              "Cannot change slot for an appointment that is already cancelled or completed.",
          },
        };
      }

      const targetDays = getTargetDays(
        appointment.date,
        appointment.slot?.availability?.day
      );

      // Find all slots belonging to this doctor
      const doctorSlots = await tx.slot.findMany({
        where: {
          availability: {
            doctorId: appointment.doctorId,
          },
        },
        include: {
          availability: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });

      // Find other appointments on this date for this doctor to detect booked time/slot conflicts
      const dayStart = new Date(appointment.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(appointment.date);
      dayEnd.setHours(23, 59, 59, 999);

      const otherAppointments = await tx.appointment.findMany({
        where: {
          doctorId: appointment.doctorId,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          id: { not: appointment.id },
        },
        select: {
          slotId: true,
          startTime: true,
        },
      });

      const bookedSlotIds = new Set(
        otherAppointments.map((a) => a.slotId).filter(Boolean)
      );
      const bookedTimeKeys = new Set(
        otherAppointments.map(
          (a) => `${a.startTime.getHours()}:${a.startTime.getMinutes()}`
        )
      );
      const bookedUtcTimeKeys = new Set(
        otherAppointments.map(
          (a) => `${a.startTime.getUTCHours()}:${a.startTime.getUTCMinutes()}`
        )
      );

      type Candidate = {
        slot: (typeof doctorSlots)[number];
        slotDateTime: Date;
      };

      const candidateSlots: Candidate[] = [];

      for (const slot of doctorSlots) {
        // Exclude appointment's current slot
        if (appointment.slotId && slot.id === appointment.slotId) {
          continue;
        }

        // Must be on the same date (matching availability day or calendar date)
        const isSameDayMatch =
          (slot.availability && targetDays.has(slot.availability.day)) ||
          (slot.startTime.getFullYear() === appointment.date.getFullYear() &&
            slot.startTime.getMonth() === appointment.date.getMonth() &&
            slot.startTime.getDate() === appointment.date.getDate());

        if (!isSameDayMatch) {
          continue;
        }

        // Exclude off-duty
        if (slot.availability?.status === "Off_duty") {
          continue;
        }

        // Must not be booked
        if (slot.is_booked || bookedSlotIds.has(slot.id)) {
          continue;
        }
        const timeKey = `${slot.startTime.getHours()}:${slot.startTime.getMinutes()}`;
        const utcTimeKey = `${slot.startTime.getUTCHours()}:${slot.startTime.getUTCMinutes()}`;
        if (bookedTimeKeys.has(timeKey) || bookedUtcTimeKeys.has(utcTimeKey)) {
          continue;
        }

        // Must not have already passed
        const slotDateTime = getSlotDateTime(appointment.date, slot.startTime);
        if (slotDateTime.getTime() <= now.getTime()) {
          continue;
        }

        candidateSlots.push({ slot, slotDateTime });
      }

      // Pick the nearest upcoming free slot (earliest start time after now)
      candidateSlots.sort(
        (a, b) => a.slotDateTime.getTime() - b.slotDateTime.getTime()
      );

      if (candidateSlots.length === 0) {
        return {
          status: 400,
          notify: "NO_SLOT" as const,
          patient: appointment.patient,
          doctorName: appointment.doctor.name,
          appointmentDate: appointment.date,
          missedStartTime: appointment.startTime,
          body: {
            ok: false,
            success: false,
            message: "No free slot available for today.",
            error: "No free slot available for today.",
          },
        };
      }

      // Attempt atomic booking of the chosen slot
      let chosenSlot: (typeof doctorSlots)[number] | null = null;

      for (const candidate of candidateSlots) {
        const claimResult = await tx.slot.updateMany({
          where: {
            id: candidate.slot.id,
            is_booked: false,
          },
          data: {
            is_booked: true,
          },
        });

        if (claimResult.count > 0) {
          chosenSlot = candidate.slot;
          break;
        }
      }

      if (!chosenSlot) {
        return {
          status: 400,
          notify: "NO_SLOT" as const,
          patient: appointment.patient,
          doctorName: appointment.doctor.name,
          appointmentDate: appointment.date,
          missedStartTime: appointment.startTime,
          body: {
            ok: false,
            success: false,
            message: "No free slot available for today.",
            error: "No free slot available for today.",
          },
        };
      }

      // Release the old slot by marking it as available
      if (appointment.slotId && appointment.slotId !== chosenSlot.id) {
        await tx.slot.updateMany({
          where: {
            id: appointment.slotId,
          },
          data: {
            is_booked: false,
          },
        });
      }

      // Assign the appointment to the new slot
      const previousStartTime = appointment.startTime;
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          slotId: chosenSlot.id,
          startTime: chosenSlot.startTime,
          endTime: chosenSlot.endTime,
        },
        include: {
          slot: {
            include: {
              availability: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              doctor_id: true,
              room: true,
            },
          },
          patient: {
            select: {
              id: true,
              fullname: true,
              patientId: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      return {
        status: 200,
        previousStartTime,
        body: {
          ok: true,
          success: true,
          message: "Appointment slot changed successfully.",
          appointment: updatedAppointment,
          data: updatedAppointment,
        },
      };
    });

    if (transactionResult.status === 200 && transactionResult.body.appointment) {
      const appt = transactionResult.body.appointment;
      try {
        revalidatePath("/appointments");
        revalidatePath("/patientprofile", "page");

        const notificationPayload = {
          appointmentId: appt.id,
          doctorId: appt.doctorId,
          date:
            appt.date instanceof Date
              ? appt.date.toISOString()
              : String(appt.date),
          status: appt.status,
          slotId: appt.slotId,
        };

        if (appt.patient && appt.doctor) {
          await createAppointmentDashboardLog({
            type: "SLOT_CHANGED",
            message: `Appointment for ${appt.patient.fullname} with ${appt.doctor.name} was moved to a new slot.`,
            appointmentId: appt.id,
            metadata: {
              patientFullname: appt.patient.fullname,
              doctorName: appt.doctor.name,
              newSlotId: appt.slotId,
            },
          });
        }

        await notifyReceptionDashboard(notificationPayload);
        await notifyDoctorDashboard(notificationPayload);
        await notifyAdminDashboard({
          ...notificationPayload,
          type: "appointment-slot-updated",
        });

      } catch (logError) {
        console.error(
          "Dashboard notification/log error (non-fatal):",
          logError
        );
      }
    }

    if (transactionResult.notify === "NO_SLOT") {
      if (transactionResult.patient?.email) {
        try {
          await sendNoSlotAvailableEmail({
            patientEmail: transactionResult.patient.email,
            patientName: transactionResult.patient.fullname,
            doctorName: transactionResult.doctorName,
            missedAppointmentDate: transactionResult.appointmentDate,
            missedStartTime: transactionResult.missedStartTime,
          });
        } catch (err) {
          console.error("No-slot email error (non-fatal):", err);
        }
      } else {
        console.warn("No-slot email skipped: patient has no email address.");
      }
    }

    return NextResponse.json(transactionResult.body, {
      status: transactionResult.status,
    });
  } catch (error) {
    console.error("appointmentSlotChange error:", error);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Internal server error",
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export const PATCH = appointmentSlotChange;

