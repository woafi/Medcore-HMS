import type { Role } from "@prisma/client";

export type NavIcon =
  | "dashboard"
  | "doctors"
  | "receptionists"
  | "appointments"
  | "weeklySchedule"
  | "patientRecords";

export type NavLink = {
  name: string;
  href: string;
  icon: NavIcon;
  exact?: boolean;
};

const ADMIN_LINKS: NavLink[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "dashboard", exact: true },
  { name: "Doctors", href: "/admin/dashboard/doctors", icon: "doctors" },
  { name: "Receptionists", href: "/admin/dashboard/receptionists", icon: "receptionists" },
];

const DOCTOR_LINKS: NavLink[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard", exact: true },
  { name: "Appointments", href: "/appointments", icon: "appointments" },
  { name: "Weekly Schedule", href: "/weeklyschedule", icon: "weeklySchedule" },
];

const RECEPTIONIST_LINKS: NavLink[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard", exact: true },
  { name: "Patient Records", href: "/patientsrecords", icon: "patientRecords" },
  { name: "Appointments", href: "/appointments", icon: "appointments" },
  { name: "Doctors", href: "/doctors", icon: "doctors" },
];

export function getNavLinksForRole(role: Role | null | undefined): NavLink[] {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return ADMIN_LINKS;
    case "DOCTOR":
      return DOCTOR_LINKS;
    case "RECEPTIONIST":
      return RECEPTIONIST_LINKS;
    default:
      return [];
  }
}

export function isNavLinkActive(pathname: string, href: string, exact = false): boolean {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
