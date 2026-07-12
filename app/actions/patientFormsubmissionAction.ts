"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { notifyAdminDashboard } from "@/lib/pusher";
import { createEntityDashboardLog } from "@/lib/dashboardLog";

const emptyFieldErrors = {
  fullname: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  emergencyName: "",
  relationship: "",
  emergencyPhone: "",
  bloodGroup: "",
  age: "",
  allergies: "",
  profileImage: "",
};

const emptyValues = {
  fullname: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  emergencyName: "",
  relationship: "",
  emergencyPhone: "",
  bloodGroup: "O_Positive",
  age: "",
  allergies: "",
  profileImage: "",
};

const getValues = (raw: Record<string, FormDataEntryValue>): Record<string, string> => ({
  fullname: String(raw.fullname || ""),
  gender: String(raw.gender || ""),
  dateOfBirth: String(raw.dateOfBirth || ""),
  phone: String(raw.phone || ""),
  email: String(raw.email || ""),
  address: String(raw.address || ""),
  emergencyName: String(raw.emergencyName || ""),
  relationship: String(raw.relationship || ""),
  emergencyPhone: String(raw.emergencyPhone || ""),
  bloodGroup: String(raw.bloodGroup || "O_Positive"),
  age: String(raw.age || ""),
  allergies: String(raw.allergies || ""),
  profileImage: String(raw.profileImage || ""),
});

function isValidOptionalPhone(value: string): boolean {
  if (!value) return true;
  return /^[+()\-\s0-9]{7,20}$/.test(value);
}

function isValidOptionalEmail(value: string): boolean {
  if (!value) return true;
  return z.string().email().safeParse(value).success;
}

function isValidOptionalDate(value: string): boolean {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : null;
}

function toNullableAge(value: string): number | null | undefined {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return undefined;
  return parsed;
}

function buildPatientId() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAT-${year}-${random}`;
}

const patientSchema = z.object({
  receptionistId: z.string().optional(),
  fullname: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .min(3, "Full name must be at least 3 characters"),
  gender: z
    .enum(["Male", "Female", "Other"], "Gender is required")
    .transform((value) => value.toUpperCase()),
  dateOfBirth: z
    .string()
    .trim()
    .refine(isValidOptionalDate, "Date of birth cannot be in the future"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^01[0-9]{9}$/, "Invalid phone number format"),
  email: z
    .string()
    .trim()
    .refine(isValidOptionalEmail, "Enter a valid email address"),
  address: z.string().trim(),
  emergencyName: z.string().trim(),
  relationship: z.string().trim(),
  emergencyPhone: z
    .string()
    .trim()
    .refine(isValidOptionalPhone, "Enter a valid emergency phone number"),
  bloodGroup: z.enum(
    [
      "A_Positive",
      "A_Negative",
      "B_Positive",
      "B_Negative",
      "AB_Positive",
      "AB_Negative",
      "O_Positive",
      "O_Negative",
    ],
    "Blood group is required"
  ),
  age: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (!value) return true;
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 150;
      },
      "Age must be a whole number between 0 and 150"
    ),
  allergies: z.string().trim(),
  profileImage: z
    .string()
    .trim()
    .url("Uploaded image URL is invalid")
    .optional()
    .or(z.literal("")),
});

interface FormState {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: Record<string, string>;
}

export async function patientFormsubmissionAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const result = patientSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Please fix the highlighted patient details.",
      fieldErrors: {
        fullname: fieldErrors.fullname?.[0] || "",
        gender: fieldErrors.gender?.[0] || "",
        dateOfBirth: fieldErrors.dateOfBirth?.[0] || "",
        phone: fieldErrors.phone?.[0] || "",
        email: fieldErrors.email?.[0] || "",
        address: fieldErrors.address?.[0] || "",
        emergencyName: fieldErrors.emergencyName?.[0] || "",
        relationship: fieldErrors.relationship?.[0] || "",
        emergencyPhone: fieldErrors.emergencyPhone?.[0] || "",
        bloodGroup: fieldErrors.bloodGroup?.[0] || "",
        age: fieldErrors.age?.[0] || "",
        allergies: fieldErrors.allergies?.[0] || "",
        profileImage: fieldErrors.profileImage?.[0] || "",
      },
      values: getValues(raw),
    };
  }

  const {
    receptionistId,
    fullname,
    gender,
    dateOfBirth,
    phone,
    email,
    address,
    emergencyName,
    relationship,
    emergencyPhone,
    bloodGroup,
    age,
    allergies,
    profileImage,
  } = result.data;

  const parsedAge = toNullableAge(age);

  let patient: { patientId: string; fullname: string } | null = null;

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        patient = await prisma.patient.create({
          data: {
            patientId: buildPatientId(),
            fullname,
            gender: gender as unknown as "MALE" | "FEMALE" | "OTHER",
            dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`) : null,
            phone: toNullableString(phone),
            email: toNullableString(email),
            address: toNullableString(address),
            bloodGroup,
            age: parsedAge,
            allergies: toNullableString(allergies),
            emergencyName: toNullableString(emergencyName),
            emergencyPhone: toNullableString(emergencyPhone),
            relationship: toNullableString(relationship),
            profileImage: profileImage || null,
          },
          select: {
            patientId: true,
            fullname: true,
          },
        });
        break;
      } catch (error) {
        const duplicatePatientId =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          (Array.isArray(error.meta?.target)
            ? error.meta.target.includes("patientId")
            : error.meta?.target === "patientId");

        if (!duplicatePatientId || attempt === 2) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Could not register this patient. Please try again.",
      fieldErrors: emptyFieldErrors,
      values: getValues(raw),
    };
  }

  // Patient should always be set here (outer catch returns on failure),
  // but TypeScript needs a guard for the null case.
  if (!patient) {
    return {
      success: false,
      message: "Could not register this patient. Please try again.",
      fieldErrors: emptyFieldErrors,
      values: getValues(raw),
    };
  }

  if (receptionistId) {
    revalidatePath(`/receptionist/${receptionistId}/patients`);
  }

  await createEntityDashboardLog({
    type: "patient",
    message: `Patient ${patient.fullname} (${patient.patientId}) was added.`,
    entityId: patient.patientId,
  });

  await notifyAdminDashboard({
    type: "patient-added",
    patientId: patient.patientId,
  });

  return {
    success: true,
    message: `Patient registered successfully as ${patient.patientId}.`,
    fieldErrors: emptyFieldErrors,
    values: emptyValues,
  };
}
