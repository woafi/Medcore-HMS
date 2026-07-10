import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const ENTITY_LOG_CATEGORY = "ENTITY";
export const APPOINTMENT_LOG_CATEGORY = "APPOINTMENT";

export async function createEntityDashboardLog({
  type,
  message,
  entityId,
  metadata,
}: {
  type: string;
  message: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.dashboardLog.create({
    data: {
      type,
      category: ENTITY_LOG_CATEGORY,
      message,
      entityId: entityId ?? null,
      metadata: (metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

export async function createAppointmentDashboardLog({
  type,
  message,
  appointmentId,
  metadata,
}: {
  type: string;
  message: string;
  appointmentId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.dashboardLog.create({
    data: {
      type,
      category: APPOINTMENT_LOG_CATEGORY,
      message,
      appointmentId: appointmentId ?? null,
      metadata: (metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}
