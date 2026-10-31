"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { generateAccessToken, hashPassword, setAuthCookies, verifyPassword } from "@/lib/auth";
import { getRoleHome } from "@/lib/getRoleHome";
import prisma from "@/lib/prisma";


export type LoginState = {
    message: string;
    fieldErrors: { phone: string; password: string };
    values: { phone: string; password: string };
};

//LoginSchema
const loginSchema = z.object({
    phone: z
        .string()
        .trim()
        .regex(/^01[0-9]{9}$/, "Invalid phone number format"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(5, "Password must be at least 5 characters"),
});

function createLoginState(
    message: string,
    raw: Record<string, string>,
    fieldErrors: LoginState["fieldErrors"] = { phone: "", password: "" }
): LoginState {
    return {
        message,
        fieldErrors,
        values: {
            phone: raw.phone || "",
            password: raw.password || "",
        },
    };
}

export async function loginAction(
    _prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const raw = Object.fromEntries(formData) as Record<string, string>;
    const result = loginSchema.safeParse(raw);
    let redirectUrl: string | null = null;

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;

        return createLoginState(
            "Invalid Credential",
            raw,
            {
                phone: fieldErrors.phone?.[0] || "",
                password: fieldErrors.password?.[0] || "",
            }
        );
    }

    const { phone, password } = result.data;

    try {
        // Find existence user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return createLoginState("User not found!", raw);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return createLoginState("Password is wrong!", raw);
        }

        // Generate tokens
        const accessToken = await generateAccessToken(user);
        await setAuthCookies(accessToken);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        redirectUrl = getRoleHome(user);
        if (user.role === "PATIENT") {
            const patientRecord = await prisma.patient.findFirst({
                where: { userId: user.id },
                select: { id: true },
            });
            if (patientRecord) {
                redirectUrl = `/patient/${patientRecord.id}/profile`;
            }
        }

    } catch (error) {
        console.log(error);
        return createLoginState("Server Error", raw);
    }

    if (!redirectUrl) {
        return createLoginState("Server Error", raw);
    }

    redirect(redirectUrl);
}

export type DemoLoginResult = {
    success: boolean;
    message: string;
};

export async function demoLoginAction(role: string): Promise<DemoLoginResult> {
    try {
        let user = null;
        const normalizedRole = String(role || "").toUpperCase();

        if (normalizedRole === "ADMIN" || normalizedRole === "DEMOADMIN" || normalizedRole === "SUPER_ADMIN") {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: "01700000000" },
                        { role: "ADMIN" },
                        { role: "SUPER_ADMIN" },
                    ],
                },
            });
        } else if (normalizedRole === "DOCTOR") {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: "01810000013" },
                        { role: "DOCTOR" },
                    ],
                },
            });
        } else if (normalizedRole === "RECEPTIONIST") {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: "01920000009" },
                        { role: "RECEPTIONIST" },
                    ],
                },
            });
        } else if (normalizedRole === "PATIENT") {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: "01600543210" },
                        { phone: "01630000000" },
                        { role: "PATIENT" },
                    ],
                },
            });
            if (!user) {
                const patientWithUser = await prisma.patient.findFirst({
                    where: { userId: { not: null } },
                    include: { user: true },
                });
                if (patientWithUser?.user) {
                    user = patientWithUser.user;
                } else {
                    const anyPatient = await prisma.patient.findFirst();
                    if (anyPatient) {
                        const fallbackPhone = anyPatient.phone || "01600543210";
                        user = await prisma.user.upsert({
                            where: { phone: fallbackPhone },
                            update: { role: "PATIENT" },
                            create: {
                                email: anyPatient.email || "patient@medcore.com",
                                password: await hashPassword("12345678"),
                                role: "PATIENT",
                                phone: fallbackPhone,
                            },
                        });
                        await prisma.patient.update({
                            where: { id: anyPatient.id },
                            data: { userId: user.id },
                        });
                    }
                }
            }
        }

        if (!user) {
            return {
                success: false,
                message: `No demo account found for ${role}.`,
            };
        }

        const accessToken = await generateAccessToken(user);
        await setAuthCookies(accessToken);

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        let redirectUrl = getRoleHome(user);
        if (user.role === "PATIENT") {
            const patientRecord = await prisma.patient.findFirst({
                where: { userId: user.id },
                select: { id: true },
            });
            if (patientRecord) {
                redirectUrl = `/patient/${patientRecord.id}/profile`;
            }
        }
        redirect(redirectUrl);

    } catch (error: unknown) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }

        console.error("demoLoginAction error:", error);
        return {
            success: false,
            message: "Failed to log in to demo account.",
        };
    }
}
