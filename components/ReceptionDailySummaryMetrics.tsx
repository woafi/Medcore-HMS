"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Pusher from "pusher-js";
import Image from "next/image";
import Link from "next/link";

import AppointmentCalender from "@/components/AppointmentCalender";
import AppointmentButton from "@/components/AppointmentButton";

const STATUS_LABELS = {
  SCHEDULED: "Scheduled",
  WAITING: "Waiting",
  IN_PROGRESS: "In Progress",
  CHECKED_IN: "Checked In",
};

const STATUS_ACTIONS = ["SCHEDULED", "WAITING"];

function formatDateKey(date) {
  const selected = Array.isArray(date) ? date?.[0] : date;
  const safeDate = selected instanceof Date ? selected : new Date();
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDashboardDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatusBadgeClasses(status) {
  switch (status) {
    case "CHECKED_IN":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "WAITING":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300";
    case "SCHEDULED":
    default:
      return "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200";
  }
}

const emptyMetrics = {
  total: 0,
  patientSeen: 0,
  remaining: 0,
  inProgress: 0,
  waiting: 0,
  completionPercent: 0,
};

const ReceptionDailySummaryMetrics = ({ receptionist, receptionistId, pusherConfig }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const todayLabel = useMemo(() => formatDashboardDate(selectedDate), [selectedDate]);
  const isRealtimeEnabled = Boolean(pusherConfig?.key && pusherConfig?.cluster);

  const fetchDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        const params = new URLSearchParams({
          receptionistId,
          date: dateKey,
        });
        const response = await fetch(`/api/receptiondashboard?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Dashboard data could not be loaded.");
        }

        setMetrics(payload.metrics || emptyMetrics);
        setAppointments(payload.appointments || []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [dateKey, receptionistId]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!isRealtimeEnabled) return undefined;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });
    const channel = pusher.subscribe(pusherConfig.channel);

    channel.bind(pusherConfig.event, (payload) => {
      const eventDateKey = payload?.date ? formatDateKey(new Date(payload.date)) : dateKey;

      if (eventDateKey === dateKey) {
        fetchDashboard({ silent: true });
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(pusherConfig.channel);
      pusher.disconnect();
    };
  }, [dateKey, fetchDashboard, isRealtimeEnabled, pusherConfig]);

  const updateAppointmentStatus = async (appointmentId, status) => {
    setUpdatingId(appointmentId);
    setError("");

    try {
      const response = await fetch("/api/receptiondashboard", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId,
          status,
          receptionistId,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Appointment status could not be updated.");
      }

      await fetchDashboard({ silent: true });
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <main className="max-w-[1400px] mx-auto p-6 space-y-8 pb-20">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="shrink-0 text-xs sm:text-sm font-medium px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-black/5 dark:border-white/10">
              Receptionist ID: {receptionist.receptionists_id}
            </div>
            <div className="shrink-0 text-xs sm:text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/15">
              {isRealtimeEnabled ? "Realtime active" : "Realtime env missing"}
            </div>
            {isRefreshing ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">Refreshing...</span>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur p-5 rounded-2xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <span className="scale-130 material-symbols-outlined">how_to_reg</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Patients Seen
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {isLoading ? "..." : metrics.patientSeen}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur p-5 rounded-2xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                <span className="material-symbols-outlined scale-130">event_available</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Remaining Appointments
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {isLoading ? "..." : metrics.remaining}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur p-5 rounded-2xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center justify-center">
                <span className="material-symbols-outlined scale-130">schedule</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {isLoading ? "..." : metrics.inProgress}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur p-5 rounded-2xl border border-black/5 dark:border-white/10 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/25 flex items-center justify-center text-orange-600 dark:text-orange-300">
                <span className="scale-130 material-symbols-outlined">hourglass_empty</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Waiting
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {isLoading ? "..." : metrics.waiting}
                </p>
              </div>
            </div>

            <div className="sm:col-span-2 bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Day Progress
                </p>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {metrics.patientSeen} / {metrics.total} patients
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden"
                role="progressbar"
                aria-label="Day progress"
                aria-valuenow={metrics.completionPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${metrics.completionPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {metrics.completionPercent}% complete - {metrics.remaining} appointments remaining
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <AppointmentCalender value={selectedDate} onChange={setSelectedDate} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">
              Today&apos;s appointments
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {todayLabel} - {appointments.length} scheduled
            </p>
          </div>

          <a
            href={`/receptionist/${receptionistId}/appointments`}
            className="px-3 py-2 rounded-xl text-sm font-semibold bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-colors"
          >
            Directory
          </a>
        </div>

        <div className="border-t border-black/5 dark:border-white/10">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading dashboard...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300">
                <span className="material-symbols-outlined">event</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-50">
                No appointments yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add an appointment or pick another date from the calendar.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {appointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="px-5 sm:px-6 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-4 justify-between">
                    <div className="flex items-center gap-3 xl:w-56">
                      <div className="shrink-0 px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/15 text-xs font-bold tracking-wide">
                        {appointment.time}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                        {appointment.id.slice(0, 8)}
                      </div>
                    </div>
                    <Link href={`/receptionist/${receptionistId}/patients/profile?id=${appointment.patient.id}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-100">
                          {appointment.patient.profileImage ? (
                            <Image
                              src={appointment.patient.profileImage}
                              alt={appointment.patient.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {appointment.patient.initials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-50 truncate">
                              {appointment.patient.name}
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClasses(
                                appointment.status
                              )}`}
                            >
                              {STATUS_LABELS[appointment.status]}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {appointment.doctor.specialization} - {appointment.doctor.name} - Room{" "}
                            {appointment.doctor.room || "TBD"} - {appointment.patient.phone}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-wrap items-center justify-end gap-2 xl:w-[430px]">
                      {STATUS_ACTIONS.map((status) => (
                        <AppointmentButton
                          key={status}
                          text={STATUS_LABELS[status]}
                          disabled={appointment.status === status || updatingId === appointment.id}
                          onClick={() => updateAppointmentStatus(appointment.id, status)}
                        />
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};

export default ReceptionDailySummaryMetrics;
