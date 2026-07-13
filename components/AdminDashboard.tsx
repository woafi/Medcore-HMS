"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Pusher from "pusher-js";
import {
  Activity,
  CalendarCheck,
  CircleUserRound,
  ClipboardList,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

interface GenderData {
  male: number;
  female: number;
  other: number;
}

interface WeeklyPatientRow {
  key: string;
  label: string;
  male: number;
  female: number;
}

interface AppointmentStatuses {
  SCHEDULED: number;
  WAITING: number;
  IN_PROGRESS: number;
  CHECKED_IN: number;
}

interface LogEntry {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  time: string;
}

interface DashboardData {
  metrics: {
    doctors: number;
    patients: number;
    receptionists: number;
    appointments: number;
    todayAppointments: number;
  };
  gender: GenderData;
  weeklyPatients: WeeklyPatientRow[];
  appointmentStatuses: AppointmentStatuses;
  entityLogs: LogEntry[];
  appointmentLogs: LogEntry[];
  generatedAt: string;
}

interface PusherConfig {
  key: string;
  cluster: string;
  channel: string;
  event: string;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  caption: string;
  icon: LucideIcon;
  tone: string;
}

interface GenderCircleProps {
  gender: GenderData;
}

interface WeeklyPatientChartProps {
  rows: WeeklyPatientRow[];
}

interface EntityLogsProps {
  logs: LogEntry[];
}

interface AppointmentLogsProps {
  logs: LogEntry[];
  statuses: AppointmentStatuses;
}

interface AdminDashboardProps {
  pusherConfig: PusherConfig;
}

// ── Constants ─────────────────────────────────────────────────────────

const emptyDashboard: DashboardData = {
  metrics: {
    doctors: 0,
    patients: 0,
    receptionists: 0,
    appointments: 0,
    todayAppointments: 0,
  },
  gender: {
    male: 0,
    female: 0,
    other: 0,
  },
  weeklyPatients: [],
  appointmentStatuses: {
    SCHEDULED: 0,
    WAITING: 0,
    IN_PROGRESS: 0,
    CHECKED_IN: 0,
  },
  entityLogs: [],
  appointmentLogs: [],
  generatedAt: "",
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  WAITING: "Waiting",
  IN_PROGRESS: "In Progress",
  CHECKED_IN: "Checked In",
};

const statusClasses: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200",
  WAITING: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CHECKED_IN:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const logIconClasses: Record<string, string> = {
  patient: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  doctor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  receptionist:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

// ── Sub-Components ────────────────────────────────────────────────────

function MetricCard({ title, value, caption, icon: Icon, tone }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0d1117]/70 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-black text-gray-950 dark:text-gray-50">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
            {caption}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function GenderCircle({ gender }: GenderCircleProps) {
  const total = gender.male + gender.female + gender.other;
  const malePercent = total ? Math.round((gender.male / total) * 100) : 0;
  const femalePercent = total ? Math.round((gender.female / total) * 100) : 0;
  const otherPercent = Math.max(0, 100 - malePercent - femalePercent);
  const gradient =
    total === 0
      ? "conic-gradient(#e5e7eb 0deg 360deg)"
      : `conic-gradient(#2563eb 0deg ${malePercent * 3.6}deg, #db2777 ${
          malePercent * 3.6
        }deg ${(malePercent + femalePercent) * 3.6}deg, #64748b ${
          (malePercent + femalePercent) * 3.6
        }deg 360deg)`;

  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0d1117]/70 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-50">
            Patient Gender
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live patient distribution
          </p>
        </div>
        <CircleUserRound className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div
          className="grid h-48 w-48 place-items-center rounded-full"
          style={{ background: gradient }}
          aria-label={`Male ${malePercent} percent, female ${femalePercent} percent`}
        >
          <div className="grid h-32 w-32 place-items-center rounded-full bg-white dark:bg-[#0d1117]">
            <div className="text-center">
              <p className="text-3xl font-black text-gray-950 dark:text-gray-50">
                {total}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Patients
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid w-full grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">
              {gender.male}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Male
            </p>
          </div>
          <div className="rounded-xl bg-pink-50 p-3 dark:bg-pink-900/20">
            <p className="text-lg font-black text-pink-700 dark:text-pink-300">
              {gender.female}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Female
            </p>
          </div>
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-white/10">
            <p className="text-lg font-black text-slate-700 dark:text-slate-200">
              {otherPercent ? gender.other : 0}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Other
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyPatientChart({ rows }: WeeklyPatientChartProps) {
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.male, row.female]));

  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0d1117]/70 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-50">
            Weekly Patients
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Male and female registrations over the last 7 days
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Male
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-600" />
            Female
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-72 items-end gap-3 overflow-x-auto pb-2">
        {rows.map((row) => (
          <div key={row.key} className="flex min-w-16 flex-1 flex-col items-center gap-3">
            <div className="flex h-56 w-full items-end justify-center gap-2 rounded-xl bg-black/[0.03] px-2 py-3 dark:bg-white/[0.04]">
              <div
                className="w-4 rounded-t-lg bg-blue-600 transition-all"
                style={{ height: `${Math.max(8, (row.male / maxValue) * 100)}%` }}
                title={`${row.male} male patients`}
              />
              <div
                className="w-4 rounded-t-lg bg-pink-600 transition-all"
                style={{ height: `${Math.max(8, (row.female / maxValue) * 100)}%` }}
                title={`${row.female} female patients`}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {row.label}
              </p>
              <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                {row.male + row.female}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Map for entity log icon lookup
const IconByType: Record<string, LucideIcon> = {
  patient: UserRound,
  doctor: Stethoscope,
  receptionist: UsersRound,
};

function EntityLogs({ logs }: EntityLogsProps) {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0d1117]/70 p-6 shadow-sm backdrop-blur">
      <h2 className="text-lg font-bold text-gray-950 dark:text-gray-50">
        Live Added Logs
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Latest patient, doctor, and receptionist additions
      </p>

      <div className="mt-6 space-y-4 max-h-80 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="rounded-xl bg-black/[0.03] p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
            No recent additions yet.
          </p>
        ) : (
          logs.map((log) => {
            const Icon = IconByType[log.type] || Activity;

            return (
              <div key={log.id} className="flex gap-3">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    logIconClasses[log.type] || logIconClasses.patient
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-50">
                    {log.message}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase text-gray-400 dark:text-gray-500">
                    {log.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AppointmentLogs({ logs, statuses }: AppointmentLogsProps) {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0d1117]/70 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-50">
            Appointment Status Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest status activity across the hospital
          </p>
        </div>
        <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.entries(statusLabels) as [string, string][]).map(([status, label]) => (
          <div key={status} className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
            <p className="text-xl font-black text-gray-950 dark:text-gray-50">
              {statuses[status as keyof AppointmentStatuses] || 0}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4 max-h-80 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="rounded-xl bg-black/[0.03] p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
            No appointment status updates yet.
          </p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-50">
                  {log.message}
                </p>
                <p className="mt-1 text-xs font-medium uppercase text-gray-400 dark:text-gray-500">
                  {log.time}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusClasses[log.type] || statusClasses.SCHEDULED
                }`}
              >
                {statusLabels[log.type] || log.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function AdminDashboard({ pusherConfig }: AdminDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const isRealtimeEnabled = Boolean(pusherConfig?.key && pusherConfig?.cluster);

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admindashboard");
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Dashboard data could not be loaded.");
      }

      setDashboard({ ...emptyDashboard, ...payload });
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!isRealtimeEnabled) return undefined;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });
    const channel = pusher.subscribe(pusherConfig.channel);

    channel.bind(pusherConfig.event, () => {
      fetchDashboard({ silent: true });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(pusherConfig.channel);
      pusher.disconnect();
    };
  }, [fetchDashboard, isRealtimeEnabled, pusherConfig]);

  const generatedLabel = useMemo(() => {
    if (!dashboard.generatedAt) return "";

    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dashboard.generatedAt));
  }, [dashboard.generatedAt]);

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-gray-50">
            Admin Dashboard
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Hospital activity, patient mix, and appointment flow
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {isRealtimeEnabled ? "Realtime active" : "Realtime env missing"}
          </span>
          {isRefreshing ? (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Refreshing...
            </span>
          ) : null}
          {generatedLabel ? (
            <span className="rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
              Updated {generatedLabel}
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Doctors"
          value={isLoading ? "..." : dashboard.metrics.doctors}
          caption="Registered clinicians"
          icon={Stethoscope}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        />
        <MetricCard
          title="Total Patients"
          value={isLoading ? "..." : dashboard.metrics.patients}
          caption="Patient records"
          icon={UsersRound}
          tone="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <MetricCard
          title="Receptionists"
          value={isLoading ? "..." : dashboard.metrics.receptionists}
          caption="Front desk staff"
          icon={UserRound}
          tone="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
        />
        <MetricCard
          title="Appointments"
          value={isLoading ? "..." : dashboard.metrics.appointments}
          caption="Total bookings"
          icon={CalendarCheck}
          tone="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <MetricCard
          title="Today"
          value={isLoading ? "..." : dashboard.metrics.todayAppointments}
          caption="Appointments today"
          icon={Activity}
          tone="bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <GenderCircle gender={dashboard.gender} />
        </div>
        <div className="xl:col-span-8">
          <WeeklyPatientChart rows={dashboard.weeklyPatients} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <EntityLogs logs={dashboard.entityLogs} />
        <AppointmentLogs
          logs={dashboard.appointmentLogs}
          statuses={dashboard.appointmentStatuses}
        />
      </section>
    </main>
  );
}
