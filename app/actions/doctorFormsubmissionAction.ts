"use server";

import { z } from 'zod'
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Prisma, Gender } from "@prisma/client";
import { hashPassword, getCurrentUser } from '@/lib/auth';
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

    redirect("/admin/doctors");
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

    redirect("/admin/doctors");
}


export type DeleteDoctorResult = {
    success: boolean;
    message: string;
};

export async function deleteDoctorAction(doctorId: string): Promise<DeleteDoctorResult> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
            return {
                success: false,
                message: "Unauthorized. Admin privileges required.",
            };
        }

        if (!doctorId) {
            return {
                success: false,
                message: "Doctor ID is required.",
            };
        }

        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            select: {
                id: true,
                name: true,
                doctor_id: true,
                userId: true,
                availabilities: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!doctor) {
            return {
                success: false,
                message: "Doctor record was not found.",
            };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Delete all appointments with this doctor
            await tx.appointment.deleteMany({
                where: { doctorId: doctor.id },
            });

            // 2. Delete all slots for doctor's availabilities
            const availabilityIds = doctor.availabilities.map((a) => a.id);
            if (availabilityIds.length > 0) {
                await tx.slot.deleteMany({
                    where: { availabilityId: { in: availabilityIds } },
                });

                // 3. Delete availabilities
                await tx.availability.deleteMany({
                    where: { id: { in: availabilityIds } },
                });
            }

            // 4. Delete the doctor
            await tx.doctor.delete({
                where: { id: doctor.id },
            });

            // 5. Delete the doctor's user account
            if (doctor.userId) {
                await tx.user.delete({
                    where: { id: doctor.userId },
                });
            }
        });

        revalidatePath("/dashboard/doctors");
        revalidatePath("/admin/doctors");

        await createEntityDashboardLog({
            type: "DELETED",
            message: `Doctor ${doctor.name} (${doctor.doctor_id}) was deleted by admin.`,
            entityId: doctor.id,
            metadata: {
                name: doctor.name,
                doctor_id: doctor.doctor_id,
                deletedBy: currentUser.email,
            },
        });

        await notifyAdminDashboard({
            type: "doctor-deleted",
            doctorId: doctor.id,
        });

        return {
            success: true,
            message: `Doctor ${doctor.name} was successfully deleted.`,
        };
    } catch (error) {
        console.error("deleteDoctorAction error:", error);
        return {
            success: false,
            message: "Failed to delete doctor. Please try again.",
        };
    }
}