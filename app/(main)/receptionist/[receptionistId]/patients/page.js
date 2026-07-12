import AddNewPatientModal from "@/components/AddNewPaitentModal";
import EditPatientTrigger from "@/components/patient/EditPatientTrigger";
import Pagination from "@/components/Pagination";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import { serializePatientForEditForm } from "@/lib/patientFormHelpers";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";

const ITEMS_PER_PAGE = 8;

function formatGender(gender) {
  const labels = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return labels[gender] ?? gender;
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

function formatLastVisit(appointment) {
  if (!appointment) {
    return { date: "—", time: "" };
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(appointment.date ?? appointment.startTime);

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(appointment.startTime);

  return { date: dateLabel, time: timeLabel };
}

function getStatusBadge(status) {
  switch (status) {
    case "CHECKED_IN":
      return {
        label: "Checked In",
        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "WAITING":
      return {
        label: "Waiting",
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case "SCHEDULED":
      return {
        label: "Scheduled",
        className:
          "bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-400",
      };
    default:
      return {
        label: "New",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
      };
  }
}

export default async function PatientListPage({ params, searchParams }) {
  const { receptionistId } = await params;
  const queryParams = await searchParams;
  const requestedPage = Number(queryParams?.page);
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const totalPatients = await prisma.patient.count();
  const totalPages = Math.max(1, Math.ceil(totalPatients / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    skip: (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
        select: {
          date: true,
          startTime: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight mb-2">
              Patient Directory
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
              Manage and monitor hospital records across all departments. Search by
              name, ID, or contact details to access full clinical history.
            </p>
          </div>
          <AddNewPatientModal />
        </div>

        <div className="bg-foreground p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <TypeaheadSearch
              entity="patients"
              searchContext={{
                profileBasePath: `/receptionist/${receptionistId}/patients`,
              }}
              placeholder="Search by Name, Patient ID, or Phone Number..."
            />
          </div>
        </div>

        <div className="bg-foreground rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gender/Age
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {patients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No patients found. Register a new patient to get started.
                    </td>
                  </tr>
                )}

                {patients.map((patient) => {
                  const lastAppointment = patient.appointments[0];
                  const lastVisit = formatLastVisit(lastAppointment);
                  const statusBadge = getStatusBadge(lastAppointment?.status);
                  const age = calculateAge(patient.dateOfBirth, patient.age);
                  const genderAgeLabel = age
                    ? `${formatGender(patient.gender)} / ${age}`
                    : formatGender(patient.gender);
                  const profileHref = `/receptionist/${receptionistId}/patients/profile?id=${patient.id}`;

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                          {patient.patientId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-100">
                            {patient.profileImage ? (
                              <Image
                                src={patient.profileImage}
                                alt={patient.fullname}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {initialsFromName(patient.fullname)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {patient.fullname}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {patient.phone || patient.email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {genderAgeLabel}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {lastVisit.date}
                        </div>
                        {lastVisit.time ? (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {lastVisit.time}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <EditPatientTrigger
                            patient={serializePatientForEditForm(patient)}
                          />
                          <Link
                            href={profileHref}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg"
                            title="View Profile"
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
                          <Link
                            href={`/receptionist/${receptionistId}/appointments`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg"
                            title="Add Appointment"
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg"
                            title="Billing"
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
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            name="patients"
            currentPage={safeCurrentPage}
            totalItems={totalPatients}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </main>
    </div>
  );
}

// export async function generateStaticParams() {
//   const receptionists = await prisma.receptionist.findMany({
//     select: { id: true, userId: true },
//   });

//   const receptionistIds = new Set();
//   for (const receptionist of receptionists) {
//     receptionistIds.add(receptionist.id);
//     receptionistIds.add(receptionist.userId);
//   }

//   return [...receptionistIds].map((receptionistId) => ({ receptionistId }));
// }
