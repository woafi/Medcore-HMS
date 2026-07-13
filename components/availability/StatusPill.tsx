import { STATUS_CONFIG } from "./constants";
import type { StatusPillProps } from "./types";

/**
 * Small colored pill badge that displays an availability status
 * (Available, Emergency Only, or Off-duty) with a dot indicator.
 */
export default function StatusPill({ status }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Off-duty"];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${cfg.bg} ${cfg.text} border ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}
