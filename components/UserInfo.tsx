"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function UserInfo() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
        <div className="text-right hidden sm:block">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Guest
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Not signed in
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  if (isAdmin) {
    return (
      <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-black dark:text-white font-bold leading-none">
            Admin
          </p>
          <p className="text-xs text-gray-500 mt-1">System Admin</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
      </div>
    );
  }

  if (user.role === "DOCTOR" && user.doctor) {
    const doctor = user.doctor;
    const profilePath = `/doctorprofile/${user.id}`;

    return (
      <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-black dark:text-white font-bold leading-none">
            {doctor.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {doctor.specialization || "Specialist"}
          </p>
        </div>
        <div className="relative w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-600 overflow-hidden">
          <Link
            href={profilePath}
            className="w-full h-full flex items-center justify-center"
          >
            {doctor.profileImage ? (
              <Image
                src={doctor.profileImage}
                alt={doctor.name || "Doctor profile"}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {doctor.name.charAt(0)?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "RECEPTIONIST" && user.receptionist) {
    const receptionist = user.receptionist;
    const profilePath = `/receptionprofile/${user.id}`;

    return (
      <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-black dark:text-white font-bold leading-none">
            {receptionist.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {receptionist.shift} Shift
          </p>
        </div>
        <div className="relative w-10 h-10 rounded-full bg-green-100 border-2 border-green-600 overflow-hidden">
          <Link
            href={profilePath}
            className="w-full h-full flex items-center justify-center"
          >
            {receptionist.profileImage ? (
              <Image
                src={receptionist.profileImage}
                alt={receptionist.name || "Receptionist profile"}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                {receptionist.name.charAt(0)?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-600">
      <div className="text-right hidden sm:block">
        <p className="text-sm text-black dark:text-white font-bold leading-none capitalize">
          {user.role.toLowerCase().replace("_", " ")}
        </p>
        <p className="text-xs text-gray-500 mt-1">Staff</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-500 border-2 border-gray-400 flex items-center justify-center text-white font-bold text-sm">
        {user.role.charAt(0)}
      </div>
    </div>
  );
}
