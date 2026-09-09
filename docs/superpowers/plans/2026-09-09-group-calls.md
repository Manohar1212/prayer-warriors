# Group Calls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scheduled group prayer calls over LiveKit with server-issued join tokens, per the spec.

**Spec:** `docs/superpowers/specs/2026-09-09-group-calls-design.md`

## Global Constraints
- Earlier constraints apply. No npm dependencies in Cloud Code: tokens are signed with Node `crypto` (HS256).
- The LiveKit API secret exists only in Parse Config (master key only) and `backend/.env`.
- From this phase the app runs as a development build (`npx expo run:ios`); Expo Go is no longer supported.

### Task 1: Backend — LiveKit token signing + call handlers (TDD), schema, deploy
- [ ] `livekit.js`: `createLiveKitTokens({ apiKey, apiSecret, now })` → `mint({ identity, name, room, ttlSeconds })` → JWT; test decodes and verifies signature/claims.
- [ ] `calls.js`: handlers per spec with injected `memberships`, `calls`, `participants`, `tokens`, `now`; tests for every rule.
- [ ] `main.js` wiring; `setup.mjs` schemas + `ensureLiveKitConfig`; run setup; deploy; live-check schedule → join (token decodes) → leave → end; clean up. Commit.

### Task 2: Mobile — dev build, service, screens
- [ ] Install packages; `app.json` plugins; `npx expo prebuild --platform ios --clean`; `npx expo run:ios` boots the dev build on the simulator.
- [ ] `src/features/calls` service + hook + tests; screens per spec; Community/Home entry points; routes.
- [ ] Typecheck, tests, web export (web stub for the LiveKit room: "Calls are available in the mobile app."). Commit.

### Task 3: Verify
- [ ] Simulator: schedule, see the card, join (token + room connect succeed; media unavailable), participant list shows self, leave, history. Merge.
