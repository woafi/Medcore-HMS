"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emptyPatientFieldErrors } from "@/lib/patientFormHelpers";
import prisma from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormState {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Validation helpers (mirrors patientFormsubmissionAction)
// ---------------------------------------------------------------------------

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

const patientEditSchema = z.object({
  id: z.string().trim().min(1, "Patient record is missing"),
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

// ---------------------------------------------------------------------------
// Server action — update an existing patient record
// ---------------------------------------------------------------------------

export async function patientEditFormsubmissionAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const result = patientEditSchema.safeParse(raw);

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
    id,
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

  if (parsedAge === undefined) {
    return {
      success: false,
      message: "Please fix the highlighted patient details.",
      fieldErrors: {
        ...emptyPatientFieldErrors,
        age: "Age must be a whole number between 0 and 150",
      },
      values: getValues(raw),
    };
  }

  try {
    const existing = await prisma.patient.findUnique({
      where: { id },
      select: { patientId: true },
    });

    if (!existing) {
      return {
        success: false,
        message: "Patient record could not be found.",
        fieldErrors: emptyPatientFieldErrors,
        values: getValues(raw),
      };
    }

    await prisma.patient.update({
      where: { id },
      data: {
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
    });

    if (receptionistId) {
      // revalidatePath(`/receptionist/${receptionistId}/patients`);
      revalidatePath(`/patientprofile${receptionistId}`);
    }

    return {
      success: true,
      message: `Patient ${existing.patientId} updated successfully.`,
      fieldErrors: emptyPatientFieldErrors,
      values: getValues(raw),
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Could not update this patient. Please try again.",
      fieldErrors: emptyPatientFieldErrors,
      values: getValues(raw),
    };
  }
}
