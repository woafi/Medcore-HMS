"use server";

import { z } from 'zod'
import { redirect } from 'next/navigation';
import { Prisma, Gender } from "@prisma/client";
import { hashPassword } from '@/lib/auth';
import prisma from "@/lib/prisma";
import { notifyAdminDashboard } from "@/lib/pusher";
import { createEntityDashboardLog } from "@/lib/dashboardLog";

type FieldErrors = {
    name: string;
    email: string;
    phone: string;
    doctor_id: string;
    room: string;
    gender: string;
    specialization: string;
    qualification: string;
    bio: string;
    profileImage: string;
    consultationFee: string;
    isActive: string;
};

type FormValues = {
    name: string;
    email: string;
    phone: string;
    doctor_id: string;
    room: string;
    gender: string;
    specialization: string;
    qualification: string;
    bio: string;
    profileImage: string;
    consultationFee: string;
    isActive: boolean;
};

type DoctorFormState = {
    message: string;
    fieldErrors: FieldErrors;
    values: FormValues;
};

const emptyFieldErrors: FieldErrors = {
    name: "",
    email: "",
    phone: "",
    doctor_id: "",
    room: "",
    gender: "",
    specialization: "",
    qualification: "",
    bio: "",
    profileImage: "",
    consultationFee: "",
    isActive: "",
};

const getValues = (raw: Record<string, FormDataEntryValue>): FormValues => ({
    name: String(raw.name || ""),
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    doctor_id: String(raw.doctor_id || ""),
    room: String(raw.room || ""),
    gender: String(raw.gender || ""),
    specialization: String(raw.specialization || ""),
    qualification: String(raw.qualification || ""),
    bio: String(raw.bio || ""),
    profileImage: String(raw.profileImage || ""),
    consultationFee: String(raw.consultationFee || ""),
    isActive: raw.isActive === "false" ? false : true,
});

const doctorSchema = z.object({
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
    doctor_id: z
        .string()
        .trim()
        .min(1, "Doctor ID is required")
        .regex(
            /^[A-Z]+-\d+$/,
            "Format must be like REC-247"
        ),
    room: z
        .string()
        .trim()
        .min(1, "Room is required")
        .regex(/^\d{3}$/, "Room must be 3 digits")
        .transform((value) => Number(value)),
    gender: z
        .enum(["Male", "Female", "Other"], "Gender is required")
        .transform((value) => value.toUpperCase()),
    specialization: z
        .string()
        .trim()
        .min(1, "Specialization is required"),
    qualification: z
        .string()
        .trim()
        .min(1, "Qualification is required"),
    bio: z
        .string()
        .trim()
        .min(1, "Bio is required"),
    profileImage: z
        .string()
        .trim()
        .url("Uploaded image URL is invalid")
        .optional()
        .or(z.literal("")),
    consultationFee: z
        .string()
        .trim()
        .min(1, "Consultation fee is required")
        .refine((value) => !Number.isNaN(Number(value)), "Consultation fee must be a number")
        .refine((value) => Number(value) >= 0, "Consultation fee cannot be negative")
        .transform((value) => Number(value)),
    isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true"),
});

const Default_DOCTOR_PASSWORD = "Doctor@123"

export async function doctorFormsubmissionAction(
    prevState: DoctorFormState,
    formData: FormData
): Promise<DoctorFormState> {
    const raw = Object.fromEntries(formData);
    const result = doctorSchema.safeParse(raw);

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;

        return {
            message: "Invalid doctor information",
            fieldErrors: {
                name: fieldErrors.name?.[0] || "",
                email: fieldErrors.email?.[0] || "",
                phone: fieldErrors.phone?.[0] || "",
                doctor_id: fieldErrors.doctor_id?.[0] || "",
                room: fieldErrors.room?.[0] || "",
                gender: fieldErrors.gender?.[0] || "",
                specialization: fieldErrors.specialization?.[0] || "",
                qualification: fieldErrors.qualification?.[0] || "",
                bio: fieldErrors.bio?.[0] || "",
                profileImage: fieldErrors.profileImage?.[0] || "",
                consultationFee: fieldErrors.consultationFee?.[0] || "",
                isActive: fieldErrors.isActive?.[0] || "",
            },
            values: getValues(raw),
        };
    }

    const {
        name,
        email,
        phone,
        doctor_id,
        room,
        gender,
        specialization,
        qualification,
        bio,
        profileImage,
        consultationFee,
        isActive,
    } = result.data;

    try {
        const hashedPassword = await hashPassword(Default_DOCTOR_PASSWORD);

        const doctor = await prisma.doctor.create({
            data: {
                doctor_id,
                name,
                specialization,
                qualification,
                bio,
                profileImage: profileImage || null,
                room,
                gender: gender as Gender,
                consultationFee,
                isActive,
                user: {
                    create: {
                        email,
                        phone,
                        password: hashedPassword,
                        role: "DOCTOR",
                    },
                },
            },
            select: {
              doctor_id: true,
              name: true,
            },
        });

        await createEntityDashboardLog({
          type: "doctor",
          message: `Doctor ${doctor.name} (${doctor.doctor_id}) was added.`,
          entityId: doctor.doctor_id,
        });

        await notifyAdminDashboard({
            type: "doctor-added",
            doctorId: doctor_id,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = error.meta?.target || [];
            const fields = Array.isArray(target) ? target : [target];

            return {
                message: "Doctor already exists",
                fieldErrors: {
                    ...emptyFieldErrors,
                    email: fields.includes("email") ? "Email already exists" : "",
                    phone: fields.includes("phone") ? "Phone number already exists" : "",
                    doctor_id: fields.includes("doctor_id") ? "Doctor ID already exists" : "",
                    room: fields.includes("room") ? "Room Number already exists" : "",
                },
                values: getValues(raw),
            };
        }

        console.log(error);

        return {
            message: "Server Error",
            fieldErrors: emptyFieldErrors,
            values: getValues(raw),
        };
    }

    redirect("/dashboard/doctors");
}

export async function doctorUpdateAction(
    prevState: DoctorFormState,
    formData: FormData
): Promise<DoctorFormState> {
    const raw = Object.fromEntries(formData);
    const doctorId = String(raw.id || "");
    const result = doctorSchema.safeParse(raw);

    if (!doctorId) {
        return {
            message: "Doctor record is missing",
            fieldErrors: emptyFieldErrors,
            values: getValues(raw),
        };
    }

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;

        return {
            message: "Invalid doctor information",
            fieldErrors: {
                name: fieldErrors.name?.[0] || "",
                email: fieldErrors.email?.[0] || "",
                phone: fieldErrors.phone?.[0] || "",
                doctor_id: fieldErrors.doctor_id?.[0] || "",
                room: fieldErrors.room?.[0] || "",
                gender: fieldErrors.gender?.[0] || "",
                specialization: fieldErrors.specialization?.[0] || "",
                qualification: fieldErrors.qualification?.[0] || "",
                bio: fieldErrors.bio?.[0] || "",
                profileImage: fieldErrors.profileImage?.[0] || "",
                consultationFee: fieldErrors.consultationFee?.[0] || "",
                isActive: fieldErrors.isActive?.[0] || "",
            },
            values: getValues(raw),
        };
    }

    const {
        name,
        email,
        phone,
        doctor_id,
        room,
        gender,
        specialization,
        qualification,
        bio,
        profileImage,
        consultationFee,
        isActive,
    } = result.data;

    try {
        await prisma.doctor.update({
            where: { id: doctorId },
            data: {
                doctor_id,
                name,
                specialization,
                qualification,
                bio,
                profileImage: profileImage || null,
                room,
                gender: gender as Gender,
                consultationFee,
                isActive,
                user: {
                    update: {
                        email,
                        phone,
                    },
                },
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = error.meta?.target || [];
            const fields = Array.isArray(target) ? target : [target];

            return {
                message: "Doctor already exists",
                fieldErrors: {
                    ...emptyFieldErrors,
                    email: fields.includes("email") ? "Email already exists" : "",
                    phone: fields.includes("phone") ? "Phone number already exists" : "",
                    doctor_id: fields.includes("doctor_id") ? "Doctor ID already exists" : "",
                    room: fields.includes("room") ? "Room Number already exists" : "",
                },
                values: getValues(raw),
            };
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return {
                message: "Doctor record was not found",
                fieldErrors: emptyFieldErrors,
                values: getValues(raw),
            };
        }

        console.log(error);

        return {
            message: "Server Error",
            fieldErrors: emptyFieldErrors,
            values: getValues(raw),
        };
    }

    redirect("/dashboard/doctors");
}
