import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret);
const TOKEN_EXPIRY = "30d";

export type AuthTokenUser = {
    id: string;
    email: string;
    role: Role;
    phone: string;
    name?: string | null;
};

export type AuthTokenPayload = {
    id: string;
    userid: string;
    username?: string | null;
    email: string;
    role: Role;
    phoneNumber: string;
    iat?: number;
    exp?: number;
};

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

// Verify a password against a hash
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// Generate an access token
export async function generateAccessToken(user: AuthTokenUser): Promise<string> {
    const userObject: AuthTokenPayload = {
        id: user.id,
        userid: user.id,
        username: user.name ?? null,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone,
    };

    return new SignJWT(userObject)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

// Verify an access token
export async function verifyAccessToken(
    token: string
): Promise<AuthTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as AuthTokenPayload;
    } catch {
        return null;
    }
}

// Set auth cookies (HttpOnly, Secure, SameSite)
export async function setAuthCookies(accessToken: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 604800000,
    });
}

// Clear auth cookies (logout)
export async function clearAuthCookies(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
}

// Get current user from cookies
export async function getCurrentUser(): Promise<AuthTokenPayload | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
        return null;
    }

    return verifyAccessToken(accessToken);
}

// Get auth tokens from cookies
export async function getAuthTokens(): Promise<{ accessToken?: string }> {
    const cookieStore = await cookies();
    return {
        accessToken: cookieStore.get("accessToken")?.value,
    };
}
