"use client";

import AddNewPatientModal from "@/components/AddNewPaitentModal";
import EditPatientTrigger from "@/components/patient/EditPatientTrigger";
import Pagination from "@/components/Pagination";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import { serializePatientForEditForm } from "@/lib/patientFormHelpers";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const ITEMS_PER_PAGE = 8;

type PatientAppointment = {
  date: string;
  startTime: string;
  status: string;
};

type Patient = {
  id: string;
  patientId: string;
  fullname: string;
  gender: string;
  dateOfBirth: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bloodGroup: string;
  profileImage: string | null;
  createdAt: string;
  emergencyName: string | null;
  emergencyPhone: string | null;
  relationship: string | null;
  allergies: string | null;
  appointments: PatientAppointment[];
};

type ApiResponse = {
  patients: Patient[];
  total: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
};

function formatGender(gender: string): string {
  const labels: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return labels[gender] ?? gender;
}

function calculateAge(dateOfBirth: string | null, storedAge: number | null): number | null {
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

function initialsFromName(name: string): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLastVisit(appointment: PatientAppointment | undefined): { date: string; time: string } {
  if (!appointment) {
    return { date: "—", time: "" };
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(appointment.date ?? appointment.startTime));

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(appointment.startTime));

  return { date: dateLabel, time: timeLabel };
}

function getStatusBadge(status: string): { label: string; className: string } {
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

export default function PatientListPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
          <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <div className="flex items-center justify-center py-20 text-gray-500">
              <span className="inline-block mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Loading patients...
            </div>
          </main>
        </div>
      }
    >
      <PatientListContent />
    </Suspense>
  );
}

function PatientListContent() {
  const params = useParams<{ receptionistId: string }>();
  const receptionistId = params.receptionistId;
  const searchParams = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [safePage, setSafePage] = useState(currentPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const cancelledRef = useRef(false);

  async function fetchPatients() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/patients?page=${currentPage}`);
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Unauthorized. Please log in again."
            : "Failed to load patients."
        );
      }
      const data: ApiResponse = await res.json();

      if (!cancelledRef.current) {
        setPatients(data.patients);
        setTotalPatients(data.total);
        setSafePage(data.currentPage);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setPatients([]);
        setTotalPatients(0);
      }
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    cancelledRef.current = false;
    fetchPatients();

    return () => {
      cancelledRef.current = true;
    };
  }, [currentPage]);

  if (error) {
    return (
      <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-12 dark:border-red-900/40 dark:bg-red-950/20">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={fetchPatients}
              className="mt-4 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Loading patients...</span>
                      </div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No patients found. Register a new patient to get started.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => {
                    const lastAppointment = patient.appointments[0];
                    const lastVisit = formatLastVisit(lastAppointment);
                    const statusBadge = getStatusBadge(lastAppointment?.status ?? "");
                    const age = calculateAge(patient.dateOfBirth, patient.age);
                    const genderAgeLabel = age != null
                      ? `${formatGender(patient.gender)} / ${age}`
                      : formatGender(patient.gender);
                    const profileHref = `/patientprofile?id=${patient.id}`;

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
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            name="patients"
            currentPage={safePage}
            totalItems={totalPatients}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </main>
    </div>
  );
}
