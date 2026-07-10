import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

// export const dynamic = "force-dynamic";

const dayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatGender(gender) {
  const labels = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return labels[gender] ?? gender;
}

function formatStatus(status) {
  return String(status ?? "").replace(/_/g, " ");
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFee(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function initialsFromName(name) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function FieldCard({ label, children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        {icon}
      </span>
      {children}
    </h2>
  );
}

function ActiveBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
        active
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ScheduleCard({ availabilities }) {
  const sortedAvailabilities = [...availabilities].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  return (
    <section className="space-y-4 lg:col-span-2">
      <SectionTitle
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
      >
        Weekly Availability
      </SectionTitle>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {sortedAvailabilities.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            No availability schedule has been assigned.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedAvailabilities.map((availability) => (
              <div
                key={availability.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[160px_160px_1fr] md:items-center"
              >
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {availability.day}
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {formatStatus(availability.status)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availability.available_slots.length === 0 ? (
                    <span className="text-sm text-gray-400">No slots</span>
                  ) : (
                    availability.available_slots.map((slot) => (
                      <span
                        key={slot.id}
                        className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default async function DoctorProfilePage({ params }) {
  const { doctorId } = await params;

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ id: doctorId }, { userId: doctorId }],
    },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      availabilities: {
        include: {
          available_slots: {
            orderBy: { startTime: "asc" },
          },
        },
      },
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  const initials = initialsFromName(doctor.name);

  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background font-sans text-gray-900 dark:text-gray-100">
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-6 lg:p-10">
        <section className="rounded-xl border border-gray-200 bg-foreground p-6 shadow-sm dark:border-gray-800">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-gray-100 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg dark:border-gray-800">
                {doctor.profileImage ? (
                  <Image
                    src={doctor.profileImage}
                    alt={`${doctor.name} profile photo`}
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {doctor.name}
                </h1>
                <p className="mt-1 text-lg font-semibold text-primary">
                  {doctor.specialization}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-3 md:justify-start">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    ID {doctor.doctor_id}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Room {doctor.room ?? "Not assigned"}
                  </span>
                  <ActiveBadge active={doctor.isActive} />
                </div>
              </div>
            </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                  Fee
                </p>
                <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                  {formatFee(doctor.consultationFee)}
                </p>
              </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <SectionTitle
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              Professional Details
            </SectionTitle>

            <FieldCard label="Qualification">{doctor.qualification}</FieldCard>
            <FieldCard label="Specialization">{doctor.specialization}</FieldCard>
            <FieldCard label="Gender">{formatGender(doctor.gender)}</FieldCard>
            <FieldCard label="Professional Summary">{doctor.bio}</FieldCard>
          </section>

          <section className="space-y-4">
            <SectionTitle
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              Account Details
            </SectionTitle>

            <FieldCard label="Email">
              <span className="break-all">{doctor.user.email}</span>
            </FieldCard>
            <FieldCard label="Phone">{doctor.user.phone}</FieldCard>
            <FieldCard label="Account Created">{formatDateTime(doctor.user.createdAt)}</FieldCard>
            <FieldCard label="Last Sign-In">{formatDateTime(doctor.user.lastLoginAt)}</FieldCard>
          </section>

          <ScheduleCard availabilities={doctor.availabilities} />
        </div>
      </main>
    </div>
  );
}
