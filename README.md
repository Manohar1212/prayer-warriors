# Prayer Warriors

A small Expo (SDK 57) + TypeScript app where a community shares prayer requests
and taps 🙏 to say "I prayed". Data lives in a single `PrayerRequest` class on
[Back4App](https://www.back4app.com/) (Parse Server), accessed through the REST
API with plain `fetch`.

## Setup

1. Create a Back4App app (or pick an existing one) and grab **Application ID**,
   **JavaScript key**, and **Master key** from *App Settings → Security & Keys*.
2. Create the database class and permissions:

   ```bash
   PARSE_APP_ID=... PARSE_MASTER_KEY=... node scripts/setup-schema.mjs
   ```

3. Configure the client:

   ```bash
   cp .env.example .env   # then fill in EXPO_PUBLIC_PARSE_APP_ID and EXPO_PUBLIC_PARSE_JS_KEY
   ```

4. Run it:

   ```bash
   npm install
   npm start        # then press i / a / w for iOS / Android / web
   ```

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm start`         | Start the Expo dev server       |
| `npm test`          | Run the Jest test suite         |
| `npm run typecheck` | `tsc --noEmit`                  |

## Project layout

```
App.tsx                         Root screen: header, new-request form, list
src/api/prayerRequests.ts       Typed Parse REST client (list / create / pray)
src/hooks/usePrayerRequests.ts  Loading, refresh, optimistic "pray" updates
src/components/                 NewRequestForm, PrayerRequestCard
src/config.ts                   Reads EXPO_PUBLIC_* env vars
src/theme.ts                    Colors and spacing
scripts/setup-schema.mjs        One-time Back4App schema + CLP setup
```

## Data model

`PrayerRequest`

| Field         | Type   | Notes                        |
| ------------- | ------ | ---------------------------- |
| `title`       | String | required                     |
| `details`     | String | optional                     |
| `author`      | String | defaults to "Anonymous"      |
| `prayerCount` | Number | incremented atomically       |

v1 has no accounts: anyone with the app can read, post, and pray. Deleting is
master-key only.
