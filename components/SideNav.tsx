"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getNavLinksForRole, isNavLinkActive } from "@/lib/navLinks";

const navIconNames = {
  dashboard: "dashboard",
  doctors: "stethoscope",
  receptionists: "support_agent",
  appointments: "calendar_month",
  weeklySchedule: "view_week",
  patientRecords: "clinical_notes",
};

const SideNav = () => {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const navLinks = getNavLinksForRole(user);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-foreground shadow-sm dark:border-gray-800 lg:flex lg:flex-col lg:justify-between">
      <div className="flex flex-col overflow-y-auto">
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5 dark:border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined select-none">medical_services</span>
          </div>
          <span className="font-bold text-lg hidden sm:block text-primary select-none">
            MedCare HMS
          </span>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))
          ) : (
            navLinks.map((link) => {
              const active = isNavLinkActive(pathname, link.href, link.exact);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px] leading-none">
                    {navIconNames[link.icon]}
                  </span>
                  <span>{link.name}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <LogoutButton />
      </div>
    </aside>
  );
};

export default SideNav;
