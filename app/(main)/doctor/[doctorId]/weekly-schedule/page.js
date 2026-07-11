import WeeklyAvailability from "@/components/WeeklyAvailability";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function DoctorWeeklyAvailabilityPage({ params }) {
  const { doctorId } = await params;

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ userId: doctorId }, { id: doctorId }],
    },
    include: {
      availabilities: {
        include: {
          available_slots: {
            orderBy: { startTime: "asc" },
          },
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  return (
    <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-6 lg:p-10">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Doctor schedule</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {doctor.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {doctor.specialization ?? "General practice"}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                ID: {doctor.doctor_id ?? doctor.id}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                {doctor.availabilities.length} scheduled {doctor.availabilities.length === 1 ? "day" : "days"}
              </div>
            </div>
          </div>
        </section>

        <WeeklyAvailability
          availabilities={doctor.availabilities}
          doctorId={doctor.id}
          revalidatePaths={[`/doctor/${doctorId}/weeklyavailability`]}
        />
      </main>
    </div>
  );
}
