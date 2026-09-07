# Prayer Warriors

A private prayer-circle app for a small fellowship, built with Expo (SDK 57) +
TypeScript on the mobile side and Back4App (Parse Server) as the backend. The full
product plan lives in `docs/Prayer_Warriors_Product_Technical_Plan.md`; each phase
has a design spec and implementation plan under `docs/superpowers/`.

## Setup

1. **Backend** — follow `backend/README.md` to create the schema, roles, first group,
   and first admin in the PrayerWarriors Back4App app.
2. **Mobile env** — copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in
   the Application ID and JavaScript key.
3. **Run**

   ```bash
   npm install          # from the repo root
   npm run mobile       # then press i / a / w for iOS / Android / web
   ```

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
  src/features/auth/        AuthService, AuthProvider, route gate
  src/ui/                   Screen, Card, Button, Input, Text primitives
  src/theme/tokens.ts       Colors and fonts (mirrored in tailwind.config.js)
  src/lib/parse.ts          Parse SDK initialisation
backend/
  schema/setup.mjs          Idempotent Back4App schema, roles, first group/admin
  cloud/main.js             Cloud Code
docs/                       Product plan, specs, implementation plans
.github/workflows/ci.yml    Typecheck + tests on push / PR
```
