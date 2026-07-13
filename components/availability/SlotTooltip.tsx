import { to12Hour } from "./utils";
import type { SlotTooltipProps } from "./types";

/**
 * Floating tooltip that shows the exact time range of a slot
 * and whether it is already booked. Used inside TimelineBar.
 */
export default function SlotTooltip({ slot, visible }: SlotTooltipProps) {
  if (!visible) return null;

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] font-mono rounded-md px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
      {to12Hour(slot.start)} - {to12Hour(slot.end)}
      {slot.isBooked ? " · Booked" : ""}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  );
}
