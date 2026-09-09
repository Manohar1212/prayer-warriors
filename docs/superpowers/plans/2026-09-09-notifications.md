# Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In-app inbox, member preferences, Expo push fan-out from Cloud Code, and local call reminders, per the spec.

**Architecture:** A pure `createNotifier` in Cloud Code turns domain events into `Notification` rows plus Expo push messages; `main.js` calls it after each write handler. The app reads the inbox with the Parse SDK behind `notificationsService`, registers its Expo push token through a cloud function, and schedules local reminders for upcoming calls.

**Tech Stack:** Parse Cloud Code (Node, `Parse.Cloud.httpRequest`), Expo SDK 57 `expo-notifications` + `expo-device`, Expo Router, Jest.

**Spec:** `docs/superpowers/specs/2026-09-09-notifications-design.md`

## Global Constraints

- Everything free: Expo push service, no paid vendors. Push registration must no-op without an EAS `projectId`.
- All writes through Cloud Code; reads through the Parse SDK behind `src/features/*/service.ts`.
- Notifier failures never fail the originating action.
- Copy exactly as in the spec's event table and MESSAGES.

---

### Task 1: Notifier and handlers (backend, TDD)

**Files:** Create `backend/cloud/notifications.js`, `backend/cloud/notifications.test.js`.

**Interfaces:**
- `createNotifier({ members, users, inbox, tokens, push, now })` → `{ notify(event) }` where `event = { type, groupId, actorId, ...payload }` per spec table. `members.listActiveUserIds(groupId)`, `users.findMany(ids)` → `[{ id, displayName, notificationPrefs }]`, `inbox.createMany(rows)`, `tokens.forUsers(ids)` → `[{ userId, token }]`, `tokens.remove(token)`, `push.send(messages)` → tickets array.
- `createNotificationHandlers({ memberships, inbox, tokens, users })` → `registerPushToken`, `unregisterPushToken`, `markNotificationsRead`, `markAllNotificationsRead`, `updateNotificationPrefs`.
- `buildMessage(event, actorName)` → `{ title, body, route, pref }` (exported for tests).

- [ ] Write failing tests: recipients exclude actor; pref `false` drops a recipient; `praying` targets the author only; `contribution` targets the member only; push chunked at 100; `DeviceNotRegistered` removes the token; push failure does not throw; each message copy; handler validation messages.
- [ ] Implement; `npm test -w backend` green; commit `feat(backend): notifications notifier and handlers`.

### Task 2: Wiring, schema, deploy

**Files:** Modify `backend/cloud/main.js`, `backend/schema/setup.mjs`, `backend/README.md`.

- [ ] Repos in `main.js`: `members.listActiveUserIds`, `users.findMany`, `inbox` (create rows with recipient-only ACL, mark read), `tokens` (upsert/remove/forUsers), `push` via `Parse.Cloud.httpRequest`.
- [ ] Call `notifier.notify` after `createPrayerRequest`, `togglePraying` (praying true), `markAnswered`, `createResource`, `addContribution`, `addExpense`, `scheduleCall`, `cancelCall`, `joinCall` (status was `scheduled`).
- [ ] Schemas `Notification`, `PushToken`, `_User.notificationPrefs`; run `node backend/schema/setup.mjs`.
- [ ] Deploy Cloud Code (v11); smoke test with a throwaway member via REST: create a request as one member, read the other member's `Notification` rows, mark read, update prefs; clean up.
- [ ] Commit `feat(backend): notification fan-out, schema, cloud functions`.

### Task 3: Mobile service and hooks (TDD)

**Files:** Create `apps/mobile/src/features/notifications/{types,service,service.test,useNotifications,useUnreadCount,index}.ts`; modify `apps/mobile/src/lib/parse.ts`.

- [ ] Tests: `list()` maps rows and sorts unread first then newest; `unreadCount()`; `markRead` calls cloud; `updatePrefs` merges defaults; `registerToken` passes platform.
- [ ] Implement; `npm test -w apps/mobile` green; commit.

### Task 4: Push and reminders (native/web split)

**Files:** Create `push.native.ts`, `push.web.ts`, `push.d.ts`, `reminders.native.ts`, `reminders.web.ts`, `reminders.d.ts`, `PushRegistrar.tsx`; modify `app/_layout.tsx`, `app.json`, `useCalls.ts`; add `assets/notification-icon.png`.

- [ ] `npx expo install expo-notifications expo-device`; plugin config.
- [ ] `setupPushHandling()` (handler shows banner/list), `registerForPush()` (permission, Android channel, token when `projectId` exists), `usePushResponse()` (router.push(route)).
- [ ] `syncCallReminders(upcoming)`; call from `useCalls` after load.
- [ ] `PushRegistrar` under the `app` gate; unregister on sign out.
- [ ] Typecheck; commit.

### Task 5: Screens and entry points

**Files:** Create `app/notifications/index.tsx`, `app/notifications/settings.tsx`; modify `app/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/_layout.tsx`, `app/profile.tsx`.

- [ ] Inbox and settings screens per spec; bell with unread count on Home and tab headers; Profile link.
- [ ] Playwright check at 390px as a member: inbox lists a seeded notification, tap opens the route, settings toggle persists.
- [ ] Commit `feat(mobile): notifications inbox, settings, push registration, call reminders`.

### Task 6: Dev build, docs, merge

- [ ] `npx expo prebuild --platform ios` then `npx expo run:ios --no-bundler --device <UDID>`; app boots on the simulator.
- [ ] README: Expo account / `eas init`, FCM credentials, Apple Developer note.
- [ ] Full test suites and typecheck green; merge to `main`.
