"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyAdminDashboard } from "@/lib/pusher";
import { createEntityDashboardLog } from "@/lib/dashboardLog";

// --- Types ---

export type ReceptionistFormFieldErrors = {
  name: string;
  email: string;
  phone: string;
  receptionists_id: string;
  gender: string;
  shift: string;
  profileImage: string;
  isActive: string;
};

export type ReceptionistFormValues = {
  name: string;
  email: string;
  phone: string;
  receptionists_id: string;
  gender: string;
  shift: string;
  profileImage: string;
  isActive: string | boolean;
};

export type ReceptionistFormState = {
  message: string;
  fieldErrors: ReceptionistFormFieldErrors;
  values: ReceptionistFormValues;
};

const emptyFieldErrors: ReceptionistFormFieldErrors = {
  name: "",
  email: "",
  phone: "",
  receptionists_id: "",
  gender: "",
  shift: "",
  profileImage: "",
  isActive: "",
};

const getValues = (raw: Record<string, FormDataEntryValue>): ReceptionistFormValues => ({
  name: String(raw.name || ""),
  email: String(raw.email || ""),
  phone: String(raw.phone || ""),
  receptionists_id: String(raw.receptionists_id || ""),
  gender: String(raw.gender || ""),
  shift: String(raw.shift || ""),
  profileImage: String(raw.profileImage || ""),
  isActive: raw.isActive === "on" ? "on" : "off",
});


const receptionistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^01[0-9]{9}$/, "Invalid phone number format"),
  receptionists_id: z
    .string()
    .trim()
    .min(1, "Receptionist ID is required")
    .regex(
      /^[A-Z]+-\d+$/,
      "Format must be like REC-247"
    ),
  gender: z
    .enum(["Male", "Female", "Other"], "Gender is required")
    .transform((value) => value.toUpperCase()),
  shift: z.enum(["Morning", "Evening", "Night"], "Shift is required"),
  profileImage: z
    .string()
    .trim()
    .url("Uploaded image URL is invalid")
    .optional()
    .or(z.literal("")),
  isActive: z
    .enum(["on", "off"])
    .transform((value) => value === "on" ? "on" : "off"),
});

/** Default login password for new staff accounts (same pattern as doctor onboarding). */
const DEFAULT_RECEPTIONIST_PASSWORD = "Receptionist@123";

export async function receptionistFormsubmissionAction(
  prevState: ReceptionistFormState,
  formData: FormData
): Promise<ReceptionistFormState> {
  const raw = Object.fromEntries(formData);

  const result = receptionistSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    return {
      message: "Invalid receptionist information",
      fieldErrors: {
        name: fieldErrors.name?.[0] || "",
        email: fieldErrors.email?.[0] || "",
        phone: fieldErrors.phone?.[0] || "",
        receptionists_id: fieldErrors.receptionists_id?.[0] || "",
        gender: fieldErrors.gender?.[0] || "",
        shift: fieldErrors.shift?.[0] || "",
        profileImage: fieldErrors.profileImage?.[0] || "",
        isActive: fieldErrors.isActive?.[0] || "",
      },
      values: getValues(raw),
    };
  }

  const { name, email, phone, receptionists_id, shift, profileImage } =
    result.data;
  const activePrisma = raw.isActive === "on" ? true : false;
  const genderPrisma = result.data.gender as "MALE" | "FEMALE" | "OTHER";

  try {
    const hashedPassword = await hashPassword(DEFAULT_RECEPTIONIST_PASSWORD);

    const receptionist = await prisma.receptionist.create({
      data: {
        name,
        receptionists_id,
        gender: genderPrisma,
        shift,
        profileImage: profileImage || null,
        isActive: activePrisma,
        user: {
          create: {
            email,
            phone,
            password: hashedPassword,
            role: "RECEPTIONIST",
          },
        },
      },
      select: {
        name: true,
        receptionists_id: true,
      },
    });

    await createEntityDashboardLog({
      type: "receptionist",
      message: `Receptionist ${receptionist.name} (${receptionist.receptionists_id}) was added.`,
      entityId: receptionist.receptionists_id,
    });

    await notifyAdminDashboard({
      type: "receptionist-added",
      receptionistId: receptionists_id,
    });
  } catch (error) {
    // Unique constraint (email, phone, or receptionists_id)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target || [];
      const fields = Array.isArray(target) ? target : [target];

      return {
        message: "Receptionist or account already exists",
        fieldErrors: {
          ...emptyFieldErrors,
          email: fields.includes("email") ? "Email already exists" : "",
          phone: fields.includes("phone") ? "Phone number already exists" : "",
          receptionists_id: fields.includes("receptionists_id")
            ? "Receptionist ID already exists"
            : "",
        },
        values: getValues(raw),
      };
    }

    console.error(error);

    return {
      message: "Server Error",
      fieldErrors: emptyFieldErrors,
      values: getValues(raw),
    };
  }

  redirect("/admin/receptionists");
}

export async function receptionistEditFormsubmissionAction(
  prevState: ReceptionistFormState,
  formData: FormData
): Promise<ReceptionistFormState> {
  const raw = Object.fromEntries(formData);
  const receptionistId = String(raw.id || "");
  const result = receptionistSchema.safeParse(raw);

  if (!receptionistId) {
    return {
      message: "Receptionist ID is missing",
      fieldErrors: emptyFieldErrors,
      values: getValues(raw),
    };
  }

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    return {
      message: "Invalid receptionist information",
      fieldErrors: {
        name: fieldErrors.name?.[0] || "",
        email: fieldErrors.email?.[0] || "",
        phone: fieldErrors.phone?.[0] || "",
        receptionists_id: fieldErrors.receptionists_id?.[0] || "",
        gender: fieldErrors.gender?.[0] || "",
        shift: fieldErrors.shift?.[0] || "",
        profileImage: fieldErrors.profileImage?.[0] || "",
        isActive: fieldErrors.isActive?.[0] || "",
      },
      values: getValues(raw),
    };
  }

  const { name, email, phone, receptionists_id, shift, profileImage } =
    result.data;
  const activePrisma = raw.isActive === "on" ? true : false;
  const genderPrisma = result.data.gender as "MALE" | "FEMALE" | "OTHER";

  try {
    await prisma.receptionist.update({
      where: { id: receptionistId },
      data: {
        name,
        receptionists_id,
        gender: genderPrisma,
        shift,
        profileImage: profileImage || null,
        isActive: activePrisma,
        user: {
          update: {
            email,
            phone,
          },
        },
      },
    });
  } catch (error) {
    // Unique constraint (email, phone, or receptionists_id)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target || [];
      const fields = Array.isArray(target) ? target : [target];

      return {
        message: "Receptionist or account already exists",
        fieldErrors: {
          ...emptyFieldErrors,
          email: fields.includes("email") ? "Email already exists" : "",
          phone: fields.includes("phone") ? "Phone number already exists" : "",
          receptionists_id: fields.includes("receptionists_id")
            ? "Receptionist ID already exists"
            : "",
        },
        values: getValues(raw),
      };
    }

    console.error(error);

    return {
      message: "Server Error",
      fieldErrors: emptyFieldErrors,
      values: getValues(raw),
    };
  }
  
  redirect("/admin/receptionists");
}

export type DeleteReceptionistResult = {
  success: boolean;
  message: string;
};

export async function deleteReceptionistAction(receptionistId: string): Promise<DeleteReceptionistResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
      };
    }

    if (!receptionistId) {
      return {
        success: false,
        message: "Receptionist ID is required.",
      };
    }

    const receptionist = await prisma.receptionist.findUnique({
      where: { id: receptionistId },
      select: {
        id: true,
        name: true,
        receptionists_id: true,
        userId: true,
      },
    });

    if (!receptionist) {
      return {
        success: false,
        message: "Receptionist record was not found.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete receptionist profile
      await tx.receptionist.delete({
        where: { id: receptionist.id },
      });

      // 2. Delete linked user account
      if (receptionist.userId) {
        await tx.user.delete({
          where: { id: receptionist.userId },
        });
      }
    });

    revalidatePath("/dashboard/receptionists");
    revalidatePath("/admin/receptionists");

    await createEntityDashboardLog({
      type: "DELETED",
      message: `Receptionist ${receptionist.name} (${receptionist.receptionists_id}) was deleted by admin.`,
      entityId: receptionist.id,
      metadata: {
        name: receptionist.name,
        receptionists_id: receptionist.receptionists_id,
        deletedBy: currentUser.email,
      },
    });

    await notifyAdminDashboard({
      type: "receptionist-deleted",
      receptionistId: receptionist.id,
    });

    return {
      success: true,
      message: `Receptionist ${receptionist.name} was successfully deleted.`,
    };
  } catch (error) {
    console.error("deleteReceptionistAction error:", error);
    return {
      success: false,
      message: "Failed to delete receptionist. Please try again.",
    };
  }
}
