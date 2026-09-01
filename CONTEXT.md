# GO//NEXT

GO//NEXT is a scheduling tool for VALORANT Premier teams: it collects teammates' weekly availability, surfaces scheduling conflicts, and tracks upcoming Premier matches.

## Language

**GO//NEXT**:
The product's name and brand, used everywhere in-app and in marketing.
_Avoid_: SIDE::WATCH (an inconsistent working name left over in the original mockup — the mockup itself used it inconsistently; no longer used)

**Teammate**:
A member of the team whose weekly Availability is tracked on the schedule grid. Teammates are not categorized by role or position.
_Avoid_: Player, member

**Availability**:
A Teammate's state for a single day: `Available`, `Tentative`, `Unavailable`, or `Not set` (no value entered). `Available` may optionally carry a time range (e.g. "6PM–11PM") narrower than the full day; without one it's implicitly all day.
_Avoid_: Status (too generic on its own)

**Match**:
A scheduled Premier match against an opposing team, on a specific date and time.

**Confirmed**:
A Teammate counts as confirmed for a Match when their Availability on the Match's date is `Available` and, if a time range is set, that range covers the Match's start time. Confirmed is always derived from Availability — never stored as its own field.
_Avoid_: RSVP'd, accepted

**This week**:
The real calendar week (Monday–Sunday) containing today's date. The schedule grid always shows the current real week — there is no navigating to other weeks in this pass.
