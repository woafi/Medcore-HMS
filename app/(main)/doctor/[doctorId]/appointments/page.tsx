"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Pusher from "pusher-js";
import Pagination from "@/components/Pagination";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatientInfo {
  id: string;
  fullname: string;
  patientId: string;
  phone: string | null;
}

interface AppointmentDoctorInfo {
  id: string;
  name: string;
  specialization: string;
  doctor_id: string | null;
}

interface SerializedAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  status: string;
  slotId: string | null;
  createdAt: string;
  updatedAt: string;
  patient: PatientInfo;
  doctor: AppointmentDoctorInfo;
}

interface DoctorInfo {
  name: string;
  specialization: string;
}

interface ApiResponse {
  appointments: SerializedAppointment[];
  total: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  doctorInfo: DoctorInfo | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "", label: "All Status" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "WAITING", label: "Waiting" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "CHECKED_IN", label: "Checked In" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
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
  return `${start} - ${end}`;
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

function buildListUrl(basePath: string, { status }: { status?: string }) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

// ─── Main Content (requires Suspense boundary for useSearchParams) ───────────

function AppointmentContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const doctorId = typeof params?.doctorId === "string" ? params.doctorId : "";
  const basePath = `/doctor/${doctorId}/appointments`;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorNotFound, setDoctorNotFound] = useState(false);

  // Read query params
  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const statusFilter = searchParams.get("status") || "";
  const activeStatus = STATUS_FILTERS.some(
    (f) => f.key === statusFilter
  )
    ? statusFilter
    : "";

  // Fetch data when params change
  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (silent) return;
    setLoading(true);
    setError(null);
    setDoctorNotFound(false);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(currentPage));
      if (activeStatus) queryParams.set("status", activeStatus);
      if (doctorId) queryParams.set("doctorId", doctorId);

      const res = await fetch(`/api/appointment?${queryParams.toString()}`);

      if (res.status === 404) {
        setDoctorNotFound(true);
        setData(null);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const result: ApiResponse = await res.json();

      if (!result.doctorInfo) {
        setDoctorNotFound(true);
        setData(null);
        return;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentPage, activeStatus]);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments({ silent: false });
    }
  }, [fetchAppointments, doctorId]);

  // ── Real-time updates via Pusher ────────────────────────────────────────
  const fetchAppointmentsSilent = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(currentPage));
      if (activeStatus) queryParams.set("status", activeStatus);
      if (doctorId) queryParams.set("doctorId", doctorId);

      const res = await fetch(`/api/appointment?${queryParams.toString()}`);

      if (res.status === 404 || !res.ok) return;

      const result: ApiResponse = await res.json();

      if (!result.doctorInfo) return;

      setData(result);
    } catch {
      // silent fail
    }
  }, [doctorId, currentPage, activeStatus]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe("doctor-dashboard");

    channel.bind("appointments-updated", () => {
      fetchAppointmentsSilent();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("doctor-dashboard");
      pusher.disconnect();
    };
  }, [fetchAppointmentsSilent]);

  // ─── Render states ─────────────────────────────────────────────────────────

  // Doctor not found
  if (doctorNotFound) {
    return (
      <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
        <main className="max-w-[1400px] mx-auto p-6 space-y-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Doctor Not Found
              </h1>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                The doctor you are looking for does not exist or has been removed.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
        <main className="max-w-[1400px] mx-auto p-6 space-y-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm font-medium">Loading appointments...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
        <main className="max-w-[1400px] mx-auto p-6 space-y-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-900/40 dark:bg-red-950/20">
              <h1 className="text-2xl font-black tracking-tight text-red-700 dark:text-red-400">
                Something went wrong
              </h1>
              <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // No data yet (fallback)
  if (!data || !data.doctorInfo) {
    return null;
  }

  const { appointments, total, doctorInfo } = data;

  // ─── Normal render ─────────────────────────────────────────────────────────

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
              {doctorInfo.name} - {doctorInfo.specialization}
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
                  const detailsHref = `/patientprofile/${appointment.patient.patientId}`;

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
            currentPage={data.currentPage}
            totalItems={total}
            itemsPerPage={data.itemsPerPage}
          />
        </div>
      </main>
    </div>
  );
}

// ─── Wrapper with Suspense (required for useSearchParams) ────────────────────

export default function AppointmentManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
          <main className="max-w-[1400px] mx-auto p-6 space-y-8">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-sm font-medium">Loading appointments...</span>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <AppointmentContent />
    </Suspense>
  );
}
