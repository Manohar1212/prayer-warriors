# Midnight Prayer Rotation (Design)

Date: 2026-10-06

## Goal

Every night at 12:00 AM one member of a small rotation prays for the group. The rotation starts
as Shiny, Alekhya, Ratna Kumari, Daya Ratnam and Divya Jyothsna. Each month the app shuffles them
fairly across the nights, so everyone knows their nights well ahead. The person on duty is
reminded in the evening, confirms afterwards with "I prayed", and the whole group can see who is
praying tonight.

## Terms

- **Night of D**: the 12:00 AM at the end of Indian calendar day D, the midnight between D and
  D+1. "Shiny's night is Tue 7 Oct" means she prays at the midnight that ends Tuesday, and her
  reminder comes on Tuesday evening. All days are Asia/Kolkata, using `dayKeyFor` from
  `prayerNight.js`.
- **Month**: the nights of D for every day D in that calendar month (Oct has 31 nights,
  1–31 Oct).

## Data

| Class / field | Fields | Row ACL | CLP |
|---|---|---|---|
| `Group.midnightRotation` | array of user ids, in the order the admin listed them | (Group's) | writes master only |
| `MidnightNight` | `group`, `day` (`"2026-10-07"`), `month` (`"2026-10"`), `user`, `prayedAt`, `remindedAt`, `nudgedAt` | read: group roles | reads authenticated; writes master only |

The initial rotation is seeded once with the five user ids above.

## The shuffle (`midnightPrayer.js`, pure)

`planMonth({ month, rotation, lastPersonBefore, random })` returns `[{ day, userId }]` for every
night of the month:

- The month is filled in rounds. Each round is a fresh random order of the whole rotation, so
  everyone gets one night per round, about six a month with five people.
- A round never starts with the person who ended the previous round, or with
  `lastPersonBefore` (the last night of the previous month), so nobody prays two nights in a row.
  With a rotation of one person this rule is skipped.
- `random` is injected. Production seeds it from `groupId + month`, so two first opens that race
  produce the same plan. The tests pass a fixed sequence.
- An empty rotation plans nothing.

## Cloud Code (`midnightPrayer.js` handlers, wired in `main.js`)

| Function | Rule |
|---|---|
| `getMidnightMonth({ month })` | Active member. If the month has no rows and the rotation isn't empty, plan and save it; this is how the month gets made, with no job needed. Only the current month and the next one (from the 20th onward) can be created. If a race left two rows for one day, keep the oldest and delete the rest. Returns `{ month, nights: [{ day, userId, name, prayed }], rotation: [{ userId, name }] }`. |
| `getMidnightTonight()` | Active member. Returns tonight's night (D = today), yesterday's night (so its person can still confirm), and the caller's next night on or after today. Creates the month first if needed, as above. |
| `markMidnightPrayed({ day })` | Only the night's person may confirm, from 11:00 PM on day D until 11:59 PM on D+1. Sets `prayedAt`. Calling it twice changes nothing. |
| `reassignMidnightNight({ day, userId })` | Admin only. The new person must be an active member, not necessarily in the rotation. Only tonight or later nights can be reassigned. Clears `prayedAt` and `remindedAt`. |
| `setMidnightRotation({ userIds })` | Admin only. 0–20 active members, no duplicates. Applies to months planned from now on. A removed member's future nights in already-planned months go to the remaining rotation members, fewest nights first, without making back-to-back nights where that can be avoided. A newly added member joins from the next month, or the admin can reassign nights to them by hand. |

## Reminders (job `midnightPrayerReminders`, scheduled hourly in the Back4App dashboard)

Each run is idempotent, so running it every hour is safe and a missed hour catches up:

- **From 9:00 PM IST on day D:** if tonight's night has a person and no `remindedAt`, send them a
  push "Tonight at 12:00 AM is your night to pray for the group." and set `remindedAt`.
- **From 12:00 PM IST on D+1:** if last night's night has no `prayedAt` and no `nudgedAt`, send
  its person a gentle push "Did you pray last night? Tap to mark it." and set `nudgedAt`.

Both go only to that person, through the existing notifier, with a new type and a new preference
key `midnight` (default on), shown in notification settings like the others. They respect the
same opt-outs.

**One-time setup:** in the Back4App dashboard, schedule `midnightPrayerReminders` to run every
hour. Without it, months still appear and "I prayed" still works, but no reminders are sent.

## App

- **Home: "Tonight's midnight prayer" card.** Placed high on Home, under the greeting.
  - It shows tonight's person ("Ratna Kumari is praying tonight at 12:00 AM").
  - If it's your night: "Tonight is your night · 12:00 AM".
  - From 11:00 PM on your night until the end of the next day: an **I prayed** button, then a ✓.
  - Otherwise, if you're in the rotation: "Your next night: Fri 10 Oct".
  - The card is hidden when the rotation is empty or the month can't load.
  - Tapping it opens the calendar.
- **Calendar screen `app/prayer/midnight.tsx`.**
  - The month as a list of nights: date, name, a ✓ for prayed. Your own nights and tonight are
    highlighted.
  - It can go forward to the next month once that month is available.
  - The admin can tap any night from tonight onward to reassign it (pick a member), and has a
    **Rotation** button to choose the members.
- **Language.** All new text in English and Telugu (`en.ts`, `te.ts`).

## Errors

All handler errors use the existing plain-language `MESSAGES` pattern, for example "Only an admin
can change the midnight prayer." and "You can mark this only after your night begins." The app
shows them the way other screens do. A failed load hides the Home card instead of showing an
error there.

## Testing

- **`planMonth`:** every night is filled; each person's count is within one of the others; no
  back-to-back nights, including across rounds and from the previous month; one-person and empty
  rotations.
- **Handlers:**
  - Lazy creation happens once, and duplicate rows are cleaned up.
  - Month limits: no past months, and next month only from the 20th.
  - "I prayed": the time window and only the night's person.
  - Admin-only reassign and rotation, and redistribution when someone is removed.
- **Reminder job:** the 9 PM reminder and next-day nudge each fire once; prefs are respected;
  nothing is sent before the times.
- **App:** service mapping, and the Home card's states (someone else tonight, your night before
  and after 11 PM, prayed, next night, hidden).

## Out of scope

- Members swapping nights between themselves; the admin reassigns.
- Choosing a time other than 12:00 AM.
- Several people per night.
