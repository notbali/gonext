export interface CalendarMatch {
  id: string;
  date: Date;
  /** The week's map name, or "PLAYOFFS". */
  label: string;
}

/** Premier match windows run about this long; calendars need an end time. */
const MATCH_DURATION_MS = 90 * 60_000;

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** An iCalendar (RFC 5545) feed of the team's matches, for calendar subscriptions. */
export function buildMatchCalendar(teamName: string, matches: CalendarMatch[], now: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GO//NEXT//Premier matches//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(teamName)} Premier`,
    ...matches.flatMap((m) => [
      "BEGIN:VEVENT",
      `UID:match-${m.id}@gonext`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${utcStamp(m.date)}`,
      `DTEND:${utcStamp(new Date(m.date.getTime() + MATCH_DURATION_MS))}`,
      `SUMMARY:${escapeText(`Premier — ${m.label}`)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
