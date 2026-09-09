# Notifications (Design)

Date: 2026-09-09 — Phase 6 of the product plan (section 17, screens 27 and "Notification
indicator" on Home). Builds on the development build introduced for group calls.

## Goal

Members learn about group activity without opening the app: a new prayer request, someone
praying for their request, an answered prayer, a scheduled or started call, a shared song or
scripture, and money recorded for them. Each member controls the non-critical kinds. Every
notification also lands in an in-app inbox, so members on the web preview or without push
permission still see everything.

## Delivery, and what it costs

| Channel | Works today | Needs from the owner |
|---|---|---|
| In-app inbox (`Notification` rows + bell badge on Home) | everywhere, including web | nothing |
| Local call reminders (10 min before a scheduled call) | iOS and Android builds | nothing |
| Push via Expo's push service | Android and iOS builds | a free Expo account (`npx eas init` gives the `projectId` the token API requires); Android delivery needs a free Firebase project's FCM credentials uploaded to Expo; **iOS delivery needs an Apple Developer Program membership (paid)**, which is also required to put the app on members' iPhones at all |

The code is the same for all three. Push registration is skipped silently while the
`projectId` is missing, so nothing breaks before the owner's setup.

## Data

| Class | Fields | Row ACL | CLP |
|---|---|---|---|
| `Notification` | `group`, `recipient` (_User), `actor` (_User, optional), `type`, `title` (≤80), `body` (≤200), `route` (app path such as `/prayer/<id>`), `readAt` Date | read: recipient only | find/get authenticated; create/update/delete master only |
| `PushToken` | `user`, `token` (Expo push token, unique), `platform` (`ios`\|`android`), `deviceName` | none (master only) | everything master only |
| `_User.notificationPrefs` | object `{ prayer, praying, answered, calls, resources, funds }`, all default `true` when absent | existing user ACL | existing |

## Events → recipients

`actor` is the signed-in user who caused the event and never receives their own notification.

| Event (where it fires) | Recipients | Pref | Title / body | Route |
|---|---|---|---|---|
| `prayerRequest` (`createPrayerRequest`) | active members | `prayer` | "New prayer request" / "{actor}: {title}" | `/prayer/{id}` |
| `praying` (`togglePraying` → praying: true) | request author | `praying` | "{actor} is praying for you" / "{title}" | `/prayer/{id}` |
| `answered` (`markAnswered`) | active members | `answered` | "Prayer answered" / "{title}" | `/prayer/{id}` |
| `callScheduled` (`scheduleCall`) | active members | `calls` | "Group call scheduled" / "{title} · {day, time}" | `/calls/{id}` |
| `callStarted` (`joinCall`, first join) | active members | `calls` | "{actor} started the call" / "{title} — join now" | `/calls/{id}` |
| `callCancelled` (`cancelCall`) | active members | `calls` | "Call cancelled" / "{title}" | `/(tabs)/community` |
| `resource` (`createResource`) | active members | `resources` | "New song shared" (or scripture / prayer) / "{title}" | `/resources/{id}` |
| `contribution` (`addContribution`) | the member it is recorded for | `funds` | "Contribution recorded" / "₹{amount} on {date}" | `/(tabs)/funds` |
| `expense` (`addExpense`) | active members | `funds` | "Expense recorded" / "{category}: ₹{amount}" | `/(tabs)/funds` |

Names come from `displayName`, falling back to "A member". Money uses the same Indian
grouping as the app (`₹1,250` for 125000 paise; paise shown only when non-zero).

## Cloud Code

`backend/cloud/notifications.js` exports `createNotifier({ members, users, inbox, tokens, push, now })`
and `createNotificationHandlers({ inbox, tokens, users })`, both pure with injected repos.

Notifier: `notify(event)` — resolves recipients, drops the actor and anyone whose pref for the
event is `false`, writes one `Notification` per recipient, then pushes to every registered
token of those recipients in chunks of 100 through Expo's API
(`https://exp.host/--/api/v2/push/send`, sent with `Parse.Cloud.httpRequest`). Tickets with
`details.error === 'DeviceNotRegistered'` delete that token. `notify` never throws: failures
are logged and the originating action still succeeds. `main.js` calls it after each action above.

Functions (all require an active member):

| Function | Rule |
|---|---|
| `registerPushToken({ token, platform, deviceName })` | `token` must look like `ExponentPushToken[...]`; upsert by token, reassigning it to the caller. |
| `unregisterPushToken({ token })` | deletes the row when it belongs to the caller. |
| `markNotificationsRead({ ids })` | sets `readAt` on the caller's rows only; unknown ids ignored. |
| `markAllNotificationsRead()` | sets `readAt` on every unread row of the caller. |
| `updateNotificationPrefs(prefs)` | accepts only the six keys, booleans only; merges into `notificationPrefs`; returns the full object. |

Messages: `notMember` "You're not a member of this group yet."; `invalidToken` "That push
token isn't valid."; `invalidPrefs` "Choose on or off for each notification type."

## Mobile

- Packages: `expo-notifications`, `expo-device`. `app.json` gains the `expo-notifications`
  plugin (`icon: ./assets/notification-icon.png` 96×96 white mark, `color: #173E32`).
- `src/features/notifications/`: `types.ts`; `service.ts` (`list()` newest first, `unreadCount()`,
  `markRead(ids)`, `markAllRead()`, `getPrefs()`, `updatePrefs(patch)`, `registerToken`,
  `unregisterToken`) with tests; `useNotifications()` and `useUnreadCount()` refreshing on
  focus; `push.native.ts` / `push.web.ts` (`setupPushHandling()`, `registerForPush()` → permission,
  Android channel `default`, Expo token when `projectId` exists, then `registerPushToken`;
  `usePushResponse()` routes a tapped notification with `router.push(route)`); `reminders.native.ts`
  / `reminders.web.ts` (`syncCallReminders(upcoming)` schedules a local notification per
  scheduled call 10 min before start, identifier `call-<id>`, cancels the rest).
- `PushRegistrar` rendered inside the `app` gate: registers after sign-in, unregisters on sign
  out, wires the response listener.
- Screens: `app/notifications/index.tsx` (inbox: unread first, tap opens the route and marks
  read, "Mark all read"; empty state "You're all caught up."); `app/notifications/settings.tsx`
  (six switches with one-line descriptions). Home header: bell with unread count next to the
  avatar; tab headers: bell before the profile icon; Profile: "Notification settings" row.
- Web: inbox and settings work; push and reminders are no-ops.

## Out of scope

Announcements (no announcement feature exists yet), badge counts on the app icon, digest
emails, receipts polling.
