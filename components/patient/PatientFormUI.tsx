// ---------------------------------------------------------------------------
// Shared patient form UI primitives (labels, sections, styling)
// ---------------------------------------------------------------------------

import React from "react";

export const bloodGroups: [string, string][] = [
  ["O_Positive", "O+"],
  ["O_Negative", "O-"],
  ["A_Positive", "A+"],
  ["A_Negative", "A-"],
  ["B_Positive", "B+"],
  ["B_Negative", "B-"],
  ["AB_Positive", "AB+"],
  ["AB_Negative", "AB-"],
];

export const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-900 dark:focus:ring-blue-900/40";

/** Wraps a single labeled form control with optional validation message */
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

type ToneKey = "blue" | "amber" | "red";

const tones: Record<ToneKey, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

/** Section heading with icon used inside patient modals */
export function SectionTitle({
  icon: Icon,
  title,
  tone = "blue",
}: {
  icon: React.ElementType;
  title: string;
  tone?: ToneKey;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">
        {title}
      </h3>
    </div>
  );
}
