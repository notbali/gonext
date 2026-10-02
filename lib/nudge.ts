import type { DayAvailability } from "./types";
import { getEasternParts } from "./dates";

/** A Teammate as a Coach's nudge needs them: `week` lines up with the `dates` passed in. */
export interface NudgeTeammate {
  id: string;
  name: string;
  /** The linked Discord account's user id, for an @mention. */
  discordId: string | null;
  week: DayAvailability[];
}

/** A schedule day (local getters stand in for the Eastern wall clock) as a sortable number. */
function dayKey(year: number, month: number, day: number): number {
  return year * 10_000 + month * 100 + day;
}

/** Teammates with at least one day still `not-set` between today (Eastern) and the end of `dates`. */
export function unsetForRestOfWeek<T extends Pick<NudgeTeammate, "week">>(teammates: T[], dates: Date[], now: Date): T[] {
  const p = getEasternParts(now);
  const today = dayKey(p.year, p.month, p.day);
  const remaining = dates.flatMap((d, i) => (dayKey(d.getFullYear(), d.getMonth(), d.getDate()) >= today ? [i] : []));
  return teammates.filter((t) => remaining.some((i) => (t.week[i]?.status ?? "not-set") === "not-set"));
}

/** A ready-to-paste Discord message @-ing everyone in `teammates` to fill in their week. */
export function nudgeMessage(teammates: Pick<NudgeTeammate, "name" | "discordId">[], siteUrl: string): string {
  const mentions = teammates.map((t) => (t.discordId ? `<@${t.discordId}>` : t.name)).join(" ");
  return `${mentions} — you've still got days not set this week. Fill them in: ${siteUrl}/`;
}
