import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const revalidate = 3600; // ISR: revalidate every hour

// ---- SSG: generate all receptionist IDs at build time ----

export async function generateStaticParams(): Promise<{ receptionistId: string }[]> {
  const receptionists = await prisma.receptionist.findMany({
    select: { id: true },
  });

  return receptionists.map((receptionist) => ({
    receptionistId: receptionist.id,
  }));
}

function formatGender(gender: string) {
  const labels: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return labels[gender] ?? gender;
}

function formatShift(shift: string) {
  const labels: Record<string, string> = { Morning: "Morning", Evening: "Evening", Night: "Night" };
  return labels[shift] ?? String(shift).replace(/_/g, " ");
}

function initialsFromName(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ReceptionistProfilePage({ params }: { params: Promise<{ receptionistId: string }> }) {
  const { receptionistId } = await params;

  const receptionist = await prisma.receptionist.findFirst({
    where: {
      OR: [{ userId: receptionistId }, { id: receptionistId }],
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
    },
  });

  if (!receptionist) {
    notFound();
  }

  const { user } = receptionist;
  const initials = initialsFromName(receptionist.name);

  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10 space-y-8">
        <div className="bg-foreground rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  {receptionist.profileImage ? (
                    <img
                      src={receptionist.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {receptionist.name}
                </h1>
                <p className="text-primary font-semibold text-lg mt-1">Front desk · Reception</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    ID {receptionist.receptionists_id}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {formatShift(receptionist.shift)} shift
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                      receptionist.isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {receptionist.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Gender
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3">
                {formatGender(receptionist.gender)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Assigned shift
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3">
                {formatShift(receptionist.shift)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Receptionist record created
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3">
                {new Date(receptionist.createdAt).toLocaleString()}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Account (User)
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3 break-all">
                {user.email}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Phone
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3">
                {user.phone}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Account created
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3">
                {new Date(user.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Last sign-in
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-3">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "—"}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
