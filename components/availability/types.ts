// ─── Time Slot Types ─────────────────────────────────────────────────────────

/** A single time slot row (display model) */
export type TimeSlotRow = {
  id?: string;
  start: string;
  end: string;
  isBooked?: boolean;
};

/** An availability day row (display model) */
export type AvailabilityRow = {
  id: string;
  day: string;
  status: string;
  timeSlots: TimeSlotRow[];
};

/** New entry being created in the Add Day modal */
export type NewAvailabilityEntry = {
  day: string;
  status: string;
  timeSlots: TimeSlotRow[];
};

// ─── Action Return Types ─────────────────────────────────────────────────────

/** Shape returned by createAvailability / updateAvailability / deleteAvailability on success */
export type AvailabilityActionSuccess = {
  ok: true;
  availability?: Record<string, unknown>;
};

/** Shape returned by createAvailability / updateAvailability on failure */
export type AvailabilityActionError = {
  ok: false;
  error: string;
};

/** Union of both outcomes */
export type AvailabilityActionResult = AvailabilityActionSuccess | AvailabilityActionError;

// ─── Status Config Types ─────────────────────────────────────────────────────

/** Visual styling config for a single status */
export type StatusStyleConfig = {
  bg: string;
  text: string;
  dot: string;
  border: string;
  slotBg: string;
  slotText: string;
  slotBorder: string;
  slotBgHover?: string;
};

/** Lookup of status -> visual config */
export type StatusConfigMap = Record<string, StatusStyleConfig>;

// ─── Props Types for Sub-Components ──────────────────────────────────────────

export type StatusPillProps = {
  status: string;
};

export type SlotTooltipProps = {
  slot: TimeSlotRow;
  visible: boolean;
};

export type TimelineBarProps = {
  day: AvailabilityRow;
};

export type AddDayModalProps = {
  /** Days not yet configured (shown as options) */
  availableDays: string[];
  /** Whether a transition is in progress */
  isPending: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called with the new entry data to save */
  onSave: (entry: NewAvailabilityEntry) => void;
};

export type TimelineViewProps = {
  rows: AvailabilityRow[];
  availableDaysCount: number;
  totalSlots: number;
};

export type ListViewProps = {
  rows: AvailabilityRow[];
  editingId: string | null;
  editDraft: AvailabilityRow | null;
  deleteConfirmId: string | null;
  isPending: boolean;
  canEdit: boolean;
  onStartEdit: (row: AvailabilityRow) => void;
  onCancelEdit: () => void;
  onSaveEdit: (draft: AvailabilityRow) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onEditDraftChange: (draft: AvailabilityRow) => void;
};

// ─── Main Component Props ────────────────────────────────────────────────────

export type AvailabilityScheduleProps = {
  /** Raw availability data from Prisma (with available_slots relation) */
  availabilities?: Record<string, unknown>[];
  /** Doctor ID for creating new availabilities */
  doctorId?: string;
  /** Paths to revalidate after mutations */
  revalidatePaths?: string[];
};
