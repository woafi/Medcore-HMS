import type { Role } from "@prisma/client";

export type RoleHomePayload = {
    id?: string;
    userid?: string;
    role: Role;
};

type RoleHomeHandler = (payload: RoleHomePayload) => string;

const ROLE_HOME: Partial<Record<Role, RoleHomeHandler>> = {
    SUPER_ADMIN: () => "/dashboard",
    ADMIN: () => "/dashboard",
    DOCTOR: (p) => `/doctor/${p.id ?? p.userid}/dashboard`,
    RECEPTIONIST: (p) => `/receptionist/${p.id ?? p.userid}/dashboard`,
};

export function getRoleHome(payload: RoleHomePayload): string {
    const handler = ROLE_HOME[payload.role];
    return handler ? handler(payload) : "/";
}
