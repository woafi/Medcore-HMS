"use client";

import { use, useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Pusher from "pusher-js";
import AppointmentSortSelect from "@/components/AppointmentSortSelect";
import BookAppointment from "@/components/BookAppointment";
import DeleteAppointmentButton from "@/components/DeleteAppointmentButton";
import Pagination from "@/components/Pagination";
import AppointmentTableSearch from "@/components/AppointmentTableSearch";

// ─── Constants ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 8;

const STATUS_FILTERS = [
  { key: "", label: "All Status" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "WAITING", label: "Waiting" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "CHECKED_IN", label: "Checked In" },
] as const;

// ─── Types ──────────────────────────────────────────────────────────────────

type AppointmentResponse = {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  status: string;
  slotId: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    fullname: string;
    patientId: string;
    phone: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string;
    doctor_id: string;
  };
};

type ApiResponse = {
  appointments: AppointmentResponse[];
  total: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
};

type PageProps = {
  params: Promise<{ receptionistId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildListUrl(
  basePath: string,
  { status, sort, q, page }: { status: string; sort: string; q: string; page: number | undefined }
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (sort && sort !== "latest") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "\u2014";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimeRange(startTime: string, endTime: string | null | undefined): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const start = formatter.format(new Date(startTime));
  if (!endTime) return start;
  const end = formatter.format(new Date(endTime));
  return `${start} \u2013 ${end}`;
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

function getStatusBadge(status: string) {
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

// ─── Inner Component (uses hooks) ───────────────────────────────────────────

function AppointmentManagementContent({
  receptionistId,
}: {
  receptionistId: string;
}) {
  const searchParams = useSearchParams();
  const basePath = `/receptionist/${receptionistId}/appointments`;

  // ── Extract URL params ──────────────────────────────────────────────────
  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const statusParam = searchParams.get("status") || "";
  const activeStatus = STATUS_FILTERS.some((f) => f.key === statusParam)
    ? statusParam
    : "";

  const sortParam = searchParams.get("sort") || "latest";
  const activeSort = ["latest", "department", "doctor"].includes(sortParam)
    ? sortParam
    : "latest";

  const activeQuery = (searchParams.get("q") || "").trim();

  // ── State ───────────────────────────────────────────────────────────────
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      if (activeQuery) params.set("q", activeQuery);
      if (activeStatus) params.set("status", activeStatus);
      if (activeSort !== "latest") params.set("sort", activeSort);

      const res = await fetch(`/api/appointment?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [currentPage, activeStatus, activeSort, activeQuery]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Real-time updates via Pusher ────────────────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe("reception-dashboard");

    channel.bind("appointments-updated", () => {
      fetchAppointments({ silent: true });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("reception-dashboard");
      pusher.disconnect();
    };
  }, [fetchAppointments]);

  // ── Derived state ───────────────────────────────────────────────────────
  const appointments = data?.appointments ?? [];
  const totalAppointments = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <main className="max-w-[1400px] mx-auto p-6 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-gray-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              Appointment Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal">
              Efficiently track and manage hospital scheduling workflows.
            </p>
          </div>
          <BookAppointment />
        </div>

        <AppointmentTableSearch key={activeQuery} defaultValue={activeQuery} />

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeStatus === filter.key;
            const href = buildListUrl(basePath, {
              status: filter.key,
              sort: activeSort,
              q: activeQuery,
              page: currentPage > 1 ? currentPage : undefined,
            });

            return (
              <Link
                key={filter.key || "all"}
                href={href}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-blue-600/10 text-gray-700 dark:text-gray-300 hover:bg-blue-600/5"
                  }`}
              >
                <span>{filter.label}</span>
                {filter.key === "" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <AppointmentSortSelect currentSort={activeSort} />
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="rounded-xl border border-blue-600/10 bg-foreground shadow-sm overflow-hidden">
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading appointments...</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && data && !error && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Updating appointments...
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchAppointments()}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {(!isLoading || data) && !error && (
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
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Department
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
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No appointments found
                        {activeQuery ? ` for "${activeQuery}"` : ""}
                        {activeStatus ? " with the current status filter" : ""}.
                      </td>
                    </tr>
                  )}

                  {appointments.map((appointment) => {
                    const badge = getStatusBadge(appointment.status);
                    const profileHref = `/patientprofile/${appointment.patient.id}`;

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
                            href={profileHref}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {appointment.patient.fullname}
                          </Link>
                          <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                            {appointment.patient.patientId}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {appointment.doctor.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/10 text-blue-600">
                            {appointment.doctor.specialization}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatTimeRange(appointment.startTime, appointment.endTime)}
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
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={profileHref}
                              className="inline-flex text-gray-400 hover:text-blue-600 transition-colors"
                              title="View patient profile"
                            >
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
                            <DeleteAppointmentButton
                              appointmentId={appointment.id}
                              patientName={appointment.patient.fullname}
                            />
                          </div>
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
        )}
      </main>
    </div>
  );
}

// ─── Page Component (Suspense wrapper) ──────────────────────────────────────

export default function AppointmentManagement({ params }: PageProps) {
  const { receptionistId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
          <main className="max-w-[1400px] mx-auto p-6">
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading page...</p>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <AppointmentManagementContent receptionistId={receptionistId} />
    </Suspense>
  );
}
