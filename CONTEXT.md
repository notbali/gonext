# GO//NEXT

GO//NEXT is a scheduling tool for VALORANT Premier teams: it collects teammates' weekly availability, surfaces scheduling conflicts, and tracks upcoming Premier matches.

## Language

**GO//NEXT**:
The product's name and brand, used everywhere in-app and in marketing.
_Avoid_: SIDE::WATCH (an inconsistent working name left over in the original mockup — the mockup itself used it inconsistently; no longer used)

**Teammate**:
A member of the team whose weekly Availability is tracked on the schedule grid. A Teammate only exists because a Discord account joined via the team's Invite Link — there is no placeholder or manually-added state, and a Teammate's name/avatar are always the linked Discord account's. Teammates are not categorized by role or position.
_Avoid_: Player, member

**Invite Link**:
The single shareable link (`/join/{token}`) that lets someone join the team by signing in with Discord. One per Team; a Coach can regenerate it, which invalidates the previous link. The first person to ever join a team through it becomes its Coach.
_Avoid_: Claim link, invite code

**Coach**:
A Teammate with elevated permissions: managing the roster (removing/reactivating teammates, regenerating the Invite Link) and managing Matches (create/edit/delete). Everyone else can only edit their own Availability.
_Avoid_: Admin, IGL (IGL is a Valorant role concept we deliberately don't model — Coach is purely a permissions flag)

**Availability**:
A Teammate's state for a single day: `Available`, `Tentative`, `Unavailable`, or `Not set` (no value entered). `Available` may optionally carry a time range (e.g. "6PM–11PM") narrower than the full day; without one it's implicitly all day.
_Avoid_: Status (too generic on its own)

**Match**:
A scheduled Premier match window on the team's calendar — a date, time, and Group. Premier queues teams against each other within a match window rather than fixing opponents in advance, so a Match never has a known opponent ahead of time; it isn't modeled.
_Avoid_: Fixture, opponent (there is no pre-set opponent field)

**Confirmed**:
A Teammate counts as confirmed for a Match when their Availability on the Match's date is `Available` and, if a time range is set, that range covers the Match's start time. Confirmed is always derived from Availability — never stored as its own field.
_Avoid_: RSVP'd, accepted

**This week**:
The real calendar week (Monday–Sunday) containing today's date. The schedule grid always shows the current real week — there is no navigating to other weeks in this pass.
