# Prayer Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prayer requests, "I'm praying", answered prayers, and a private journal, per the spec.

**Architecture:** Three pure Cloud Code handlers with injected repositories (tested with fakes) do all writes; the app reads with the Parse SDK behind small services and hooks; three new screens plus two journal screens in the existing design language.

**Spec:** `docs/superpowers/specs/2026-09-08-prayer-module-design.md`

## Global Constraints

- All earlier Global Constraints apply. Messages are exactly the spec's strings.
- Every write to `PrayerRequest`/`PrayerResponse` goes through Cloud Code; the app never saves those classes directly. Journal entries are saved by the app but `beforeSave` pins the owner.

---

### Task 1: Backend — schema, prayer handlers (TDD), wiring, deploy

**Files:** `backend/schema/setup.mjs` (+3 schemas), `backend/cloud/prayer.js`, `backend/cloud/prayer.test.js`, `backend/cloud/main.js`.

**Interfaces:**
```js
const CATEGORIES = ['family','personal','work','spiritual','relationships','other'];
createPrayerHandlers({
  memberships: { findGroupId(userId) → id|null, findAdminGroupId(userId) → id|null },
  requests:    { create(fields) → dto, get(id) → dto|null, update(id, patch) → dto, incrementPraying(id, delta) → number },
  responses:   { find(requestId, userId) → { id }|null, create(requestId, userId, groupId), remove(id) },
  now: () → Date,
})
  .createPrayerRequest(params, { callerId }) → dto
  .togglePraying({ requestId }, { callerId }) → { praying, prayingCount }
  .markAnswered({ requestId, testimony }, { callerId }) → dto
// dto: { id, groupId, authorId, title, description, category, urgency, status, prayingCount, createdAt, answeredAt, testimony }
```

- [ ] Write `prayer.test.js` covering: create happy path (trimmed title, defaults, group from membership, ACL passed as `groupId`); non-member → notMember; each validation message; toggle on (create + increment → `{praying:true, prayingCount:n}`), toggle off (remove + decrement), toggle on non-active → notActive, toggle on a request from another group → notFound; markAnswered by author, by admin, by other member → notAllowed, on answered → notActive, testimony too long.
- [ ] Implement `prayer.js`; run to pass.
- [ ] `main.js`: repositories with the master key (`requests.create` sets ACL read for the group's roles; `incrementPraying` uses `increment('prayingCount', delta)` and returns the new value; `responses.create` sets the same read ACL), define the three functions with `callerId = request.user?.id`, and `beforeSave('PrayerJournalEntry')` forcing `user` = `request.user` and owner-only ACL (throw if no user).
- [ ] `setup.mjs`: add the three schemas from the spec table; run it against PrayerWarriors; deploy `main.js`, `members.js`, `prayer.js`; live-check with Shiny's session: create → toggle → toggle → markAnswered; clean up the test request/responses.
- [ ] Commit.

### Task 2: Mobile — prayer service, hook, primitives, screens

**Files:** `src/features/prayer/{types,service,service.test,usePrayerRequests,index}.ts`, `src/ui/{Chip,Segments,Badge}.tsx`, `app/(tabs)/prayer.tsx`, `app/prayer/new.tsx`, `app/prayer/[id].tsx`, `app/_layout.tsx`, `src/lib/parse.ts`.

- [ ] `service.test.ts`: list merges `praying` from own response ids and sorts urgent-first/newest; `create` calls `createPrayerRequest`; `togglePraying` returns the cloud result; `markAnswered`; `prayingMembers` maps names.
- [ ] Implement service + `usePrayerRequests(status)` (load, refresh, `create`, `togglePraying` optimistic with rollback, `markAnswered`) and Parse-backed fetchers in `parse.ts`.
- [ ] Primitives: `Chip({ label, selected, onPress })`, `Segments({ options, value, onChange })`, `Badge({ label, tone })`.
- [ ] Screens per spec; register `prayer/new` (modal) and `prayer/[id]` (card) in the root layout's app group.
- [ ] Typecheck, tests, web export; commit.

### Task 3: Journal

**Files:** `src/features/prayer/{journal,journal.test,useJournal}.ts`, `app/journal/index.tsx`, `app/journal/entry.tsx`, `app/_layout.tsx`, `src/lib/parse.ts`.

- [ ] `journal.test.ts`: mapping + grouping active/answered; save/delete pass-through.
- [ ] Implement service (Parse objects with owner ACL), hook, screens; register routes (`journal/index` card, `journal/entry` modal with optional `id`).
- [ ] Typecheck, tests; commit.

### Task 4: Verify and finish

- [ ] Web as Shiny: post a request, toggle praying, open detail, mark answered with testimony, Answered segment shows it; journal create/edit/delete; a second throwaway member sees the request and can pray but cannot mark it answered; cleanup; merge per finishing-a-development-branch.
