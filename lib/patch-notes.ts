/**
 * The site's Patch notes, shown on /whats-new — what changed, written for players.
 *
 * To ship a release, add one entry at the top: newest first, dated "YYYY-MM-DD" on the
 * day it went live. Keep bullets short and about what a teammate will notice, not how
 * it was built. The nav's "new" dot lights up for anyone who hasn't opened the page
 * since the top entry's date.
 */
export interface PatchNote {
  /** "YYYY-MM-DD", the day it went live. */
  date: string;
  title: string;
  changes: string[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    date: "2026-10-14",
    title: "Light mode and smoother editing",
    changes: [
      "New light mode: tap the sun next to Log in. Your browser remembers the choice.",
      "Hover a day in your row and press 1, 2, 3 or 0 to set it. No need to click first.",
      "Days you haven't set now show as a blank box with the dropdown arrow in the middle.",
      "The tabs sit in the middle of the top bar.",
      "The Playoffs match glows more gently and no longer spills over the matches around it.",
    ],
  },
  {
    date: "2026-10-14",
    title: "Premier Stage schedule",
    changes: [
      "Every week of Stage V26A6 now shows its number and map on its own, straight from Riot's schedule.",
      "Summit joins the map pool, with its artwork on the calendar.",
      "Coaches no longer pick the map for a Stage week; they only set one for weeks outside a Stage.",
    ],
  },
  {
    date: "2026-10-02",
    title: "Quicker edits, live countdowns",
    changes: [
      "Match badges count down live (IN 2D 4H, IN 12M, LIVE), and each match shows your local time under the Eastern one.",
      "Set your days from the keyboard: 1, 2, 3 and 0 pick a status, and the arrow keys move between days.",
      "Changed a day by mistake? Hit Undo on the toast to put it back.",
      "Coaches see who still has unset days this week on the Roster page, with a Discord ping ready to copy.",
    ],
  },
  {
    date: "2026-10-02",
    title: "Spooky season",
    changes: [
      "Through October the site goes pumpkin-on-midnight, with fog and a jack-o'-lantern tab icon.",
      "Tentative and Unavailable read Ghost? and RIP on the grid.",
      "October's wins and losses count as treats and tricks, and a match on Oct 31 gets a Halloween-night badge.",
    ],
  },
  {
    date: "2026-09-22",
    title: "Match day tools",
    changes: [
      "Coaches can mark a played match as a win or loss, and a Record card tracks the season overall and per map.",
      "Subscribe to the team's matches in your own calendar app from the Matches page.",
      "Coaches get a Best times card suggesting the evenings when the most teammates can play.",
      "The Discord bot now posts a match-day roll call, a 30-minute warning and a Sunday reminder about next week's unset days.",
      "A match card warns when fewer than five teammates are confirmed.",
    ],
  },
  {
    date: "2026-09-22",
    title: "Your usual week",
    changes: [
      "Set weekly defaults once (say, every Tuesday 7PM–11PM) and they fill any day you leave unset.",
      "Add a short note to a day, like \"might be late\". Everyone sees it on the grid and in the Discord roll call.",
    ],
  },
];

export const LATEST_PATCH_DATE = PATCH_NOTES[0]?.date ?? "";

/** Whether there's a note newer than the last one the viewer saw (`lastSeen`, a date or null). */
export function hasUnseenPatchNotes(lastSeen: string | null, latest: string = LATEST_PATCH_DATE): boolean {
  if (!latest) return false;
  if (!lastSeen || !/^\d{4}-\d{2}-\d{2}$/.test(lastSeen)) return true;
  return lastSeen < latest;
}

/** "Oct 2, 2026" for "2026-10-02", read as a calendar day so no timezone can shift it. */
export function patchDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
