"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SpecializationFilter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSpecialization = searchParams.get("specialization") || "";

  const [specializations, setSpecializations] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSpecializations() {
      try {
        const res = await fetch("/api/specializations");
        if (res.ok) {
          const data = await res.json();
          setSpecializations(data.specializations);
        }
      } catch {
        // silently fail
      }
    }
    fetchSpecializations();
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("specialization", value);
    } else {
      params.delete("specialization");
    }

    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 whitespace-nowrap">Specialization:</span>
      <select
        value={currentSpecialization}
        onChange={handleChange}
        className="bg-background border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <option value="">All</option>
        {specializations.map((spec) => (
          <option key={spec} value={spec}>
            {spec}
          </option>
        ))}
      </select>
    </div>
  );
}
