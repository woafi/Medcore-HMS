import { useState } from "react";
import { DEFAULT_SLOT, STATUS_CONFIG } from "./constants";
import { slotListForStatus } from "./utils";
import type { AddDayModalProps, TimeSlotRow } from "./types";

/**
 * Modal form to add a new day's availability schedule.
 * Allows selecting day, status, and editing time slots.
 */
export default function AddDayModal({
  availableDays,
  isPending,
  onClose,
  onSave,
}: AddDayModalProps) {
  // ── Local form state ─────────────────────────────────────────────────
  const [day, setDay] = useState(availableDays[0] || "");
  const [status, setStatus] = useState("Available");
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([
    { ...DEFAULT_SLOT },
  ]);

  /** Handle status change — clears slots if "Off-duty" is selected */
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setTimeSlots(slotListForStatus(newStatus, timeSlots));
  };

  /** Update a single slot's start or end time */
  const updateSlot = (index: number, field: "start" | "end", value: string) => {
    setTimeSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  /** Remove a time slot (only if more than one remains) */
  const removeSlot = (index: number) => {
    setTimeSlots((prev) => prev.filter((_, j) => j !== index));
  };

  /** Add a new default time slot */
  const addSlot = () => {
    setTimeSlots((prev) => [...prev, { ...DEFAULT_SLOT }]);
  };

  /** Submit the form */
  const handleSave = () => {
    onSave({ day, status, timeSlots });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="scale-in bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Add Day
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set availability for a new day
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4">
          {/* Day selector */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
              Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {availableDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {Object.keys(STATUS_CONFIG).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Time slots editor (hidden for Off-duty) */}
          {status !== "Off-duty" && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                Time Slots
              </label>
              <div className="space-y-1.5">
                {timeSlots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(i, "start", e.target.value)}
                      className="mono flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-slate-300 text-xs">-</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(i, "end", e.target.value)}
                      className="mono flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSlot}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another slot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            {isPending ? "Adding..." : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
