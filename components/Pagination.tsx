"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  name?: string;
};

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {startItem}-{endItem} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={pageHref(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage <= 1}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            currentPage <= 1
              ? "pointer-events-none border-gray-200 text-gray-300 dark:border-gray-800 dark:text-gray-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          Previous
        </Link>
        <span className="px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          {currentPage} / {totalPages}
        </span>
        <Link
          href={pageHref(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage >= totalPages}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            currentPage >= totalPages
              ? "pointer-events-none border-gray-200 text-gray-300 dark:border-gray-800 dark:text-gray-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
