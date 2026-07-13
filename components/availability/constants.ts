import type { StatusConfigMap } from "./types";

// ─── Status Visual Config ────────────────────────────────────────────────────

/** Tailwind/color configuration for each availability status */
export const STATUS_CONFIG: StatusConfigMap = {
  Available: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
    slotBg: "#d1fae5",
    slotText: "#065f46",
    slotBorder: "#6ee7b7",
  },
  "Emergency Only": {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
    slotBg: "#fef3c7",
    slotText: "#92400e",
    slotBorder: "#fcd34d",
  },
  "Off-duty": {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
    dot: "bg-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    slotBg: "#f1f5f9",
    slotText: "#94a3b8",
    slotBorder: "#e2e8f0",
  },
};

/** Visual style for booked (already-appointed) time slots */
export const BOOKED_SLOT_STYLE = {
  slotBg: "#fef3c7",
  slotBorder: "#facc15",
  slotBgHover: "#fde047",
};

// ─── Day Helpers ─────────────────────────────────────────────────────────────

export const ALL_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

export type DayOfWeek = (typeof ALL_DAYS)[number];

export const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// ─── Timeline Constants ──────────────────────────────────────────────────────

export const TIMELINE_START = 0;       // 00:00 in minutes
export const TIMELINE_END = 24 * 60;   // 24:00 in minutes
export const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START;

// ─── Time Slot Defaults ──────────────────────────────────────────────────────

export const DEFAULT_SLOT = { start: "09:00", end: "10:00" };

// ─── Validation ──────────────────────────────────────────────────────────────

/** Regex for validating HH:MM time format (24-hour) */
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
