import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  DoorOpen,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import prisma from "@/lib/prisma";

function formatGender(gender) {
  const labels = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return labels[gender] ?? gender;
}

function formatBloodGroup(bloodGroup) {
  if (!bloodGroup) return "-";
  return bloodGroup
    .replace(/_Positive$/, "+")
    .replace(/_Negative$/, "-")
    .replace(/_/g, " ");
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

function getStatusClasses(status) {
  switch (status) {
    case "CHECKED_IN":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "WAITING":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-gray-700/30 dark:text-gray-300";
  }
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
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTimeRange(startTime, endTime) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const start = formatter.format(new Date(startTime));
  const end = endTime ? formatter.format(new Date(endTime)) : "";
  return end ? `${start} - ${end}` : start;
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{label}</p>
        <div className="break-words font-medium text-gray-900 dark:text-white">{children}</div>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function DoctorAppointmentDetailsPage({ params, searchParams }) {
  const { doctorId } = await params;
  const query = await searchParams;
  const appointmentId = Array.isArray(query?.id) ? query.id[0] : query?.id;
  const appointmentsHref = `/doctor/${doctorId}/appointments`;

  if (!appointmentId) {
    return (
      <div className="flex flex-1 flex-col bg-background text-gray-900 dark:text-gray-100">
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Select an Appointment
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Open an appointment from the doctor appointment list to view patient and visit details.
            </p>
            <Link
              href={appointmentsHref}
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Back to Appointments
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctor: {
        OR: [{ id: doctorId }, { userId: doctorId }, { doctor_id: doctorId }],
      },
    },
    include: {
      patient: {
        include: {
          appointments: {
            orderBy: [{ date: "desc" }, { startTime: "desc" }],
            take: 6,
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
      },
      doctor: {
        select: {
          id: true,
          doctor_id: true,
          name: true,
          specialization: true,
          room: true,
        },
      },
    },
  });

  if (!appointment) {
    notFound();
  }

  const patient = appointment.patient;
  const age = calculateAge(patient.dateOfBirth, patient.age);
  const initials = initialsFromName(patient.fullname);
  const emergencyLabel = [patient.emergencyName, patient.relationship]
    .filter(Boolean)
    .join(patient.emergencyName && patient.relationship ? " - " : "");

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="order-2 hidden w-1/3 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-foreground dark:border-gray-800 lg:flex">
          <div className="border-b border-gray-100 p-6 text-center dark:border-gray-800">
            <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-gray-50 bg-blue-100 shadow-sm dark:border-gray-800">
              {patient.profileImage ? (
                <Image
                  src={patient.profileImage}
                  alt={patient.fullname}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-600 text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patient.fullname}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              {patient.patientId}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="rounded-lg bg-blue-600/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-600">
                {formatGender(patient.gender)}
              </span>
              {age != null ? (
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {age} years
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-6 p-6">
            {patient.allergies ? (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
                <div className="mb-1 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-tight">
                    Active Allergies
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {patient.allergies}
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/20">
              <div className="mb-1 flex items-center gap-2 text-blue-600">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-tight">Blood Group</span>
              </div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {formatBloodGroup(patient.bloodGroup)}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Contact Information
              </h3>
              <InfoRow icon={Phone} label="Phone">
                {patient.phone || "-"}
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                {patient.email || "-"}
              </InfoRow>
              <InfoRow icon={MapPin} label="Address">
                {patient.address || "-"}
              </InfoRow>
              {(emergencyLabel || patient.emergencyPhone) && (
                <InfoRow icon={AlertTriangle} label="Emergency Contact">
                  {emergencyLabel || "-"}
                  {patient.emergencyPhone ? (
                    <p className="mt-0.5 font-normal text-gray-500 dark:text-gray-400">
                      {patient.emergencyPhone}
                    </p>
                  ) : null}
                </InfoRow>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <Link
              href={appointmentsHref}
              className="flex w-full items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Back to Appointments
            </Link>
          </div>
        </aside>

        <main className="order-1 flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-foreground px-6 py-4 backdrop-blur-md dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  href={appointmentsHref}
                  className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Back to appointments
                </Link>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  Appointment Details
                </h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {patient.fullname} - {patient.patientId}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${getStatusClasses(
                  appointment.status
                )}`}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {formatAppointmentStatus(appointment.status)}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-blue-100 lg:hidden">
                      {patient.profileImage ? (
                        <Image
                          src={patient.profileImage}
                          alt={patient.fullname}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-600 font-bold text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                        Current Visit
                      </p>
                      <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                        {appointment.doctor.specialization}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dr. {appointment.doctor.name}
                        {appointment.doctor.doctor_id ? ` - ${appointment.doctor.doctor_id}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {appointment.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailCard icon={CalendarDays} label="Visit Date" value={formatDate(appointment.date)} />
                <DetailCard
                  icon={Clock}
                  label="Time Slot"
                  value={formatTimeRange(appointment.startTime, appointment.endTime)}
                />
                <DetailCard
                  icon={DoorOpen}
                  label="Room"
                  value={appointment.doctor.room ? `Room ${appointment.doctor.room}` : "Room TBD"}
                />
                <DetailCard
                  icon={Stethoscope}
                  label="Department"
                  value={appointment.doctor.specialization}
                />
              </div>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Patient Record
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Registered {formatDate(patient.createdAt)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow icon={UserRound} label="Date of Birth">
                    {formatDate(patient.dateOfBirth)}
                  </InfoRow>
                  <InfoRow icon={UserRound} label="Gender">
                    {formatGender(patient.gender)}
                  </InfoRow>
                  <InfoRow icon={UserRound} label="Blood Group">
                    {formatBloodGroup(patient.bloodGroup)}
                  </InfoRow>
                  <InfoRow icon={Phone} label="Phone">
                    {patient.phone || "-"}
                  </InfoRow>
                  <InfoRow icon={Mail} label="Email">
                    {patient.email || "-"}
                  </InfoRow>
                  <InfoRow icon={MapPin} label="Address">
                    {patient.address || "-"}
                  </InfoRow>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Recent Appointment History
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {patient.appointments.length} recent visit
                    {patient.appointments.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-4">
                  {patient.appointments.map((visit) => (
                    <article
                      key={visit.id}
                      className={`rounded-xl border p-4 ${
                        visit.id === appointment.id
                          ? "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Stethoscope className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {visit.doctor?.specialization || "Consultation"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Dr. {visit.doctor?.name || "Doctor"}
                              {visit.doctor?.doctor_id ? ` - ${visit.doctor.doctor_id}` : ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                            visit.status
                          )}`}
                        >
                          {formatAppointmentStatus(visit.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-200 pt-3 text-sm dark:border-gray-800 sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          {formatDate(visit.date)}
                        </span>
                        <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          {formatTimeRange(visit.startTime, visit.endTime)}
                        </span>
                        <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <DoorOpen className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          {visit.doctor?.room ? `Room ${visit.doctor.room}` : "Room TBD"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
