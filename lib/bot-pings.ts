import type { DayAvailability, Match, Teammate } from "./types";
import { easternPartsToUtc, getEasternParts, isOnTeamDay, matchDateLine } from "./dates";
import { getConfirmedTeammates } from "./matches";
import { MATCH_READY_THRESHOLD } from "./schedule-column-state";

/** A Teammate as the Discord bot needs them: `week` lines up with the `dates` passed in. */
export interface PingTeammate extends Pick<Teammate, "id" | "name" | "week"> {
  /** The linked Discord account's user id, for an @mention. */
  discordId: string | null;
}

/** A message the bot should post once; `key` lets it skip ones it has already sent. */
export interface BotPing {
  key: string;
  content: string;
  /** The only users the message may notify — the bot passes these as allowed_mentions. */
  mentionUserIds: string[];
}

export interface PingInput {
  now: Date;
  /** Consecutive schedule days (see getLookaheadDates) covering today and next week. */
  dates: Date[];
  teammates: PingTeammate[];
  matches: Match[];
  siteUrl: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/** The match-day ping opens at noon ET, or this long before an earlier match. */
const MATCH_DAY_LEAD = 4 * HOUR;
const MATCH_SOON_LEAD = 30 * MINUTE;
const MATCH_SOON_GRACE = 15 * MINUTE;
/** Next week's reminder goes out Sunday from 6PM ET. */
const WEEK_REMINDER_HOUR = 18;

function mention(t: PingTeammate): string {
  return t.discordId ? `<@${t.discordId}>` : t.name;
}

function mentions(ts: PingTeammate[]): string {
  return ts.map(mention).join(" ");
}

function ids(ts: PingTeammate[]): string[] {
  return ts.flatMap((t) => (t.discordId ? [t.discordId] : []));
}

function withStatus(teammates: PingTeammate[], dayIndex: number, status: DayAvailability["status"]) {
  return teammates.filter((t) => (t.week[dayIndex]?.status ?? "not-set") === status);
}

function matchLabel(match: Match): string {
  return matchDateLine(match, match.isPlayoffs ? "PLAYOFFS" : (match.map ?? "MAP TBD"));
}

function confirmedCount(n: number): string {
  return n > MATCH_READY_THRESHOLD ? `${n}` : `${n}/${MATCH_READY_THRESHOLD}`;
}

function matchDayPing(match: Match, input: PingInput, dayIndex: number): BotPing {
  const confirmed = getConfirmedTeammates(match, input.teammates, input.dates);
  const tentative = withStatus(input.teammates, dayIndex, "tentative");
  const notSet = withStatus(input.teammates, dayIndex, "not-set");
  const short = MATCH_READY_THRESHOLD - confirmed.length;

  const lines = [
    `**Premier today** — ${matchLabel(match)}`,
    `✅ Confirmed (${confirmedCount(confirmed.length)}): ${confirmed.length ? mentions(confirmed) : "nobody yet"}`,
  ];
  if (short > 0) lines.push(`⚠️ Need ${short} more to play.`);
  if (tentative.length) lines.push(`🤔 Tentative: ${mentions(tentative)}`);
  if (notSet.length) lines.push(`❓ Not set: ${mentions(notSet)}`);
  lines.push(`Set your availability: ${input.siteUrl}`);

  return {
    key: `match-day:${match.id}`,
    content: lines.join("\n"),
    mentionUserIds: ids([...confirmed, ...tentative, ...notSet]),
  };
}

function matchSoonPing(match: Match, input: PingInput, dayIndex: number): BotPing {
  const confirmed = getConfirmedTeammates(match, input.teammates, input.dates);
  const short = MATCH_READY_THRESHOLD - confirmed.length;
  const minutes = Math.round((match.date.getTime() - input.now.getTime()) / MINUTE);
  const when = minutes > 0 ? `in ${minutes} min` : "starting now";

  const lines = [`**Premier ${when}** — ${matchLabel(match)}`];
  if (confirmed.length) lines.push(`${mentions(confirmed)} — get online.`);
  const fillIns = short > 0
    ? [...withStatus(input.teammates, dayIndex, "tentative"), ...withStatus(input.teammates, dayIndex, "not-set")]
    : [];
  if (short > 0) {
    lines.push(`⚠️ Need ${short} more${fillIns.length ? ` — ${mentions(fillIns)} can you play?` : "."}`);
  }

  return { key: `match-soon:${match.id}`, content: lines.join("\n"), mentionUserIds: ids([...confirmed, ...fillIns]) };
}

function dateKey(day: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

function weekReminderPing(input: PingInput, todayIndex: number): BotPing | null {
  const nextMonday = todayIndex + 1;
  const nextWeek = Array.from({ length: 7 }, (_, i) => nextMonday + i);
  if (nextWeek[6] >= input.dates.length) return null;

  const missing = input.teammates.filter((t) => nextWeek.some((i) => (t.week[i]?.status ?? "not-set") === "not-set"));
  if (!missing.length) return null;

  return {
    key: `week-reminder:${dateKey(input.dates[nextMonday])}`,
    content: [
      `**Next week's availability** — ${mentions(missing)} you still have days not set.`,
      `Fill them in: ${input.siteUrl}/?week=1`,
    ].join("\n"),
    mentionUserIds: ids(missing),
  };
}

/**
 * The Discord pings due at `now`. Each stays due for a window rather than an
 * instant, so a bot polling every few minutes can't miss one — it dedupes by
 * `key` instead. All windows are in Eastern time (see lib/dates.ts).
 */
export function buildDuePings(input: PingInput): BotPing[] {
  const { now } = input;
  const todayIndex = input.dates.findIndex((d) => isOnTeamDay(now, d));
  if (todayIndex === -1) return [];

  const pings: BotPing[] = [];
  const t = now.getTime();

  for (const match of input.matches) {
    if (!isOnTeamDay(match.date, input.dates[todayIndex])) continue;
    const start = match.date.getTime();
    const p = getEasternParts(match.date);
    const noon = easternPartsToUtc({ year: p.year, month: p.month, day: p.day, hours: 12, minutes: 0 }).getTime();
    const dayOpens = Math.min(noon, start - MATCH_DAY_LEAD);

    if (t >= dayOpens && t < start - MATCH_SOON_LEAD) {
      pings.push(matchDayPing(match, input, todayIndex));
    } else if (t >= start - MATCH_SOON_LEAD && t < start + MATCH_SOON_GRACE) {
      pings.push(matchSoonPing(match, input, todayIndex));
    }
  }

  const today = getEasternParts(now);
  if (today.dayOfWeek === 0 && today.hours >= WEEK_REMINDER_HOUR) {
    const reminder = weekReminderPing(input, todayIndex);
    if (reminder) pings.push(reminder);
  }

  return pings;
}
