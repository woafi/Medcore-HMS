"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createAvailability,
  updateAvailability,
} from "@/app/actions/availabilityActions";
import StatusPill from "./availability/StatusPill";
import TimelineBar from "./availability/TimelineBar";
import AddDayModal from "./availability/AddDayModal";
import {
  STATUS_CONFIG,
  BOOKED_SLOT_STYLE,
  ALL_DAYS,
  DAY_SHORT,
  DEFAULT_SLOT,
} from "./availability/constants";
import {
  mapAvailabilitiesToRows,
  mapAvailabilityToRow,
  validateEntry,
  slotListForStatus,
  to12Hour,
  toMins,
  pct,
  formatHourLabel,
  sortRowsByDay,
} from "./availability/utils";
import type {
  AvailabilityRow,
  AvailabilityScheduleProps,
  NewAvailabilityEntry,
  AvailabilityActionResult,
} from "./availability/types";

// ─── Constants for inline rendering ──────────────────────────────────────────

/** Generate 24-hour marks for the timeline header */
const HOUR_MARKS = Array.from({ length: 24 }, (_, i) => ({
  label: formatHourLabel(i),
  pct: pct(i * 60),
}));

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * Full availability schedule manager for a doctor.
 * Supports two views: Timeline (visual bar chart) and List (editable table).
 * Allows adding, editing, and deleting availability days with time slots.
 */
export default function AvailabilitySchedule({
  availabilities = [],
  doctorId = "",
  revalidatePaths = [],
}: AvailabilityScheduleProps) {
  // ── State ──────────────────────────────────────────────────────────────
  const initialRows = useMemo(
    () => mapAvailabilitiesToRows(availabilities as Record<string, unknown>[]),
    [availabilities]
  );

  const [rows, setRows] = useState<AvailabilityRow[]>(initialRows);
  const [view, setView] = useState<"list" | "timeline">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AvailabilityRow | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Sync rows when initialRows changes (e.g., after server revalidation)
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // ── Derived Values ─────────────────────────────────────────────────────
  const usedDays = rows.map((r) => r.day);
  const availableDays = [...ALL_DAYS].filter((d) => !usedDays.includes(d));
  const sortedRows = sortRowsByDay(rows);
  const totalSlots = rows.reduce((acc, r) => acc + r.timeSlots.length, 0);
  const availableDaysCount = rows.filter((r) => r.status === "Available").length;
  const canEdit = Boolean(doctorId);

  // ── Action Executor ────────────────────────────────────────────────────
  /**
   * Wraps an async action in a transition, setting loading/error states.
   * The action function should return an AvailabilityActionResult.
   */
  const runAction = (
    fn: () => Promise<AvailabilityActionResult>
  ) => {
    setActionError("");
    startTransition(async () => {
      try {
        const result = await fn();
        if (!result.ok) {
          setActionError(result.error ?? "Something went wrong");
        }
      } catch (_error) {
        console.error(_error);
        setActionError("Something went wrong");
      }
    });
  };

  // ── Edit Handlers ──────────────────────────────────────────────────────
  const startEdit = (row: AvailabilityRow) => {
    setActionError("");
    setEditingId(row.id);
    setEditDraft(JSON.parse(JSON.stringify(row)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = () => {
    if (!editDraft) return;

    const validationError = validateEntry(editDraft);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    runAction(async () => {
      const result = await updateAvailability(
        editDraft.id,
        { status: editDraft.status, timeSlots: editDraft.timeSlots },
        revalidatePaths
      );
      if (result.ok) {
        const savedRow = result.availability
          ? mapAvailabilityToRow(result.availability as Record<string, unknown>)
          : ({ ...editDraft } as AvailabilityRow);
        setRows((current) =>
          current.map((r) => (r.id === editingId ? savedRow! : r))
        );
        setEditingId(null);
        setEditDraft(null);
      }
      return result;
    });
  };

  // ── Add Handlers ───────────────────────────────────────────────────────
  const openAdd = () => {
    setActionError("");
    setShowAddModal(true);
  };

  const handleAddSave = (entry: NewAvailabilityEntry) => {
    if (!doctorId) {
      setActionError("Doctor id is missing");
      return;
    }

    const validationError = validateEntry(entry);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    runAction(async () => {
      const result = await createAvailability(doctorId, entry, revalidatePaths);
      if (result.ok) {
        const row = mapAvailabilityToRow(
          result.availability as Record<string, unknown>
        );
        if (row) {
          setRows((current) => [...current.filter((r) => r.id !== row.id), row]);
        }
        setShowAddModal(false);
      }
      return result;
    });
  };

  // ── Edit Draft Handlers ────────────────────────────────────────────────
  const handleEditDraftChange = (draft: AvailabilityRow) => {
    setEditDraft(draft);
  };

  // ── Render: Empty State ────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="lg:col-span-2 space-y-5">
        <AnimationStyles />
        {/* Empty state with Add first day button */}
        <HeaderBar
          availableDaysCount={availableDaysCount}
          totalSlots={totalSlots}
          actionError={actionError}
          isPending={isPending}
          canEdit={canEdit}
          availableDays={availableDays}
          view={view}
          onViewChange={setView}
          onOpenAdd={openAdd}
        />
        <EmptyState
          canEdit={canEdit}
          availableDays={availableDays}
          isPending={isPending}
          onOpenAdd={openAdd}
        />
      </div>
    );
  }

  // ── Render: Main Content ───────────────────────────────────────────────
  return (
    <div className="lg:col-span-2 space-y-5">
      <AnimationStyles />

      {/* Header with stats and view toggle */}
      <HeaderBar
        availableDaysCount={availableDaysCount}
        totalSlots={totalSlots}
        actionError={actionError}
        isPending={isPending}
        canEdit={canEdit}
        availableDays={availableDays}
        view={view}
        onViewChange={setView}
        onOpenAdd={openAdd}
      />

      {/* Timeline View */}
      {view === "timeline" ? (
        <TimelineViewContent rows={sortedRows} />
      ) : (
        /* List View (editable table) */
        <ListViewContent
          rows={sortedRows}
          editingId={editingId}
          editDraft={editDraft}
          isPending={isPending}
          canEdit={canEdit}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onEditDraftChange={handleEditDraftChange}
        />
      )}

      {/* Add Day Modal */}
      {showAddModal && (
        <AddDayModal
          availableDays={availableDays}
          isPending={isPending}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}
    </div>
  );
}

// ─── Animation Styles (used in all branches) ───────────────────────────────

/** Small inline style tag for slideUp and scaleIn keyframe animations */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      @keyframes scaleIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
      .slide-up { animation: slideUp 0.25s ease forwards; }
      .scale-in { animation: scaleIn 0.2s ease; }
    `}</style>
  );
}

// ─── Inline Sub-Components (view-specific) ───────────────────────────────────

/**
 * Header section with title, stats, action error, Add Day button, and view toggle.
 */
function HeaderBar({
  availableDaysCount,
  totalSlots,
  actionError,
  isPending,
  canEdit,
  availableDays,
  view,
  onViewChange,
  onOpenAdd,
}: {
  availableDaysCount: number;
  totalSlots: number;
  actionError: string;
  isPending: boolean;
  canEdit: boolean;
  availableDays: readonly string[];
  view: "list" | "timeline";
  onViewChange: (v: "list" | "timeline") => void;
  onOpenAdd: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Weekly Schedule
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
          <span className="text-slate-600 dark:text-slate-300 font-bold">
            {availableDaysCount}
          </span>{" "}
          active days -{" "}
          <span className="text-slate-600 dark:text-slate-300 font-bold">
            {totalSlots}
          </span>{" "}
          time slots
        </p>
        {actionError && (
          <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {canEdit && availableDays.length > 0 && (
          <button
            type="button"
            onClick={onOpenAdd}
            disabled={isPending}
            className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add Day
          </button>
        )}
        {/* View toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
          {(["timeline", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                view === v
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {v === "timeline" ? "Timeline" : "List"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state shown when no availability rows exist.
 */
function EmptyState({
  canEdit,
  availableDays,
  isPending,
  onOpenAdd,
}: {
  canEdit: boolean;
  availableDays: readonly string[];
  isPending: boolean;
  onOpenAdd: () => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center slide-up">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No weekly schedule has been set up yet.
      </p>
      {canEdit && availableDays.length > 0 && (
        <button
          type="button"
          onClick={onOpenAdd}
          disabled={isPending}
          className="mt-4 cursor-pointer px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          Add first day
        </button>
      )}
    </div>
  );
}

/**
 * Timeline visual view — horizontal bars for each day across the 24h scale.
 */
function TimelineViewContent({ rows }: { rows: AvailabilityRow[] }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden slide-up">
      {/* Hour marks header */}
      <div className="relative border-b border-slate-100/80 dark:border-slate-800 h-7 ml-24 mr-4">
        {HOUR_MARKS.filter((_, i) => i % 2 === 0).map((mark) => (
          <div
            key={mark.label}
            className="absolute top-0 h-full flex flex-col items-center"
            style={{ left: `${mark.pct}%` }}
          >
            <div className="w-px h-2 bg-slate-200 dark:bg-slate-700 mt-1" />
            <span className="mono text-[9px] text-slate-400 font-medium mt-0.5">
              {mark.label}
            </span>
          </div>
        ))}
      </div>

      {/* Day rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row, idx) => {
          const isWeekend = row.day === "Saturday" || row.day === "Sunday";
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 ${
                isWeekend ? "bg-slate-50/40 dark:bg-slate-800/10" : ""
              }`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Day label + status pill */}
              <div className="w-20 shrink-0">
                <div
                  className={`text-sm font-extrabold tracking-tight ${
                    row.status === "Off-duty"
                      ? "text-slate-400"
                      : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {DAY_SHORT[row.day as keyof typeof DAY_SHORT] || row.day}
                </div>
                <div className="mt-0.5">
                  <StatusPill status={row.status} />
                </div>
              </div>

              {/* Timeline bar */}
              <div className="flex-1">
                <TimelineBar day={row} />
              </div>

              {/* Slot count */}
              <div className="w-8 text-center shrink-0">
                {row.timeSlots.length > 0 ? (
                  <span className="mono text-xs font-bold text-slate-400">
                    {row.timeSlots.length}
                  </span>
                ) : (
                  <span className="mono text-xs text-slate-300">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend footer */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5">
        {Object.entries(STATUS_CONFIG).map(([label, cfg]) => {
          const count = rows.filter((r) => r.status === label).length;
          return (
            <span
              key={label}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium"
            >
              <span className={`w-2 h-2 rounded-sm ${cfg.dot}`} />
              {count}x {label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <span
            className="w-2 h-2 rounded-sm"
            style={{ background: BOOKED_SLOT_STYLE.slotBorder }}
          />
          Booked slot
        </span>
        <span className="ml-auto text-[10px] mono text-slate-300">
          hover slots for times
        </span>
      </div>
    </div>
  );
}

/**
 * List/Table view — editable grid for managing availability rows.
 */
function ListViewContent({
  rows,
  editingId,
  editDraft,
  isPending,
  canEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditDraftChange,
}: {
  rows: AvailabilityRow[];
  editingId: string | null;
  editDraft: AvailabilityRow | null;
  isPending: boolean;
  canEdit: boolean;
  onStartEdit: (row: AvailabilityRow) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditDraftChange: (draft: AvailabilityRow) => void;
}) {
  return (
    <div className="bg-foreground rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden slide-up">
      <table className="w-full border-collapse">
        {/* Table header */}
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            {(["Day", "Status", "Time Slots", "Actions"] as const).map(
              (h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${
                    i === 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>

        {/* Table body */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            const draft = isEditing ? editDraft : row;

            return (
              <tr
                key={row.id}
                className={`group transition-colors ${
                  isEditing
                    ? "bg-blue-50/40 dark:bg-blue-950/20"
                    : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                }`}
              >
                {/* Day column */}
                <td className="px-5 py-3.5">
                  <span
                    className={`font-extrabold text-sm tracking-tight ${
                      row.status === "Off-duty"
                        ? "text-slate-400"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {row.day}
                  </span>
                </td>

                {/* Status column (editable when editing) */}
                <td className="px-5 py-3.5">
                  {isEditing && canEdit && draft ? (
                    <select
                      value={draft.status}
                      onChange={(e) => {
                        const status = e.target.value;
                        onEditDraftChange({
                          ...draft,
                          status,
                          timeSlots: slotListForStatus(status, draft.timeSlots),
                        });
                      }}
                      className="text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {Object.keys(STATUS_CONFIG).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusPill status={row.status} />
                  )}
                </td>

                {/* Time Slots column (inline editing when editing) */}
                <td className="px-5 py-3.5">
                  {isEditing && canEdit && draft && draft.status !== "Off-duty" ? (
                    <div className="space-y-1.5">
                      {draft.timeSlots.map((slot, i) => (
                        <div key={slot.id ?? i} className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={slot.start}
                            disabled={slot.isBooked || isPending}
                            onChange={(e) => {
                              const slots = [...draft.timeSlots];
                              slots[i] = { ...slots[i], start: e.target.value };
                              onEditDraftChange({ ...draft, timeSlots: slots });
                            }}
                            className="mono text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                          />
                          <span className="text-slate-400 text-xs">-</span>
                          <input
                            type="time"
                            value={slot.end}
                            disabled={slot.isBooked || isPending}
                            onChange={(e) => {
                              const slots = [...draft.timeSlots];
                              slots[i] = { ...slots[i], end: e.target.value };
                              onEditDraftChange({ ...draft, timeSlots: slots });
                            }}
                            className="mono text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                          />
                          {slot.isBooked && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase">
                              Booked
                            </span>
                          )}
                          {!slot.isBooked && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                const slots = draft.timeSlots.filter((_, j) => j !== i);
                                onEditDraftChange({ ...draft, timeSlots: slots });
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded"
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
                        disabled={isPending}
                        onClick={() => {
                          const slots = [...draft.timeSlots, { ...DEFAULT_SLOT }];
                          onEditDraftChange({ ...draft, timeSlots: slots });
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add slot
                      </button>
                    </div>
                  ) : row.timeSlots.length === 0 ? (
                    <span className="text-xs italic text-slate-400">No slots</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {row.timeSlots.map((slot, i) => (
                        <span
                          key={slot.id ?? i}
                          className={`mono inline-flex items-center text-[11px] font-medium rounded-md px-2 py-0.5 ${
                            slot.isBooked
                              ? "text-amber-800 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300"
                              : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                          }`}
                        >
                          {to12Hour(slot.start)}-{to12Hour(slot.end)}
                          {slot.isBooked ? " - booked" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Actions column */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {!canEdit ? (
                      <span className="text-xs text-slate-400">Read only</span>
                    ) : isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onSaveEdit()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          {isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={onCancelEdit}
                          className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onStartEdit(row)}
                          title="Edit"
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
