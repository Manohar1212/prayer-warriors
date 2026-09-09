# Prayer Warriors

A private prayer-circle app for a small fellowship, built with Expo (SDK 57) +
TypeScript on the mobile side and Back4App (Parse Server) as the backend. The full
product plan lives in `docs/Prayer_Warriors_Product_Technical_Plan.md`; each phase
has a design spec and implementation plan under `docs/superpowers/`.

## What's built

| Area | Status |
| --- | --- |
| Sign-in (email + password, session restore) | Done |
| Members: list, admin adds members with a one-time starting password | Done |
| Prayer: requests, "I'm praying", answered with testimony, private journal | Done |
| Resources: songs, scripture, prayers with links and search | Done |
| Funds: contributions, expenses, balance, monthly report, CSV export, change history | Done |
| Bible: offline Telugu Old Version + Berean Standard Bible, reader, search, post a verse to the group | Done |
| Home: verse of the day, latest requests, recently shared, next call | Done |
| Group calls: schedule, join over LiveKit, participants, history | Done (development build) |
| Notifications: in-app inbox, per-member preferences, Expo push fan-out, local call reminders | Done (push delivery needs the setup below) |
| Admin web dashboard | Not started |

All writes go through Cloud Code in `backend/cloud/`; the app reads with the Parse SDK behind
small services in `apps/mobile/src/features/*`. Specs and plans for each feature are in
`docs/superpowers/`.

## Setup

1. **Backend** — follow `backend/README.md` to create the schema, roles, first group,
   and first admin in the PrayerWarriors Back4App app.
2. **Mobile env** — copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in
   the Application ID and JavaScript key.
3. **LiveKit (group calls)** — create a free project at cloud.livekit.io and put its URL, API
   key, and API secret in `backend/.env` as `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
   `LIVEKIT_API_SECRET`, then re-run `node backend/schema/setup.mjs`.
4. **Push notifications (optional, free)** — the in-app inbox and call reminders work without any
   setup. To deliver pushes when the app is closed: sign in to a free Expo account and run
   `npx eas init` in `apps/mobile` (this adds the `extra.eas.projectId` the token API needs);
   for Android, create a free Firebase project and upload its FCM V1 service-account key with
   `npx eas credentials`; iOS delivery additionally requires an Apple Developer Program
   membership (paid), which is also what putting the app on members' iPhones requires.
   Without a `projectId` the app simply skips push registration.
5. **Run** — the app is a development build (LiveKit's native module cannot run in Expo Go):

   ```bash
   npm install                                  # from the repo root
   cd apps/mobile
   npx expo prebuild --platform ios             # generates ios/ (git-ignored); re-run after native config changes
   npx expo run:ios                             # builds, installs on the simulator, starts Metro
   ```

   Afterwards `npm run mobile` from the root starts Metro and the installed build reconnects.
   `w` opens the web preview, where calls are unavailable by design.

   Notes for the iOS build:
   - Xcode 26.3 (Swift 6.2.4) needs the `patches/expo-modules-jsi+57.1.0.patch` that
     `npm install` applies automatically via `patch-package`; it fixes three Swift 6 strict-
     concurrency errors in the `ExpoModulesJSI` xcframework phase. Remove it once Expo ships a fix.
   - To open the installed build straight into Metro without the iOS "Open in Prayer Warriors?"
     prompt: `xcrun simctl launch booted com.prayerwarriors.app --initialUrl http://127.0.0.1:8081`.

## Scripts (repo root)

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run mobile`    | Start the Expo dev server          |
| `npm test`          | Jest suites in every workspace     |
| `npm run typecheck` | `tsc --noEmit` in every workspace  |

## Project layout

```
apps/mobile/                Expo app (Expo Router, NativeWind, Parse JS SDK)
  app/                      Routes: (auth) stack, (tabs), account-setup, profile
  src/features/              auth, members, prayer, resources, funds (services, hooks, tests)
  src/ui/                   Screen, Card, Button, Input, Text primitives
  src/theme/tokens.ts       Colors and fonts (mirrored in tailwind.config.js)
  src/lib/parse.ts          Parse SDK initialisation
backend/
  schema/setup.mjs          Idempotent Back4App schema, roles, first group/admin
  cloud/main.js             Cloud Code
scripts/bible/              Builds the bundled Bible database (node scripts/bible/build.mjs)
docs/                       Product plan, specs, implementation plans
.github/workflows/ci.yml    Typecheck + tests on push / PR
```
