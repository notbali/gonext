export type AvailabilityStatus = "available" | "tentative" | "unavailable" | "not-set";

export const AVAILABILITY_STATUS_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "not-set", label: "Not set" },
  { value: "available", label: "Available" },
  { value: "tentative", label: "Tentative" },
  { value: "unavailable", label: "Unavailable" },
];

export interface DayAvailability {
  status: AvailabilityStatus;
  /** Only meaningful when status is "available". Absent means the full day. */
  timeRange?: string;
}

export interface Teammate {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** One entry per day of the displayed date range, chronological (Monday-first per week). */
  week: DayAvailability[];
}

export interface Match {
  id: string;
  date: Date;
  group: string;
  /** False once the match falls outside the displayed week, where no availability has been modeled yet. */
  availabilityCollected: boolean;
}
