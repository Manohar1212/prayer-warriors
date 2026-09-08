# Prayer Module (Design)

Date: 2026-09-08 — Phase 3 of `docs/Prayer_Warriors_Product_Technical_Plan.md` (sections 7, 8, 20).

## Goal

Members share prayer requests with the group, tap "I'm praying" on each other's requests, mark
their own requests answered with an optional testimony, and keep a private prayer journal.
Reads use the Parse SDK directly (group-role ACLs); every write goes through Cloud Code so the
rules live on the server.

## Data

| Class | Fields | ACL on rows | CLP |
|---|---|---|---|
| `PrayerRequest` | `group` Pointer, `author` Pointer<_User>, `title` (≤120), `description` (≤2000), `category` (`family`\|`personal`\|`work`\|`spiritual`\|`relationships`\|`other`), `urgency` (`normal`\|`urgent`), `status` (`active`\|`answered`\|`archived`), `prayingCount` Number, `answeredAt` Date, `testimony` (≤1000) | read: `role:group:<id>:member` + admin | find/get/count authenticated; writes master only |
| `PrayerResponse` | `prayerRequest` Pointer, `user` Pointer, `responseType` = `praying` | read: group roles | find/get/count authenticated; writes master only |
| `PrayerJournalEntry` | `user` Pointer, `title` (≤120), `body` (≤4000), `category`, `answered` Boolean, `answeredAt` Date | owner read/write only | find/get/count/create/update/delete authenticated; `beforeSave` forces `user` = caller and an owner-only ACL |

Category labels: Family, Personal, Work, Spiritual, Relationships, Other.

## Cloud Code (`backend/cloud/prayer.js`, pure; wired in `main.js`)

| Function | Rule |
|---|---|
| `createPrayerRequest({ title, description, category, urgency })` | caller has an active membership → that group; validate; create with `status=active`, `prayingCount=0`, group-role read ACL. Returns the DTO. |
| `togglePraying({ requestId })` | caller is a member of the request's group; request `active`; if a response exists delete it and decrement, else create and increment (atomic `Increment`). Returns `{ praying, prayingCount }`. |
| `markAnswered({ requestId, testimony })` | caller is the author or a group admin; request `active` → `answered`, `answeredAt` now, `testimony`. Returns the DTO. |

Messages: `notMember` "You're not a member of this group yet."; `titleRequired` "Give your request a short title."; `titleTooLong` "Keep the title under 120 characters."; `descriptionTooLong` "Keep the details under 2000 characters."; `invalidCategory` "Choose a category."; `invalidUrgency` "Choose an urgency."; `notFound` "That prayer request isn't available."; `notActive` "This request has already been answered."; `notAllowed` "Only the person who asked, or an admin, can mark this answered."; `testimonyTooLong` "Keep the testimony under 1000 characters."

## Mobile

- `src/features/prayer/` — `types.ts`, `service.ts` (`createPrayerService`), `usePrayerRequests(status)`, `journal.ts` (`createJournalService`), `useJournal()`, tests.
- `PrayerRequest` DTO in the app: `{ id, title, description, category, urgency, status, authorId, authorName, prayingCount, praying, createdAt, answeredAt, testimony }`. `praying` is derived by intersecting the list with the caller's own `PrayerResponse` rows. Sort: urgent first, then newest.
- Screens: `(tabs)/prayer.tsx` — Active / Answered segments, "New request" button, "My journal" link, cards with title, author, category, urgent badge, "N praying" and an "I'm praying" toggle (optimistic). `app/prayer/new.tsx` modal — title, details, category chips, urgent switch. `app/prayer/[id].tsx` — full request, who is praying (names), "I'm praying" toggle, "Mark as answered" (author/admin) with testimony. `app/journal/index.tsx` — private entries grouped Active / Answered; `app/journal/entry.tsx` modal — create/edit/delete, mark answered.
- New UI primitives: `Chip` (selectable pill), `Segments` (two-way switch), `Badge`.
- Praying is shown as names and a count only — never as likes or a leaderboard.

## Out of scope

Realtime updates (pull-to-refresh + focus refresh instead), editing a request after posting,
archiving, attachments on testimonies, push notifications (Phase "notifications").
