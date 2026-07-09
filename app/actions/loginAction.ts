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

    } catch (error) {
        console.log(error);
        return createLoginState("Server Error", raw);
    }

    if (!redirectUrl) {
        return createLoginState("Server Error", raw);
    }

    redirect(redirectUrl);
}
