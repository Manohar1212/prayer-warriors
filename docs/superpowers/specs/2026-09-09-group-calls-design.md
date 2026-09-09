# Group Calls (Design)

Date: 2026-09-09 — Phase 5 of the product plan (sections 10, 22). First phase that requires a
development build (LiveKit's native WebRTC module cannot run in Expo Go).

## Goal

The admin schedules a group prayer call; members join from the app with audio (and optional
video); everyone sees who is on the call; calls are kept in a history. LiveKit Cloud (free plan)
carries the media. Parse remains the source of truth for who may join.

## Data

| Class | Fields | Row ACL | CLP |
|---|---|---|---|
| `Call` | `group`, `title` (≤80), `scheduledAt` Date, `roomName` (`pw-<groupId>-<callId>`), `status` (`scheduled`\|`live`\|`ended`\|`cancelled`), `startedAt`, `endedAt`, `createdBy` | read: group roles | reads authenticated; writes master only |
| `CallParticipant` | `call`, `user`, `joinedAt`, `leftAt` | read: group roles | same |

Config (master-key-only): `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

## Cloud Code (`calls.js` pure handlers, `livekit.js` token signing, wired in `main.js`)

| Function | Rule |
|---|---|
| `scheduleCall({ title, scheduledAt })` | admin only; `scheduledAt` valid, not more than 1 h in the past; creates `Call` with `roomName`. |
| `cancelCall({ callId })` | admin only; `scheduled` → `cancelled`. |
| `joinCall({ callId })` | active member of the call's group; call `scheduled` or `live` and within the join window (15 min before `scheduledAt` until ended); marks `live` + `startedAt` on first join; upserts a `CallParticipant` (`joinedAt` now, `leftAt` cleared); returns `{ url, token, roomName }`. Token: HS256 JWT signed with the API secret, `sub` = user id, `name` = display name, `video: { roomJoin, room, canPublish, canSubscribe }`, 2 h expiry. |
| `leaveCall({ callId })` | sets `leftAt` on the caller's participant row. |
| `endCall({ callId })` | admin only; `live`/`scheduled` → `ended`, `endedAt` now. |

Messages: `adminOnly` "Only admins can manage calls."; `notMember` "You're not a member of this
group yet."; `titleRequired` "Give the call a title."; `titleTooLong` "Keep the title under 80
characters."; `invalidTime` "Enter a valid date and time."; `pastTime` "That time has already
passed."; `notFound` "That call isn't available."; `notJoinable` "This call isn't open right now.";
`notConfigured` "Calls are not set up yet. Ask your admin."

## Mobile

- Packages: `@livekit/react-native`, `@livekit/react-native-webrtc`, `livekit-client`,
  `@livekit/react-native-expo-plugin`, `expo-dev-client`. `app.json` gains the LiveKit plugin
  (camera/microphone permission strings) and `expo-dev-client`.
- `src/features/calls/` — `types.ts`, `service.ts` (`list()` upcoming + past, `schedule`,
  `cancel`, `join` → credentials, `leave`, `end`), `useCalls()`, tests.
- Screens: `(tabs)/community.tsx` gains a "Group calls" section (next call card with Join,
  admin "Schedule a call"); `app/calls/schedule.tsx` (title, date, time); `app/calls/[id].tsx`
  lobby (participants so far, mic/camera toggles, Join) → in-call view (grid of participants
  with speaking indicator, mute, camera, speaker, leave; admin End call); `app/calls/history.tsx`.
- Home "Call" quick action and the Group prayer card show the next call and Join.
- Simulator: no mic/camera; the flow is verified up to token issuance and room connection;
  media is tested on a physical device build.

## Out of scope

Recordings, screen share, chat during calls, push reminders (next phase), calendar export.
