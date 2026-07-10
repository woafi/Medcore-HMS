import type { Role } from "@prisma/client";

export type RoleHomePayload = {
    id?: string;
    userid?: string;
    role: Role;
};

type RoleHomeHandler = (payload: RoleHomePayload) => string;

const ROLE_HOME: Partial<Record<Role, RoleHomeHandler>> = {
    SUPER_ADMIN: () => "/admin/dashboard",
    ADMIN: () => "/admin/dashboard",
    DOCTOR: (payload) =>
        `/doctor/${payload.id ?? payload.userid}/dashboard`,
    RECEPTIONIST: (payload) =>
        `/receptionist/${payload.id ?? payload.userid}/dashboard`,
};

export function getRoleHome(payload: RoleHomePayload): string {
    return ROLE_HOME[payload.role]?.(payload) ?? "/";
}
