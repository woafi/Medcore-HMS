import type { JWTPayload } from "jose";
import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

import type { AuthTokenPayload } from "@/lib/auth";
import { getRoleHome } from "@/lib/getRoleHome";

type VerifiedAuthPayload = AuthTokenPayload & JWTPayload;
type UserRole = AuthTokenPayload["role"];

const LOGIN_PATH = "/login";
const ROOT_PATH = "/";
const PUBLIC_PATHS = [LOGIN_PATH] as const;

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret);

const ROLE_ROUTES: Record<string, readonly UserRole[]> = {
    "/receptionprofile": ["RECEPTIONIST", "SUPER_ADMIN", "ADMIN"],
    "/doctorprofile": ["RECEPTIONIST", "SUPER_ADMIN", "ADMIN", "DOCTOR"],
    "/admin": ["SUPER_ADMIN", "ADMIN"],
    "/doctor": ["DOCTOR"],
    "/receptionist": ["RECEPTIONIST"],
};

function createUrl(path: string, req: NextRequest): URL {
    return new URL(path, req.url);
}

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some((path) => pathname === path);
}

function isPublicAsset(pathname: string): boolean {
    return (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/public") ||
        pathname.includes(".")
    );
}

async function verifyToken(token: string): Promise<VerifiedAuthPayload> {
    const { payload } = await jwtVerify<VerifiedAuthPayload>(token, JWT_SECRET);
    return payload;
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (isPublicAsset(pathname)) {
        return NextResponse.next();
    }

    const token = req.cookies.get("accessToken")?.value;

    if (pathname === ROOT_PATH) {
        if (!token) {
            return NextResponse.redirect(createUrl(LOGIN_PATH, req));
        }

        try {
            const payload = await verifyToken(token);
            return NextResponse.redirect(createUrl(getRoleHome(payload), req));
        } catch {
            return NextResponse.redirect(createUrl(LOGIN_PATH, req));
        }
    }

    if (isPublicPath(pathname)) {
        if (!token) {
            return NextResponse.next();
        }

        try {
            const payload = await verifyToken(token);
            return NextResponse.redirect(createUrl(getRoleHome(payload), req));
        } catch {
            return NextResponse.next();
        }
    }

    if (!token) {
        return NextResponse.redirect(createUrl(LOGIN_PATH, req));
    }

    try {
        const payload = await verifyToken(token);

        for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
            if (!pathname.startsWith(route)) {
                continue;
            }

            if (!allowedRoles.includes(payload.role)) {
                return NextResponse.redirect(createUrl(getRoleHome(payload), req));
            }

            break;
        }

        const pathParts = pathname.split("/");

        if (pathname.startsWith("/doctor")) {
            const doctorId = pathParts[2];
            
            if (payload.role === "DOCTOR" && payload.userid !== doctorId) {
                return NextResponse.redirect(
                    createUrl(`/doctor/${payload.userid}/dashboard`, req)
                );
            }
        }

        if (pathname.startsWith("/receptionist")) {
            const receptionistId = pathParts[2];

            if (
                payload.role === "RECEPTIONIST" &&
                payload.userid !== receptionistId
            ) {
                return NextResponse.redirect(
                    createUrl(`/receptionist/${payload.userid}/dashboard`, req)
                );
            }
        }

        return NextResponse.next();
    } catch {
        return NextResponse.redirect(createUrl(LOGIN_PATH, req));
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
