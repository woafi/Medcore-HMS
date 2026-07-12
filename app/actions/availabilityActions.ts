"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type RawSlot = { start: string; end: string };

function statusToDb(status: string): "Available" | "Emergency_Only" | "Off_duty" {
  switch (status) {
    case "Available":
      return "Available";
    case "Emergency Only":
      return "Emergency_Only";
    case "Off-duty":
      return "Off_duty";
    default:
      return "Available";
  }
}

function dayToDb(day: string): "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday" {
  const validDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
  if (!validDays.includes(day as any)) {
    throw new Error(`Invalid day: ${day}`);
  }
  return day as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
}

function parseTime(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function createAvailability(
  doctorId: string,
  data: { day: string; status: string; timeSlots: RawSlot[] },
  revalidatePaths: string[] = []
) {
  try {
    const availability = await prisma.availability.create({
      data: {
        day: dayToDb(data.day),
        status: statusToDb(data.status),
        doctorId,
        available_slots: {
          create: data.timeSlots.map((slot) => ({
            startTime: parseTime(slot.start),
            endTime: parseTime(slot.end),
          })),
        },
      },
      include: {
        available_slots: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    revalidatePaths.forEach((path) => revalidatePath(path));

    return { ok: true as const, availability };
  } catch (error) {
    console.error("createAvailability error:", error);
    return { ok: false as const, error: "Failed to create availability" };
  }
}

export async function updateAvailability(
  id: string,
  data: { status: string; timeSlots: RawSlot[] },
  revalidatePaths: string[] = []
) {
  try {
    // Delete existing slots and create new ones within a transaction
    const availability = await prisma.$transaction(async (tx) => {
      // Delete all existing slots for this availability
      await tx.slot.deleteMany({
        where: { availabilityId: id },
      });

      // Update the availability status and create new slots
      return tx.availability.update({
        where: { id },
        data: {
          status: statusToDb(data.status),
          available_slots: {
            create: data.timeSlots.map((slot) => ({
              startTime: parseTime(slot.start),
              endTime: parseTime(slot.end),
            })),
          },
        },
        include: {
          available_slots: {
            orderBy: { startTime: "asc" },
          },
        },
      });
    });

    revalidatePaths.forEach((path) => revalidatePath(path));

    return { ok: true as const, availability };
  } catch (error) {
    console.error("updateAvailability error:", error);
    return { ok: false as const, error: "Failed to update availability" };
  }
}

export async function deleteAvailability(
  id: string,
  revalidatePaths: string[] = []
) {
  try {
    await prisma.availability.delete({
      where: { id },
    });

    revalidatePaths.forEach((path) => revalidatePath(path));

    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false as const, error: "Availability not found" };
    }
    console.error("deleteAvailability error:", error);
    return { ok: false as const, error: "Failed to delete availability" };
  }
}
