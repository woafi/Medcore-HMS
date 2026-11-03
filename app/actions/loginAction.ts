"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { generateAccessToken, setAuthCookies, verifyPassword } from "@/lib/auth";
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
        const normalizedRole = String(role || "").toUpperCase();

        const demoPhoneByRole: Record<string, string | undefined> = {
            ADMIN: process.env.DEMO_ADMIN_PHONE,
            DEMOADMIN: process.env.DEMO_ADMIN_PHONE,
            SUPER_ADMIN: process.env.DEMO_ADMIN_PHONE,
            DOCTOR: process.env.DEMO_DOCTOR_PHONE,
            RECEPTIONIST: process.env.DEMO_RECEPTIONIST_PHONE,
            PATIENT: process.env.DEMO_PATIENT_PHONE,
        };
        const allowedRolesByDemo: Record<string, readonly string[]> = {
            ADMIN: ["ADMIN", "SUPER_ADMIN"],
            DEMOADMIN: ["ADMIN", "SUPER_ADMIN"],
            SUPER_ADMIN: ["ADMIN", "SUPER_ADMIN"],
            DOCTOR: ["DOCTOR"],
            RECEPTIONIST: ["RECEPTIONIST"],
            PATIENT: ["PATIENT"],
        };
        const demoPhone = demoPhoneByRole[normalizedRole];
        const allowedRoles = allowedRolesByDemo[normalizedRole];

        if (!demoPhone || !allowedRoles) {
            return {
                success: false,
                message: `Demo phone number is not configured for ${role}.`,
            };
        }

        const user = await prisma.user.findUnique({
            where: { phone: demoPhone },
        });

        if (!user) {
            return {
                success: false,
                message: `No demo account found for the configured ${role} phone number.`,
            };
        }

        if (!allowedRoles.includes(user.role)) {
            return {
                success: false,
                message: `The configured ${role} demo account has the wrong role.`,
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
