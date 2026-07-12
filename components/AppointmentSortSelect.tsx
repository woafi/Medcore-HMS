"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent } from "react";

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "department", label: "Department" },
  { value: "doctor", label: "Doctor Name" },
];

type AppointmentSortSelectProps = {
  currentSort?: string;
};

export default function AppointmentSortSelect({ currentSort = "latest" }: AppointmentSortSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextSort = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === "latest") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      <select
        value={currentSort}
        onChange={handleChange}
        className="bg-transparent border-none text-sm font-semibold focus:ring-0 text-blue-600 cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
