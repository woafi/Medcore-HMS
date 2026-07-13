import { useState } from "react";
import { STATUS_CONFIG, BOOKED_SLOT_STYLE } from "./constants";
import { toMins, pct } from "./utils";
import SlotTooltip from "./SlotTooltip";
import type { TimelineBarProps } from "./types";

/**
 * Renders a horizontal bar representing a day's time slots.
 * Each slot is positioned and sized proportionally across a 24-hour timeline.
 * Hovering a slot reveals a tooltip with exact times.
 */
export default function TimelineBar({ day }: TimelineBarProps) {
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const cfg = STATUS_CONFIG[day.status] || STATUS_CONFIG["Off-duty"];

  // ── Off-duty or no slots → show dashed placeholder ──────────────────────
  if (day.status === "Off-duty" || day.timeSlots.length === 0) {
    return (
      <div
        className="relative h-8 rounded-lg overflow-hidden flex items-center px-3"
        style={{ background: "#f8fafc", border: "1.5px dashed #e2e8f0" }}
      >
        <span className="text-[11px] text-slate-400 italic font-medium tracking-wide">
          Off-duty
        </span>
      </div>
    );
  }

  // ── Render time slots as positioned blocks ──────────────────────────────
  return (
    <div
      className="relative h-8 rounded-lg overflow-visible"
      style={{ background: "#f1f5f9" }}
    >
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
              background: isHovered
                ? slotStyle.slotBgHover ?? slotStyle.slotBorder
                : slotStyle.slotBg,
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
