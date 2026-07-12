import type { ApiUser } from "@/lib/userTypes";

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

function getAdminLinks(): NavLink[] {
  return [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: "dashboard",
      exact: true,
    },
    {
      name: "Doctors",
      href: "/admin/doctors",
      icon: "doctors",
    },
    {
      name: "Receptionists",
      href: "/admin/receptionists",
      icon: "receptionists",
    },
  ];
}

function getDoctorLinks(doctorId: string): NavLink[] {
  return [
    {
      name: "Dashboard",
      href: `/doctor/${doctorId}/dashboard`,
      icon: "dashboard",
      exact: true,
    },
    {
      name: "Appointments",
      href: `/doctor/${doctorId}/appointments`,
      icon: "appointments",
    },
    {
      name: "Weekly Schedule",
      href: `/doctor/${doctorId}/weekly-schedule`,
      icon: "weeklySchedule",
    },
  ];
}

function getReceptionistLinks(receptionistId: string): NavLink[] {
  return [
    {
      name: "Dashboard",
      href: `/receptionist/${receptionistId}/dashboard`,
      icon: "dashboard",
      exact: true,
    },
    {
      name: "Patient Records",
      href: `/receptionist/${receptionistId}/patients`,
      icon: "patientRecords",
    },
    {
      name: "Appointments",
      href: `/receptionist/${receptionistId}/appointments`,
      icon: "appointments",
    },
    {
      name: "Doctors",
      href: `/receptionist/${receptionistId}/availabledoctorslist`,
      icon: "doctors",
    },
  ];
}

export function getNavLinksForRole(user: ApiUser | null): NavLink[] {
  if (!user) return [];

  switch (user.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return getAdminLinks();

    case "DOCTOR":
      return getDoctorLinks(user.id);

    case "RECEPTIONIST":
      return getReceptionistLinks(user.id);

    default:
      return [];
  }
}

export function isNavLinkActive(
  pathname: string,
  href: string,
  exact = false
): boolean {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}