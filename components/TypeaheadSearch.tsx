"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent, useMemo, useState } from "react";

type TypeaheadSearchProps = {
  entity: string;
  placeholder: string;
};

export default function TypeaheadSearch({
  entity,
  placeholder,
}: TypeaheadSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

  const inputId = useMemo(() => `${entity}-search`, [entity]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "?");
  };

  return (
    <label htmlFor={inputId} className="relative block">
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[21px] leading-none text-gray-400">
        search
      </span>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
      />
    </label>
  );
}
