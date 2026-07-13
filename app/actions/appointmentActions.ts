"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  notifyAdminDashboard,
  notifyDoctorDashboard,
  notifyReceptionDashboard,
} from "@/lib/pusher";
import { createAppointmentDashboardLog } from "@/lib/dashboardLog";

// ─── Types ──────────────────────────────────────────────────────────────────

type PatientSearchResult = {
  id: string;
  fullname: string;
  patientId: string;
  phone: string | null;
  profileImage: string | null;
  gender: string;
};

type DoctorSlot = {
  id: string;
  time: string;
  isBooked: boolean;
};

type DoctorScheduleEntry = {
  day: string;
  status: string;
};

type DoctorMeta = {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
};

type BookingMetaResult =
  | { ok: true; departments: string[]; doctors: DoctorMeta[] }
  | { ok: false; error: string };

type ScheduleResult =
  | { ok: true; schedule: DoctorScheduleEntry[] }
  | { ok: false; error: string };

type SlotsResult =
  | { ok: true; slots: DoctorSlot[] }
  | { ok: false; error: string };

type BookAppointmentPayload = {
  patientId: string;
  doctorId: string;
  dateString: string;
  slotId: string;
};

type BookAppointmentResult =
  | { success: true; message: string }
  | { success: false; message: string };

type DeleteAppointmentResult =
  | { success: true; message: string }
  | { success: false; message: string };

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// ─── Actions ────────────────────────────────────────────────────────────────

/**
 * Fetch booking metadata: list of unique departments and their doctors.
 */
export async function getBookingMetaData(): Promise<BookingMetaResult> {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        specialization: true,
        consultationFee: true,
      },
      orderBy: { name: "asc" },
    });

    const departments = [
      ...new Set(doctors.map((d) => d.specialization)),
    ] as string[];

    return {
      ok: true,
      departments,
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.name,
        specialization: d.specialization,
        consultationFee: Number(d.consultationFee),
      })),
    };
  } catch (error) {
    console.error("getBookingMetaData error:", error);
    return { ok: false, error: "Failed to load booking metadata." };
  }
}

/**
 * Search patients by name, ID, or phone.
 */
export async function searchPatientsAction(
  term: string
): Promise<PatientSearchResult[]> {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { fullname: { contains: term, mode: "insensitive" } },
          { patientId: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullname: true,
        patientId: true,
        phone: true,
        profileImage: true,
        gender: true,
      },
      take: 8,
    });

    return patients;
  } catch (error) {
    console.error("searchPatientsAction error:", error);
    return [];
  }
}

/**
 * Get weekly schedule template for a doctor.
 */
export async function getDoctorWeeklyScheduleAction(
  doctorId: string
): Promise<ScheduleResult> {
  try {
    const availabilities = await prisma.availability.findMany({
      where: { doctorId },
      select: {
        day: true,
        status: true,
      },
    });

    return {
      ok: true,
      schedule: availabilities.map((a) => ({
        day: a.day,
        status: a.status,
      })),
    };
  } catch (error) {
    console.error("getDoctorWeeklyScheduleAction error:", error);
    return { ok: false, error: "Failed to load doctor schedule." };
  }
}

/**
 * Get available time slots for a doctor on a specific date.
 */
export async function getDoctorAvailabilityAction(
  doctorId: string,
  dateString: string
): Promise<SlotsResult> {
  try {
    const targetDate = new Date(`${dateString}T00:00:00`);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[targetDate.getDay()];

    // Find the availability for that day
    const dayEnum = dayName as
      | "Monday"
      | "Tuesday"
      | "Wednesday"
      | "Thursday"
      | "Friday"
      | "Saturday"
      | "Sunday";

    const availability = await prisma.availability.findFirst({
      where: {
        doctorId,
        day: dayEnum,
      },
      include: {
        available_slots: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!availability || availability.status === "Off_duty") {
      return { ok: true, slots: [] };
    }

    // Check which slots are already booked for this specific date
    // We match by time-of-day, not by slotId, because when a doctor 
    // recreates their schedule the slots get new IDs while appointments 
    // still exist at the same times (fixes double-booking bug).
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: { startTime: true },
    });

    const bookedTimeKeys = new Set(
      bookedAppointments.map(
        (a) => `${a.startTime.getHours()}:${a.startTime.getMinutes()}`
      )
    );

    const slots: DoctorSlot[] = availability.available_slots.map((slot) => ({
      id: slot.id,
      time: formatTime(slot.startTime),
      isBooked: slot.is_booked || bookedTimeKeys.has(`${slot.startTime.getHours()}:${slot.startTime.getMinutes()}`),
    }));

    return { ok: true, slots };
  } catch (error) {
    console.error("getDoctorAvailabilityAction error:", error);
    return { ok: false, error: "Failed to load time slots." };
  }
}

/**
 * Book a new appointment for a patient with a doctor.
 */
export async function bookAppointmentAction(
  payload: BookAppointmentPayload
): Promise<BookAppointmentResult> {
  try {
    const { patientId, doctorId, dateString, slotId } = payload;

    const targetDate = new Date(`${dateString}T00:00:00`);
    targetDate.setHours(0, 0, 0, 0);

    // Get the slot details for timing
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return { success: false, message: "Selected time slot not found." };
    }

    if (slot.is_booked) {
      return {
        success: false,
        message: "This time slot has already been booked.",
      };
    }

    // Double-check by time-of-day: if a schedule was recreated after the 
    // original booking, the new slot has a different ID but the same time.
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
        startTime: {
          gte: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            slot.startTime.getHours(),
            slot.startTime.getMinutes(),
            0
          ),
          lt: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            slot.endTime.getHours(),
            slot.endTime.getMinutes(),
            0
          ),
        },
      },
    });

    if (existingAppointment) {
      return {
        success: false,
        message: "This time slot has already been booked.",
      };
    }

    // Create the appointment and mark slot as booked in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          date: targetDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          patientId,
          doctorId,
          slotId,
          status: "SCHEDULED",
        },
      });

      await tx.slot.update({
        where: { id: slotId },
        data: { is_booked: true },
      });

      return created;
    });

    revalidatePath("/", "layout");

    const appointmentDetails = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { select: { fullname: true } },
        doctor: { select: { name: true } },
      },
    });

    if (appointmentDetails) {
      const notificationPayload = {
        appointmentId: appointmentDetails.id,
        doctorId: appointmentDetails.doctorId,
        date: appointmentDetails.date.toISOString(),
        status: appointmentDetails.status,
      };

      await createAppointmentDashboardLog({
        type: "CREATED",
        message: `New appointment booked for ${appointmentDetails.patient.fullname} with ${appointmentDetails.doctor.name}.`,
        appointmentId: appointmentDetails.id,
        metadata: {
          patientFullname: appointmentDetails.patient.fullname,
          doctorName: appointmentDetails.doctor.name,
        },
      });

      await notifyReceptionDashboard(notificationPayload);
      await notifyDoctorDashboard(notificationPayload);
      await notifyAdminDashboard({
        ...notificationPayload,
        type: "appointment-created",
      });
    }

    return {
      success: true,
      message: "Appointment booked successfully!",
    };
  } catch (error) {
    console.error("bookAppointmentAction error:", error);
    return { success: false, message: "Failed to book appointment." };
  }
}

/**
 * Delete an appointment and free up the time slot.
 */
export async function deleteAppointmentAction(
  appointmentId: string
): Promise<DeleteAppointmentResult> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        slotId: true,
        doctorId: true,
        date: true,
        status: true,
        patient: { select: { fullname: true } },
        doctor: { select: { name: true } },
      },
    });

    if (!appointment) {
      return { success: false, message: "Appointment not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.delete({
        where: { id: appointmentId },
      });

      if (appointment.slotId) {
        await tx.slot.update({
          where: { id: appointment.slotId },
          data: { is_booked: false },
        });
      }
    });

    revalidatePath("/", "layout");

    const notificationPayload = {
      appointmentId,
      doctorId: appointment.doctorId,
      date: appointment.date.toISOString(),
      status: appointment.status,
    };

    await createAppointmentDashboardLog({
      type: "DELETED",
      message: `Appointment for ${appointment.patient.fullname} with ${appointment.doctor.name} was cancelled.`,
      appointmentId,
      metadata: {
        patientFullname: appointment.patient.fullname,
        doctorName: appointment.doctor.name,
      },
    });

    await notifyReceptionDashboard(notificationPayload);
    await notifyDoctorDashboard(notificationPayload);
    await notifyAdminDashboard({
      ...notificationPayload,
      type: "appointment-deleted",
    });

    return {
      success: true,
      message: "Appointment deleted successfully.",
    };
  } catch (error) {
    console.error("deleteAppointmentAction error:", error);
    return { success: false, message: "Failed to delete appointment." };
  }
}
