import { getEasternParts } from "./dates";
import type { AvailabilityStatus } from "./types";

/**
 * A seasonal skin the whole site wears for a stretch of the year. Only cosmetic:
 * colors, ambient effects and copy change, never behavior. `null` is the normal look.
 */
export type Season = "halloween" | null;

const OCTOBER = 9;
const OVERRIDES: Record<string, Season> = { halloween: "halloween", off: null };

/**
 * The season for `now`, by the team's Eastern calendar. `override` (the
 * `SEASON` env var: "halloween" or "off") forces it either way so the skin can
 * be previewed or switched off; anything else is ignored.
 */
export function getSeason(now: Date, override: string | undefined = process.env.SEASON): Season {
  if (override && override in OVERRIDES) return OVERRIDES[override];
  return getEasternParts(now).month === OCTOBER ? "halloween" : null;
}

/** Whether a real instant (e.g. a Match's date) falls on Oct 31 in Eastern time. */
export function isHalloweenNight(instant: Date): boolean {
  const p = getEasternParts(instant);
  return p.month === OCTOBER && p.day === 31;
}

/**
 * What a scrambled map name cycles through in the halloween season: daggers and
 * Greek/Cyrillic capitals, all in JetBrains Mono so the label's width never jumps.
 */
export const SEASONAL_SCRAMBLE_CHARACTERS = "†‡ΨΩΔΣΞЖЯЮΦ";

/** The boot overlay's stage lines for a season. */
export function bootStages(season: Season): string[] {
  return season === "halloween"
    ? ["SUMMONING", "RAISING ROSTER", "HAUNTING SCHEDULE", "READY"]
    : ["SESSION", "ROSTER", "SCHEDULE", "READY"];
}

const HALLOWEEN_STATUS_LABELS: Partial<Record<AvailabilityStatus, string>> = {
  tentative: "Ghost?",
  unavailable: "RIP",
};

/** The short word a season swaps in for a status on the grid, if it has one. */
export function seasonalStatusLabel(status: AvailabilityStatus, season: Season): string | undefined {
  return season === "halloween" ? HALLOWEEN_STATUS_LABELS[status] : undefined;
}
