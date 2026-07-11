'use client';

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "@/app/actions/availabilityActions";

const STATUS_CONFIG = {
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

const BOOKED_SLOT_STYLE = {
  slotBg: "#fef3c7",
  slotBorder: "#facc15",
  slotBgHover: "#fde047",
};

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

const TIMELINE_START = 0;
const TIMELINE_END = 24 * 60;
const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START;
const DEFAULT_SLOT = { start: "09:00", end: "10:00" };
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function statusFromDb(status) {
  if (status === "Emergency_Only") return "Emergency Only";
  if (status === "Off_duty") return "Off-duty";
  return status;
}

function timeFromDate(value) {
  const date = new Date(value);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function mapAvailabilitiesToRows(availabilities) {
  if (!availabilities?.length) return [];
  return availabilities.map((a) => ({
    id: a.id,
    day: a.day,
    status: statusFromDb(a.status),
    timeSlots: a.timeSlots ?? (a.available_slots ?? []).map((slot) => ({
      id: slot.id,
      start: timeFromDate(slot.startTime),
      end: timeFromDate(slot.endTime),
      isBooked: slot.is_booked,
    })),
  }));
}

function mapAvailabilityToRow(availability) {
  return mapAvailabilitiesToRows([availability])[0];
}

function toMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function validateEntry(entry) {
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

function slotListForStatus(status, slots) {
  if (status === "Off-duty") return [];
  return slots.length > 0 ? slots : [{ ...DEFAULT_SLOT }];
}

function to12Hour(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function pct(mins) {
  return ((mins - TIMELINE_START) / TIMELINE_DURATION) * 100;
}

function formatHourLabel(h) {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

const HOUR_MARKS = Array.from({ length: 24 }, (_, i) => ({
  label: formatHourLabel(i),
  pct: pct(i * 60),
}));

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Off-duty"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function SlotTooltip({ slot, visible }) {
  if (!visible) return null;
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] font-mono rounded-md px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
      {to12Hour(slot.start)} - {to12Hour(slot.end)}
      {slot.isBooked ? " · Booked" : ""}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  );
}

function TimelineBar({ day }) {
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const cfg = STATUS_CONFIG[day.status] || STATUS_CONFIG["Off-duty"];

  if (day.status === "Off-duty" || day.timeSlots.length === 0) {
    return (
      <div className="relative h-8 rounded-lg overflow-hidden flex items-center px-3" style={{ background: "#f8fafc", border: "1.5px dashed #e2e8f0" }}>
        <span className="text-[11px] text-slate-400 italic font-medium tracking-wide">Off-duty</span>
      </div>
    );
  }

  return (
    <div className="relative h-8 rounded-lg overflow-visible" style={{ background: "#f1f5f9" }}>
      {day.timeSlots.map((slot, i) => {
        const startPct = pct(toMins(slot.start));
        const endPct = pct(toMins(slot.end));
        const widthPct = endPct - startPct;
        const isHovered = hoveredSlot === i;
        const slotStyle = slot.isBooked ? BOOKED_SLOT_STYLE : cfg;
        return (
          <div
            key={slot.id ?? i}
            onMouseEnter={() => setHoveredSlot(i)}
            onMouseLeave={() => setHoveredSlot(null)}
            className="absolute top-0 h-full rounded-md cursor-pointer transition-all duration-150"
            style={{
              left: `${startPct}%`,
              width: `${widthPct}%`,
              background: isHovered ? slotStyle.slotBgHover ?? slotStyle.slotBorder : slotStyle.slotBg,
              border: `1.5px solid ${slotStyle.slotBorder}`,
              zIndex: isHovered ? 20 : slot.isBooked ? 15 : 10,
              transform: isHovered ? "scaleY(1.15)" : "scaleY(1)",
              transformOrigin: "center",
            }}
          >
            <SlotTooltip slot={slot} visible={isHovered} />
          </div>
        );
      })}
    </div>
  );
}

export default function AvailabilitySchedule({ availabilities = [], doctorId, revalidatePaths = [] }) {
  const initialRows = useMemo(() => mapAvailabilitiesToRows(availabilities), [availabilities]);
  const [rows, setRows] = useState(initialRows);
  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ day: "", status: "Available", timeSlots: [{ ...DEFAULT_SLOT }] });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const usedDays = rows.map((r) => r.day);
  const availableDays = ALL_DAYS.filter((d) => !usedDays.includes(d));
  const sortedRows = [...rows].sort((a, b) => ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day));

  useEffect(() => {
    // Keep the editable table in sync after route revalidation refreshes props.
    setRows(initialRows);
  }, [initialRows]);

  const runAction = (fn) => {
    setActionError("");
    startTransition(async () => {
      try {
        const result = await fn();
        if (!result?.ok) {
          setActionError(result?.error ?? "Something went wrong");
        }
      } catch (error) {
        console.error(error);
        setActionError("Something went wrong");
      }
    });
  };

  const startEdit = (row) => {
    setActionError("");
    setEditingId(row.id);
    setEditDraft(JSON.parse(JSON.stringify(row)));
  };
  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

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
          ? mapAvailabilityToRow(result.availability)
          : { ...editDraft };
        setRows((current) => current.map((r) => (r.id === editingId ? savedRow : r)));
        setEditingId(null);
        setEditDraft(null);
      }
      return result;
    });
  };

  const confirmDelete = (id) => setDeleteConfirmId(id);
  const cancelDelete = () => setDeleteConfirmId(null);

  const doDelete = () => {
    const id = deleteConfirmId;
    runAction(async () => {
      const result = await deleteAvailability(id, revalidatePaths);
      if (result.ok) {
        setRows((current) => current.filter((r) => r.id !== id));
        setDeleteConfirmId(null);
      }
      return result;
    });
  };

  const openAdd = () => {
    const first = availableDays[0] || "";
    setNewEntry({ day: first, status: "Available", timeSlots: [{ ...DEFAULT_SLOT }] });
    setActionError("");
    setShowAddModal(true);
  };

  const saveAdd = () => {
    if (!doctorId) {
      setActionError("Doctor id is missing");
      return;
    }

    const validationError = validateEntry(newEntry);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    runAction(async () => {
      const result = await createAvailability(
        doctorId,
        newEntry,
        revalidatePaths
      );
      if (result.ok) {
        const row = mapAvailabilityToRow(result.availability);
        setRows((current) => [...current.filter((r) => r.id !== row.id), row]);
        setShowAddModal(false);
      }
      return result;
    });
  };

  const totalSlots = rows.reduce((acc, r) => acc + r.timeSlots.length, 0);
  const availableDaysCount = rows.filter((r) => r.status === "Available").length;
  const canEdit = Boolean(doctorId);

  return (
    <div className="lg:col-span-2 space-y-5">
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .slide-up { animation: slideUp 0.25s ease forwards; }
        .scale-in { animation: scaleIn 0.2s ease; }
        .row-enter { animation: slideUp 0.2s ease; }
      `}</style>

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
            <span className="text-slate-600 dark:text-slate-300 font-bold">{availableDaysCount}</span> active days -{" "}
            <span className="text-slate-600 dark:text-slate-300 font-bold">{totalSlots}</span> time slots
          </p>
          {actionError && (
            <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{actionError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && availableDays.length > 0 && (
            <button
              type="button"
              onClick={openAdd}
              disabled={isPending}
              className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add Day
            </button>
          )}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {[["timeline", "Timeline"], ["list", "List"]].map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === v ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center slide-up">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No weekly schedule has been set up yet.
          </p>
          {canEdit && availableDays.length > 0 && (
            <button
              type="button"
              onClick={openAdd}
              disabled={isPending}
              className="mt-4 cursor-pointer px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Add first day
            </button>
          )}
        </div>
      ) : view === "timeline" ? (
        <div className="bg-white/80 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden slide-up">
          <div className="relative border-b border-slate-100/80 dark:border-slate-800 h-7 ml-24 mr-4">
            {HOUR_MARKS.filter((_, i) => i % 2 === 0).map((mark) => (
              <div
                key={mark.label}
                className="absolute top-0 h-full flex flex-col items-center"
                style={{ left: `${mark.pct}%` }}
              >
                <div className="w-px h-2 bg-slate-200 dark:bg-slate-700 mt-1" />
                <span className="mono text-[9px] text-slate-400 font-medium mt-0.5">{mark.label}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedRows.map((row, idx) => {
              const isWeekend = row.day === "Saturday" || row.day === "Sunday";
              return (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 ${isWeekend ? "bg-slate-50/40 dark:bg-slate-800/10" : ""}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="w-20 shrink-0">
                    <div className={`text-sm font-extrabold tracking-tight ${row.status === "Off-duty" ? "text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                      {DAY_SHORT[row.day]}
                    </div>
                    <div className="mt-0.5">
                      <StatusPill status={row.status} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <TimelineBar day={row} />
                  </div>
                  <div className="w-8 text-center shrink-0">
                    {row.timeSlots.length > 0 ? (
                      <span className="mono text-xs font-bold text-slate-400">{row.timeSlots.length}</span>
                    ) : (
                      <span className="mono text-xs text-slate-300">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5">
            {Object.entries(STATUS_CONFIG).map(([label, cfg]) => {
              const count = rows.filter((r) => r.status === label).length;
              return (
                <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className={`w-2 h-2 rounded-sm ${cfg.dot}`} />
                  {count}x {label}
                </span>
              );
            })}
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-sm" style={{ background: BOOKED_SLOT_STYLE.slotBorder }} />
              Booked slot
            </span>
            <span className="ml-auto text-[10px] mono text-slate-300">hover slots for times</span>
          </div>
        </div>
      ) : (
        <div className="bg-foreground rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden slide-up">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {["Day", "Status", "Time Slots", "Actions"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedRows.map((row) => {
                const isEditing = editingId === row.id;
                const draft = isEditing ? editDraft : row;
                return (
                  <tr key={row.id} className={`group transition-colors ${isEditing ? "bg-blue-50/40 dark:bg-blue-950/20" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"}`}>
                    <td className="px-5 py-3.5">
                      <span className={`font-extrabold text-sm tracking-tight ${row.status === "Off-duty" ? "text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                        {row.day}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {isEditing && canEdit ? (
                        <select
                          value={draft.status}
                          onChange={(e) => {
                            const status = e.target.value;
                            setEditDraft({
                              ...draft,
                              status,
                              timeSlots: slotListForStatus(status, draft.timeSlots),
                            });
                          }}
                          className="text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <StatusPill status={row.status} />
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isEditing && canEdit && draft.status !== "Off-duty" ? (
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
                                  setEditDraft({ ...draft, timeSlots: slots });
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
                                  setEditDraft({ ...draft, timeSlots: slots });
                                }}
                                className="mono text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                              />
                              {slot.isBooked && (
                                <span className="text-[10px] font-bold text-amber-600 uppercase">Booked</span>
                              )}
                              {!slot.isBooked && (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => setEditDraft({ ...draft, timeSlots: draft.timeSlots.filter((_, j) => j !== i) })}
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
                            onClick={() => setEditDraft({ ...draft, timeSlots: [...draft.timeSlots, { ...DEFAULT_SLOT }] })}
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

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {!canEdit ? (
                          <span className="text-xs text-slate-400">Read only</span>
                        ) : deleteConfirmId === row.id ? (
                          <>
                            <span className="text-xs text-red-500 font-bold mr-1">Delete?</span>
                            <button type="button" disabled={isPending} onClick={doDelete} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2.5 py-1.5 rounded-md transition-colors">Yes</button>
                            <button type="button" disabled={isPending} onClick={cancelDelete} className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors">No</button>
                          </>
                        ) : isEditing ? (
                          <>
                            <button type="button" disabled={isPending} onClick={saveEdit} className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              {isPending ? "Saving..." : "Save"}
                            </button>
                            <button type="button" disabled={isPending} onClick={cancelEdit} className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startEdit(row)} title="Edit"
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors opacity-0 group-hover:opacity-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => confirmDelete(row.id)} title="Delete"
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="scale-in bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Add Day</h2>
                <p className="text-xs text-slate-400 mt-0.5">Set availability for a new day</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Day</label>
                <select
                  value={newEntry.day}
                  onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {availableDays.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Status</label>
                <select
                  value={newEntry.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    setNewEntry({
                      ...newEntry,
                      status,
                      timeSlots: slotListForStatus(status, newEntry.timeSlots),
                    });
                  }}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {newEntry.status !== "Off-duty" && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Time Slots</label>
                  <div className="space-y-1.5">
                    {newEntry.timeSlots.map((slot, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const s = [...newEntry.timeSlots];
                            s[i] = { ...s[i], start: e.target.value };
                            setNewEntry({ ...newEntry, timeSlots: s });
                          }}
                          className="mono flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-slate-300 text-xs">-</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const s = [...newEntry.timeSlots];
                            s[i] = { ...s[i], end: e.target.value };
                            setNewEntry({ ...newEntry, timeSlots: s });
                          }}
                          className="mono flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        {newEntry.timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewEntry({ ...newEntry, timeSlots: newEntry.timeSlots.filter((_, j) => j !== i) })}
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
                      onClick={() => setNewEntry({ ...newEntry, timeSlots: [...newEntry.timeSlots, { ...DEFAULT_SLOT }] })}
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
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors">Cancel</button>
              <button type="button" disabled={isPending} onClick={saveAdd} className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors shadow-sm">
                {isPending ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
