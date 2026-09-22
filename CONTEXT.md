# GO//NEXT

GO//NEXT is a scheduling tool for VALORANT Premier teams: it collects teammates' weekly availability, surfaces scheduling conflicts, and tracks upcoming Premier matches.

## Language

**GO//NEXT**:
The product's name and brand, used everywhere in-app and in marketing.
_Avoid_: SIDE::WATCH (an inconsistent working name left over in the original mockup — the mockup itself used it inconsistently; no longer used)

**Teammate**:
A member of the team whose weekly Availability is tracked on the schedule grid. A Teammate only exists because a Discord account joined via the team's Invite Link, or an Admin added a Discord account that had already signed in — there is no placeholder state, and a Teammate's name/avatar are always the linked Discord account's. Teammates are not categorized by role or position.
_Avoid_: Player, member

**Invite Link**:
The single shareable link (`/join/{token}`) that lets someone join the team by signing in with Discord. One per Team; a Coach can regenerate it, which invalidates the previous link. The first person to ever join a team through it becomes its Coach.
_Avoid_: Claim link, invite code

**Coach**:
A Teammate with elevated permissions: managing the roster (removing/reactivating teammates, regenerating the Invite Link) and managing Matches (create/edit/delete). Everyone else can only edit their own Availability.
_Avoid_: IGL (IGL is a Valorant role concept we deliberately don't model — Coach is purely a permissions flag). Not the same as Admin.

**Admin**:
A site operator, above any Coach, who manages every signed-in user from `/admin`: adding someone who has signed in but isn't on the team, deactivating anyone (Coaches included), reactivating, promoting/demoting Coaches, and regenerating the Invite Link. Admin is configured via the `ADMIN_DISCORD_IDS` environment variable (Discord user ids), not stored in the database, and doesn't require being a Teammate.
_Avoid_: Superuser, owner

**Availability**:
A Teammate's state for a single day: `Available`, `Tentative`, `Unavailable`, or `Not set` (no value entered). `Available` may optionally carry a time range (e.g. "6PM–11PM") narrower than the full day; without one it's implicitly all day.
_Avoid_: Status (too generic on its own)

**Weekly default**:
A Teammate's usual Availability for a weekday (e.g. every Tuesday, Available 7PM–11PM). It's never copied into a day: any day without its own entry (or one set back to `Not set`) reads as the default, so changing a default updates all such days at once.
_Avoid_: Recurring availability, template

**Note**:
A short aside (up to 60 characters) a Teammate attaches to one day, e.g. "might be late". Shown on the grid and in Discord pings; it doesn't affect Confirmed.

**Match**:
A scheduled Premier match window on the team's calendar — a date and time. Premier queues teams against each other within a match window rather than fixing opponents in advance, so a Match never has a known opponent ahead of time; it isn't modeled. Its Map is derived from the Week it falls in, except a Match flagged Playoffs, which has none.
_Avoid_: Fixture, opponent (there is no pre-set opponent field), Group (the old per-match text label this replaced)

**Result**:
A played Match's outcome, `Win` or `Loss`, recorded by a Coach. Results roll up into the season **Record**, overall and per Map (Playoffs counted on its own).
_Avoid_: Score (rounds aren't tracked)

**Ping**:
A Discord message the team's bot posts from GO//NEXT: the match-day roll call, the 30-minute warning, and the Sunday reminder about next week's unset days. The site decides what's due; the bot only posts each one once.
_Avoid_: Notification, alert

**Week**:
The Monday–Sunday scheduling unit Riot assigns a single Map to; a Coach sets that Map, and up to two Matches can be played on it that week.
_Avoid_: Round, cycle

**Playoffs**:
The season's single tournament-style Match, run as a bracket rather than on a Week's assigned Map. A Match is flagged Playoffs rather than Playoffs being tracked separately, and it's exempt from the two-Matches-per-week cap.
_Avoid_: Finals (Playoffs may be more than one bracket round; the flag doesn't distinguish them)

**Confirmed**:
A Teammate counts as confirmed for a Match when their Availability on the Match's date (in Eastern time) is `Available` and, if a time range is set, that range covers the Match's start time. Confirmed is always derived from Availability — never stored as its own field.
_Avoid_: RSVP'd, accepted

**This week**:
The real calendar week (Monday–Sunday) containing today's date. The schedule grid defaults to this week but a Teammate can navigate to past/future weeks; "This week" always jumps back to it.
