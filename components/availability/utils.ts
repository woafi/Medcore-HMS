import type { AvailabilityRow, TimeSlotRow } from "./types";
import {
  TIMELINE_START,
  TIMELINE_DURATION,
  DEFAULT_SLOT,
  TIME_PATTERN,
  ALL_DAYS,
} from "./constants";
import type { DayOfWeek } from "./constants";

// ─── Status Mapping ──────────────────────────────────────────────────────────

/** Convert DB status string to display-friendly format */
export function statusFromDb(status: string): string {
  if (status === "Emergency_Only") return "Emergency Only";
  if (status === "Off_duty") return "Off-duty";
  return status;
}

// ─── Time Helpers ────────────────────────────────────────────────────────────

/** Extract "HH:MM" string from a Date or string timestamp */
export function timeFromDate(value: string | Date): string {
  const date = new Date(value);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Convert "HH:MM" to total minutes since midnight */
export function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Convert "HH:MM" to 12-hour clock display */
export function to12Hour(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Convert minutes from midnight to percentage of the full timeline */
export function pct(mins: number): number {
  return ((mins - TIMELINE_START) / TIMELINE_DURATION) * 100;
}

/** Format hour number to a short label (e.g. 0 → "12am", 13 → "1pm") */
export function formatHourLabel(h: number): string {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

// ─── Data Mapping ────────────────────────────────────────────────────────────

/**
 * Map raw Prisma availability records (with available_slots) to display rows.
 * Handles both `timeSlots` and `available_slots` property names.
 */
export function mapAvailabilitiesToRows(
  availabilities: Record<string, unknown>[] | undefined | null
): AvailabilityRow[] {
  if (!availabilities?.length) return [];

  return availabilities.map((a) => ({
    id: String(a.id ?? ""),
    day: String(a.day ?? ""),
    status: statusFromDb(String(a.status ?? "")),
    timeSlots: mapTimeSlots(a),
  }));
}

/** Extract and map time slots from a raw availability record */
function mapTimeSlots(a: Record<string, unknown>): TimeSlotRow[] {
  const rawSlots = (a.timeSlots as Record<string, unknown>[]) ??
    (a.available_slots as Record<string, unknown>[]) ??
    [];

  if (!Array.isArray(rawSlots)) return [];

  return rawSlots.map((slot) => ({
    id: String(slot.id ?? ""),
    start: timeFromDate(String(slot.startTime ?? "")),
    end: timeFromDate(String(slot.endTime ?? "")),
    isBooked: Boolean(slot.is_booked ?? false),
  }));
}

/** Map a single raw availability to a display row */
export function mapAvailabilityToRow(
  availability: Record<string, unknown>
): AvailabilityRow | undefined {
  return mapAvailabilitiesToRows([availability])[0];
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** Validate a new/edited availability entry. Returns empty string if valid. */
export function validateEntry(entry: {
  day?: string;
  status: string;
  timeSlots: TimeSlotRow[];
}): string {
  if (!entry.day) return "Please choose a day";
  if (entry.status === "Off-duty") return "";
  if (!entry.timeSlots.length) return "Add at least one time slot";

  for (const [index, slot] of entry.timeSlots.entries()) {
    if (!TIME_PATTERN.test(slot.start) || !TIME_PATTERN.test(slot.end)) {
      return `Slot ${index + 1} needs a valid start and end time`;
    }
    if (toMins(slot.start) >= toMins(slot.end)) {
      return "Each slot end time must be after its start time";
    }
  }

  return "";
}

/**
 * Return the appropriate time slot list for a given status.
 * "Off-duty" → empty array, otherwise returns existing slots or a default.
 */
export function slotListForStatus(
  status: string,
  slots: TimeSlotRow[]
): TimeSlotRow[] {
  if (status === "Off-duty") return [];
  return slots.length > 0 ? slots : [{ ...DEFAULT_SLOT }];
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

/** Sort availability rows by day of the week */
export function sortRowsByDay(rows: AvailabilityRow[]): AvailabilityRow[] {
  return [...rows].sort(
    (a, b) =>
      ALL_DAYS.indexOf(a.day as DayOfWeek) -
      ALL_DAYS.indexOf(b.day as DayOfWeek)
  );
}
