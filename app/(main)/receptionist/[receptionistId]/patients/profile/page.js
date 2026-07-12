import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Stethoscope, Clock, CheckCircle2, CalendarDays, DoorOpen } from "lucide-react";
import prisma from "@/lib/prisma";

function formatGender(gender) {
  const labels = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return labels[gender] ?? gender;
}

function formatBloodGroup(bloodGroup) {
  if (!bloodGroup) return "—";
  return bloodGroup
    .replace(/_Positive$/, "+")
    .replace(/_Negative$/, "-")
    .replace(/_/g, " ");
}

function calculateAge(dateOfBirth, storedAge) {
  if (storedAge != null) return storedAge;
  if (!dateOfBirth) return null;

  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
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

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAppointmentStatus(status) {
  const labels = {
    SCHEDULED: "Scheduled",
    WAITING: "Waiting",
    IN_PROGRESS: "In Progress",
    CHECKED_IN: "Checked In",
  };
  return labels[status] ?? status;
}

function getAppointmentStatusClasses(status) {
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

function ContactRow({ icon, label, children }) {
  return (
    <div className="flex gap-3">
      <svg
        className="w-5 h-5 shrink-0 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <div className="text-sm min-w-0">
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">{label}</p>
        <div className="font-medium text-gray-900 dark:text-white break-words">{children}</div>
      </div>
    </div>
  );
}

export default async function PatientProfilePage({ params, searchParams }) {
  const { receptionistId } = await params;
  const query = await searchParams;
  const rawId = Array.isArray(query?.id) ? query.id[0] : query?.id;
  const patientsListHref = `/receptionist/${receptionistId}/patients`;

  if (!rawId) {
    return (
      <div className="flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100">
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8 lg:px-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Select a Patient
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Open a patient profile from the directory using the view action, or add{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-900">?id=</code>{" "}
              with the patient record id in the URL.
            </p>
            <Link
              href={patientsListHref}
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Back to Patient Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: rawId }, { patientId: rawId }],
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

  const age = calculateAge(patient.dateOfBirth, patient.age);
  const initials = initialsFromName(patient.fullname);
  const emergencyLabel = [patient.emergencyName, patient.relationship]
    .filter(Boolean)
    .join(patient.emergencyName && patient.relationship ? " · " : "");

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — patient summary */}
        <aside className="order-2 flex w-1/3 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-foreground overflow-y-auto">
          <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
            <div className="relative inline-block mb-4">
              <div className="relative w-24 h-24 rounded-full border-4 border-gray-50 dark:border-gray-800 shadow-sm mx-auto overflow-hidden bg-blue-100">
                {patient.profileImage ? (
                  <Image
                    src={patient.profileImage}
                    alt={patient.fullname}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patient.fullname}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
              {patient.patientId}
            </p>
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              <span className="px-2 py-1 bg-blue-600/10 text-blue-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                {formatGender(patient.gender)}
              </span>
              {age != null ? (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                  {age} years
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {patient.allergies ? (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-tight">Active Allergies</span>
                </div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {patient.allergies}
                </p>
              </div>
            ) : null}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                <span className="text-xs font-bold uppercase tracking-tight">Blood Group</span>
              </div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {formatBloodGroup(patient.bloodGroup)}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Contact Information
              </h3>
              <ContactRow
                icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                label="Phone"
              >
                {patient.phone || "—"}
              </ContactRow>
              <ContactRow
                icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                label="Email"
              >
                {patient.email || "—"}
              </ContactRow>
              {(emergencyLabel || patient.emergencyPhone) && (
                <ContactRow
                  icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  label="Emergency Contact"
                >
                  <>
                    {emergencyLabel || "—"}
                    {patient.emergencyPhone ? (
                      <p className="text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                        {patient.emergencyPhone}
                      </p>
                    ) : null}
                  </>
                </ContactRow>
              )}
              <ContactRow
                icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                label="Address"
              >
                {patient.address || "—"}
              </ContactRow>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Record Details
              </h3>
              <div className="text-sm space-y-2">
                <p>
                  <span className="text-gray-500 dark:text-gray-400">Date of birth: </span>
                  <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400">Registered: </span>
                  <span className="font-medium">{formatDate(patient.createdAt)}</span>
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400">Last updated: </span>
                  <span className="font-medium">{formatDateTime(patient.updatedAt)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              href={patientsListHref}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Directory
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="order-1 flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
          <div className="sticky top-0 z-10 bg-foreground backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  href={patientsListHref}
                  className="lg:hidden inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Patients
                </Link>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  Patient 360 View
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 lg:hidden">
                  {patient.fullname} · {patient.patientId}
                </p>
                <p className="text-gray-400 text-sm font-medium hidden lg:block">
                  Last updated {formatDateTime(patient.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/receptionist/${receptionistId}/appointments`}
                  className="flex items-center gap-2 px-4 h-10 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-600/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile summary card */}
          <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">
                  {patient.fullname}
                </p>
                <p className="text-xs text-gray-500">{patient.patientId}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Appointment History
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {patient.appointments.length} visit
                  {patient.appointments.length === 1 ? "" : "s"}
                </span>
              </div>

              {patient.appointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No appointments on record yet.
                  </p>
                  <Link
                    href={`/receptionist/${receptionistId}/appointments`}
                    className="mt-4 inline-flex text-sm font-bold text-blue-600 hover:underline"
                  >
                    Schedule an appointment
                  </Link>
                </div>
              ) : (
                <div className="relative space-y-8 pb-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                  {patient.appointments.map((appointment) => (
                    <article key={appointment.id} className="relative flex gap-6 z-10">
                      <div className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-gray-50 dark:ring-gray-950">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">

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
                                {appointment.doctor?.doctor_id ? ` · ${appointment.doctor.doctor_id}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                              {formatDateTime(appointment.startTime)}
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
                            <span className={`inline-flex items-center gap-1 text-[13px] py-2 font-medium ${getAppointmentStatusClasses(appointment.status)}`}>
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
                              Room {appointment.doctor?.room}
                            </span>
                          </div>

                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
