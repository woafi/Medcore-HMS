"use client";

import Button from "@/components/Button";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import Image from "next/image";
import TypeaheadSearch from "@/components/TypeaheadSearch";
import DeleteDoctorButton from "@/components/DeleteDoctorButton";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type Doctor = {
  id: string;
  doctor_id: string;
  name: string;
  specialization: string;
  qualification: string;
  room: number | null;
  profileImage: string | null;
  createdAt: string;
};

type ApiResponse = {
  doctors: Doctor[];
  total: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
};

export default function DoctorListPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20 text-gray-500">
            <span className="inline-block mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Loading doctors...
          </div>
        </section>
      }
    >
      <DoctorListContent />
    </Suspense>
  );
}

function DoctorListContent() {
  const searchParams = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [safePage, setSafePage] = useState(currentPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const cancelledRef = useRef(false);

  async function fetchDoctors() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/doctors?page=${currentPage}`);
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Unauthorized. Please log in again."
            : "Failed to load doctors."
        );
      }
      const data: ApiResponse = await res.json();

      if (!cancelledRef.current) {
        setDoctors(data.doctors);
        setTotalDoctors(data.total);
        setSafePage(data.currentPage);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setDoctors([]);
        setTotalDoctors(0);
      }
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    cancelledRef.current = false;
    fetchDoctors();

    return () => {
      cancelledRef.current = true;
    };
  }, [currentPage]);

  if (error) {
    return (
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-12 dark:border-red-900/40 dark:bg-red-950/20">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={fetchDoctors}
            className="mt-4 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight mb-2">
            Doctor Directory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Manage and monitor doctor records across all departments. Search by
            name, ID, or contact details to see the doctor&apos;s profile.
          </p>
        </div>
        {/* Add a New Doctor */}
        <Link href="/admin/doctors/addadoctor">
          <Button text="Add Doctor" iconType="add" />
        </Link>
      </div>

      {/* Filters & Search Section */}
      <div className="bg-foreground p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px]">
          <TypeaheadSearch
            entity="doctors"
            placeholder="Search by name, doctor ID, phone, or email..."
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-foreground rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-foregd border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  doctor_id
                </th>
                <th className="w-[30%] px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  qualification
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  specialization
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  room
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
                      <span>Loading doctors...</span>
                    </div>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No doctors found
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {doctor.doctor_id}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
                          {doctor.profileImage ? (
                            <Image
                              src={doctor.profileImage}
                              alt={doctor.name || "Doctor profile"}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {doctor.name?.charAt(0)?.toUpperCase() || "D"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {doctor.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {doctor.qualification}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {doctor.specialization}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {doctor.room ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {doctor.room}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/doctors/editingadoctor?id=${doctor.id}`}
                        >
                          <button className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                          </button>
                        </Link>
                        <Link href={`/doctorprofile/${doctor.id}`}>
                          <button className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                          </button>
                        </Link>
                        <DeleteDoctorButton
                          doctorId={doctor.id}
                          doctorName={doctor.name}
                          doctorCustomId={doctor.doctor_id}
                          onSuccess={(deletedId) => {
                            setDoctors((prev) => prev.filter((d) => d.id !== deletedId));
                            setTotalDoctors((prev) => Math.max(0, prev - 1));
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          name="doctors"
          currentPage={safePage}
          totalItems={totalDoctors}
          itemsPerPage={5}
        />
      </div>
    </section>
  );
}
