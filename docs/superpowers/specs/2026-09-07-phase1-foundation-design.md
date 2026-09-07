# Phase 1 — Foundation (Design)

Date: 2026-09-07
Source: `docs/Prayer_Warriors_Product_Technical_Plan.md`, section 29 "Phase 1"
Deliverable: **the app can authenticate and navigate.**

## Decisions that deviate from the product plan

| Plan says | We do | Why |
|---|---|---|
| Supabase | Back4App (Parse Server) | Owner decision, 2026-09-07. |
| Phone/email OTP | Email + password on `_User`, no public signup, password reset by email | Parse ships no OTP. Admin creates members. OTP can be layered on later via Cloud Code + an SMS/email provider. |
| Row Level Security | Parse Roles per group + class-level permissions (CLPs) + ACLs | Parse-native equivalent. Enforced server-side, not by hiding buttons. |
| Dedicated backend project | Dedicated Back4App app **PrayerWarriors** | `_User`, `_Role`, `_Session` are shared inside a Back4App app; the prototype's use of PastorDairy is not acceptable for auth or finance data. |

## Repository layout

```
prayer-warriors/
├── apps/mobile/          Expo SDK 57 + TypeScript + Expo Router + NativeWind
├── backend/
│   ├── schema/           Idempotent schema + CLP setup script (master key)
│   └── cloud/            Cloud Code (empty in Phase 1; placeholder main.js)
├── docs/
├── .github/workflows/    ci.yml: typecheck + tests on push/PR
└── package.json          npm workspaces root
```

`apps/admin` and `packages/*` are created when first needed (Phase 8 / when code is shared).

## Mobile app

### Routing (Expo Router)

```
app/
├── _layout.tsx           Root: fonts, Parse init, AuthProvider, redirect logic
├── (auth)/
│   ├── _layout.tsx       Stack
│   ├── welcome.tsx
│   ├── login.tsx
│   ├── forgot-password.tsx
│   └── account-setup.tsx   First login: display name (+ optional avatar later)
└── (tabs)/
    ├── _layout.tsx       Tabs: Home | Prayer | Community | Resources | Funds
    ├── index.tsx         Home (placeholder summary)
    ├── prayer.tsx
    ├── community.tsx
    ├── resources.tsx
    ├── funds.tsx
    └── profile.tsx       Reached from top-right avatar; shows user + Sign out
```

Redirect rule in the root layout: unauthenticated → `(auth)/welcome`; authenticated
without `displayName` → `(auth)/account-setup`; otherwise `(tabs)`.

### Design system (NativeWind v4)

Tokens from plan section 26 as Tailwind theme colors:
`primary #173E32`, `primaryDark #0E2A22`, `gold #B98224`, `goldLight #E7C46A`,
`cream #FAF7F0`, `surface #FFFFFF`, `rose #D99A9A`, `ink #202521`, `muted #70756F`,
`border #E6E0D5`. Fonts: Playfair Display (display) + Inter (UI) via `expo-font`
/ `@expo-google-fonts`.

Primitives in `src/ui/`: `Screen`, `Card`, `Button` (primary / secondary / ghost),
`Input`, `Text` (`display`, `title`, `body`, `muted`). Large touch targets, rounded
cards, generous whitespace. No engagement metrics anywhere.

### Auth layer

- `src/lib/parse.ts` — initialises `parse/react-native` with AsyncStorage, app id +
  JS key from `EXPO_PUBLIC_*` env vars.
- `src/features/auth/` — `AuthProvider` (current user, loading, signIn, signOut,
  requestPasswordReset, updateProfile) and `useAuth()`. Wraps Parse calls behind a
  small typed interface so screens never import Parse directly.
- Errors surface as friendly messages (wrong password, no network, unverified).

### Testing

Jest (jest-expo). Unit tests for the auth service (Parse mocked) and the redirect
decision function. UI primitives get a smoke render test.

## Backend (Back4App app "PrayerWarriors")

### Classes

| Class | Fields | CLP |
|---|---|---|
| `_User` | + `displayName` String, `phone` String, `avatar` File | find/get: authenticated; create: master only (no public signup); update: own row (ACL) |
| `Group` | `name`, `description`, `createdBy` Pointer<_User> | read: role `group:<id>:member`; write: role `group:<id>:admin` |
| `GroupMember` | `group` Pointer<Group>, `user` Pointer<_User>, `role` "admin"\|"member", `status` "active"\|"inactive", `joinedAt` Date | read: group members; write: group admins |

Roles: `_Role` rows `group:<groupId>:admin` and `group:<groupId>:member`
(admin role is a child of member role). Created by the schema script for the first
group. Everything else stays master-key-only until its phase.

### Schema script

`backend/schema/setup.mjs` — idempotent (POST then PUT on 400), takes
`PARSE_APP_ID` + `PARSE_MASTER_KEY`, creates classes, CLPs, the first Group, its two
roles, and (optionally, via env) the first admin user.

## Out of scope for Phase 1

Prayer requests, journal, resources, calls, funds, notifications, admin web app,
OTP, avatars upload, invite links. The Back4App prototype `PrayerRequest` class in
PastorDairy is deleted as part of this phase.
