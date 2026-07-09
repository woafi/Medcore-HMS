import prisma from "@/lib/prisma";

const numberFormat = new Intl.NumberFormat("en-US");

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-foreground p-5 shadow-sm dark:border-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            {numberFormat.format(value)}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <span className="material-symbols-outlined text-[22px] leading-none">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardHome() {
  const [
    doctors,
    receptionists,
    patients,
    appointments,
    users,
    recentLogs,
  ] = await Promise.all([
    prisma.doctor.count(),
    prisma.receptionist.count(),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.user.count(),
    prisma.dashboardLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Monitor hospital staff, patients, and appointment activity from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doctors"
          value={doctors}
          icon="stethoscope"
          tone="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
        />
        <StatCard
          label="Receptionists"
          value={receptionists}
          icon="support_agent"
          tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <StatCard
          label="Patients"
          value={patients}
          icon="clinical_notes"
          tone="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
        />
        <StatCard
          label="Appointments"
          value={appointments}
          icon="calendar_month"
          tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-gray-200 bg-foreground shadow-sm dark:border-gray-800">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentLogs.length ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex gap-3 px-5 py-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <span className="material-symbols-outlined text-[20px] leading-none">
                      history
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {log.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {log.category.toLowerCase()} · {log.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                No activity has been recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-foreground p-5 shadow-sm dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">
            System Overview
          </h2>
          <dl className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Users</dt>
              <dd className="text-sm font-semibold text-gray-950 dark:text-white">
                {numberFormat.format(users)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Active doctors</dt>
              <dd className="text-sm font-semibold text-gray-950 dark:text-white">
                {numberFormat.format(doctors)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Desk staff</dt>
              <dd className="text-sm font-semibold text-gray-950 dark:text-white">
                {numberFormat.format(receptionists)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
