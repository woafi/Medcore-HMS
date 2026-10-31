import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, DoorOpen, Stethoscope } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome } from "@/lib/getRoleHome";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAppointmentStatus(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    WAITING: "Waiting",
    IN_PROGRESS: "In Progress",
    CHECKED_IN: "Checked In",
  };
  return labels[status] ?? status;
}

function getAppointmentStatusClasses(status: string): string {
  switch (status) {
    case "CHECKED_IN":
      return "text-emerald-800 dark:text-emerald-400";
    case "IN_PROGRESS":
      return "text-blue-800 dark:text-blue-400";
    case "WAITING":
      return "text-amber-800 dark:text-amber-400";
    default:
      return "text-slate-800 dark:text-gray-300";
  }
}

function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// =========================
// DASHBOARD
// =========================

export default async function PatientDashboardPage({
  params,
}: PageProps) {
  const { patientId } = await params;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Patients can only see their own dashboard, other roles are sent to their home
  if (
    currentUser.role !== "PATIENT" ||
    (patientId !== currentUser.id &&
      patientId !== currentUser.userid)
  ) {
    redirect(getRoleHome(currentUser));
  }

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientId }, { patientId: patientId }, { userId: patientId }],
    },
    include: {
      appointments: {
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        include: {
          doctor: {
            select: {
              name: true,
              specialization: true,
              doctor_id: true,
              room: true,
            },
          },
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const now = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const upcomingAppointments = patient.appointments.filter(
    (appointment) => new Date(appointment.date) >= now
  );
  const todayAppointments = patient.appointments.filter(
    (appointment) => isSameDay(new Date(appointment.date), now)
  );

  const stats = [
    {
      label: "Total Appointments",
      value: patient.appointments.length,
    },
    {
      label: "Upcoming",
      value: upcomingAppointments.length,
    },
    {
      label: "Today",
      value: todayAppointments.length,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background text-gray-900 dark:text-gray-100">
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome header */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-blue-100 shrink-0">
              {patient.profileImage ? (
                <Image
                  src={patient.profileImage}
                  alt={patient.fullname}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {initialsFromName(patient.fullname)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white truncate">
                Welcome, {patient.fullname}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {patient.patientId}
              </p>
            </div>
            <Link
              href={`/patient/${patient.id}/profile`}
              className="ml-auto flex items-center gap-2 px-4 h-10 text-sm font-bold text-blue-700 border border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
            >
              My Profile
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Appointment details */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              My Appointments
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {patient.appointments.length} appointment
              {patient.appointments.length === 1 ? "" : "s"}
            </span>
          </div>

          {patient.appointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No appointments yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {patient.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  {/* Header: Doctor info + Time chip */}
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                          {appointment.doctor?.specialization || "Consultation"}
                        </p>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400">
                          {appointment.doctor?.name || "Doctor"}
                          {appointment.doctor?.doctor_id
                            ? ` · ${appointment.doctor.doctor_id}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                        {formatTime(appointment.startTime)} -{" "}
                        {formatTime(appointment.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Info row: Status · Visit date · Room */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2">
                    {/* Status */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[13px] py-2 font-medium ${getAppointmentStatusClasses(appointment.status)}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {formatAppointmentStatus(appointment.status)}
                      </span>
                    </div>

                    {/* Visit date */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Visit date
                      </span>
                      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-900 dark:text-white">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(appointment.date)}
                      </span>
                    </div>

                    {/* Room */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Room
                      </span>
                      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-900 dark:text-white">
                        <DoorOpen className="w-3.5 h-3.5 text-gray-400" />
                        Room {appointment.doctor?.room || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Booked at */}
                  <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500">
                    Booked on {formatDateTime(appointment.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
