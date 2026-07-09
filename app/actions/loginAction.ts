"use server";

import { z } from 'zod'
import { redirect } from 'next/navigation';
import { generateAccessToken, setAuthCookies, verifyPassword } from '@/lib/auth';
import { getRoleHome } from "@/lib/getRoleHome" 
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


export async function loginAction(
    prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const raw = Object.fromEntries(formData) as Record<string, string>;
    const result = loginSchema.safeParse(raw);

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;

        return {
            message: "Invalid Credential",
            fieldErrors: {
                phone: fieldErrors.phone?.[0] || "",
                password: fieldErrors.password?.[0] || "",
            },
            values: {
                phone: raw.phone || "",
                password: raw.password || "",
            },
        }
    }

    const { phone, password } = result.data;

    try {
        // Find existence user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return {
                message: "User not found!",
                fieldErrors: { phone: "", password: "" },
                values: {
                    phone: raw.phone || "",
                    password: raw.password || "",
                },
            };
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return {
                message: "Password is wrong!",
                fieldErrors: { phone: "", password: "" },
                values: {
                    phone: raw.phone || "",
                    password: raw.password || "",
                },
            };
        }

        // Generate tokens
        const accessToken = await generateAccessToken(user);
        await setAuthCookies(accessToken);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const redirectUrl = getRoleHome(user);

        redirect(redirectUrl);

    } catch (error) {
        // If it's a redirect error, let it propagate
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        console.log(error);
        return {
            message: "Server Error",
            fieldErrors: { phone: "", password: "" },
            values: {
                phone: raw.phone || "",
                password: raw.password || "",
            },
        };
    }

}
