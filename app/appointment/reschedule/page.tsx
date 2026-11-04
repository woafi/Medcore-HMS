import prisma from "@/lib/prisma";
import { verifySlotChangeToken } from "@/lib/slotChangeToken";
import RescheduleConfirmButton from "@/components/RescheduleConfirmButton";

const TIME_ZONE = "Asia/Dhaka";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-BD", {
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-BD", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-teal-700 px-6 py-5 sm:px-8">
          <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
            MedCore Hospital
          </span>
        </header>
        <div className="px-6 py-8 sm:px-8">{children}</div>
      </div>
    </main>
  );
}

function InvalidLink() {
  return (
    <PageShell>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          This link is no longer valid
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The link may have expired or already been used. Please contact
          hospital reception and our team will be happy to help you.
        </p>
      </div>
    </PageShell>
  );
}

export default async function ReschedulePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const payload = token ? verifySlotChangeToken(token) : null;

  if (!token || !payload) {
    return <InvalidLink />;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
    select: {
      slotId: true,
      status: true,
      date: true,
      startTime: true,
      doctor: { select: { name: true } },
    },
  });

  const status = String(appointment?.status ?? "").toUpperCase();
  if (
    !appointment ||
    appointment.slotId !== payload.slotId ||
    status === "CANCELLED" ||
    status === "COMPLETED"
  ) {
    return <InvalidLink />;
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-slate-900">
        Book another slot today
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        We noticed you were unable to attend your appointment. Would you like
        to book the next available slot today?
      </p>

      <dl className="mt-6 rounded-lg border-l-4 border-teal-700 bg-slate-50 p-4 text-sm">
        <div className="flex justify-between gap-4 py-1">
          <dt className="font-medium text-slate-500">Doctor</dt>
          <dd className="text-right font-semibold text-slate-900">
            {appointment.doctor.name}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="font-medium text-slate-500">Date</dt>
          <dd className="text-right font-semibold text-slate-900">
            {formatDate(appointment.date)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="font-medium text-slate-500">Missed time</dt>
          <dd className="text-right font-semibold text-slate-900">
            {formatTime(appointment.startTime)}
            <span className="block text-xs font-normal text-slate-500">
              Bangladesh time
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <RescheduleConfirmButton token={token} />
      </div>

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
        This link is valid for today only. To visit on a different day, please
        contact hospital reception.
      </p>
    </PageShell>
  );
}