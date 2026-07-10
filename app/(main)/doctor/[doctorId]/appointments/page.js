import Pagination from "@/components/Pagination";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

const ITEMS_PER_PAGE = 8;

const STATUS_FILTERS = [
  { key: "", label: "All Status" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "WAITING", label: "Waiting" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "CHECKED_IN", label: "Checked In" },
];

function buildListUrl(basePath, { status, page }) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimeRange(startTime, endTime) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const start = formatter.format(new Date(startTime));
  if (!endTime) return start;
  const end = formatter.format(new Date(endTime));
  return `${start} - ${end}`;
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

function getStatusBadge(status) {
  switch (status) {
    case "CHECKED_IN":
      return {
        label: formatAppointmentStatus(status),
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: "M5 13l4 4L19 7",
      };
    case "IN_PROGRESS":
      return {
        label: formatAppointmentStatus(status),
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      };
    case "WAITING":
      return {
        label: formatAppointmentStatus(status),
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      };
    default:
      return {
        label: formatAppointmentStatus(status),
        className:
          "bg-slate-100 text-slate-700 dark:bg-gray-700/30 dark:text-gray-400",
        icon: "M5 13l4 4L19 7",
      };
  }
}

export default async function AppointmentManagement({ params, searchParams }) {
  const { doctorId } = await params;
  const query = await searchParams;
  const basePath = `/doctor/${doctorId}/appointments`;

  const requestedPage = Number(query?.page);
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const statusFilter = Array.isArray(query?.status)
    ? query.status[0]
    : query?.status;
  const activeStatus =
    statusFilter && STATUS_FILTERS.some((filter) => filter.key === statusFilter)
      ? statusFilter
      : "";

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ id: doctorId }, { userId: doctorId }, { doctor_id: doctorId }],
    },
    select: {
      id: true,
      name: true,
      specialization: true,
    },
  });

  if (!doctor) {
    notFound();
  }

  const where = {
    doctorId: doctor.id,
    ...(activeStatus ? { status: activeStatus } : {}),
  };

  const totalAppointments = await prisma.appointment.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalAppointments / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    skip: (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      patient: {
        select: {
          fullname: true,
          patientId: true,
        },
      },
    },
  });

  return (
    <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <main className="max-w-[1400px] mx-auto p-6 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-gray-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              My Appointments
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal">
              Review your patient schedule and current appointment status.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {doctor.name} - {doctor.specialization}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeStatus === filter.key;
            const href = buildListUrl(basePath, { status: filter.key });

            return (
              <Link
                key={filter.key || "all"}
                href={href}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-blue-600/10 text-gray-700 dark:text-gray-300 hover:bg-blue-600/5"
                }`}
              >
                <span>{filter.label}</span>
                {filter.key === "" ? (
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border border-blue-600/10 bg-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-blue-600/10">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Patient Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Time Slot
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-600/5">
                {appointments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No appointments found
                      {activeStatus ? " for the current status" : ""}.
                    </td>
                  </tr>
                )}

                {appointments.map((appointment) => {
                  const badge = getStatusBadge(appointment.status);
                  const detailsHref = `/doctor/${doctorId}/appointments/appointmentdetails?id=${appointment.id}`;

                  return (
                    <tr
                      key={appointment.id}
                      className="hover:bg-blue-600/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(appointment.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        <Link
                          href={detailsHref}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {appointment.patient.fullname}
                        </Link>
                        <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                          {appointment.patient.patientId}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatTimeRange(
                          appointment.startTime,
                          appointment.endTime
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.className}`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={badge.icon}
                            />
                          </svg>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={detailsHref}
                          className="inline-flex text-gray-400 hover:text-blue-600 transition-colors"
                          title="View appointment details"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            name="appointments"
            currentPage={safeCurrentPage}
            totalItems={totalAppointments}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </main>
    </div>
  );
}
