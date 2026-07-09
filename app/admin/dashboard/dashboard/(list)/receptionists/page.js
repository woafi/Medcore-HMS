import Button from "@/components/Button";
import Pagination from "@/components/Pagination";
import TypeaheadSearch from "@/components/TypeaheadSearch";

import Link from "next/link";
import Image from "next/image";

import prisma from "@/lib/prisma";

const ITEMS_PER_PAGE = 5;

export default async function ReceptionistListPage({ searchParams }) {
  const params = await searchParams;
  const requestedPage = Number(params?.page);
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const totalReceptionists = await prisma.receptionist.count();
  const totalPages = Math.max(1, Math.ceil(totalReceptionists / ITEMS_PER_PAGE));
  // Clamp invalid or oversized page numbers so Prisma always queries a real page.
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Fetch latest doctors first
  const receptionists = await prisma.receptionist.findMany({
    orderBy: {
      createdAt: "desc", // newest first
    },
    skip: (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight mb-2">Receptionist Directory</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
              Manage and monitor receptionist records. Search by name, ID, or contact details to access full clinical history.
            </p>
          </div>
          {/* Add a New Receptionist */}
          <Link href="/dashboard/receptionists/addareceptionist">
            <Button
              text="Add Receptionist"
              iconType="add" />
          </Link>
        </div>

        {/* Filters & Search Section */}
        <div className="bg-foreground p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <TypeaheadSearch
              entity="receptionists"
              placeholder="Search by name, receptionist ID, phone, or email..."
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
                    Receptionist ID
                  </th>
                  <th className="w-[30%] px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {receptionists.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      No receptionists found
                    </td>
                  </tr>
                )}

                {receptionists.map((receptionist) => (
                  <tr key={receptionist.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{receptionist.receptionists_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
                          {receptionist?.profileImage ? (
                            <Image
                              src={receptionist.profileImage}
                              alt={receptionist?.name || "Receptionist profile"}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {receptionist?.name?.charAt(0)?.toUpperCase() || "D"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{receptionist.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">01811111111</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{receptionist.gender}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(receptionist.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(receptionist.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
            ${receptionist.shift === "Morning"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}
                      >
                        {receptionist.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/dashboard/receptionists/editingareceptionist?id=${receptionist.id}`}>
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
                        <Link href={`/receptionist/${receptionist.id}/dashboard`}>
                          <button className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            name="receptionists"
            currentPage={safeCurrentPage}
            totalItems={totalReceptionists}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </main>
    </div>
  )
}

// export async function generateStaticParams() {
//   const receptionistId = ["32HDJ3G5", "32HDJ3G4F", "32HDJ3G52"];
//   return receptionistId.map((receptionistId) => ({
//     receptionistId,
//   }));
// }

// export const revalidate = 3600; // Revalidate every hour (ISR)
