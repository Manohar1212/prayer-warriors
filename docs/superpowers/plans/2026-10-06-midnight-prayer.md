# Midnight Prayer Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each night at 12:00 AM one member of an admin-managed rotation prays for the group. Each month is shuffled fairly, reminders and "I prayed" confirmation are built in, and the night shows on Home and on a monthly calendar.

**Architecture:** A pure Cloud Code module `backend/cloud/midnightPrayer.js` holds the shuffle and the handlers, and gets its Parse repositories injected from `main.js`, the same pattern as `prayerNight.js`. A month is created the first time anyone asks for it. An hourly job sends the 9 PM reminder and the next-day nudge through the existing notifier. The app adds a service and hooks in `src/features/prayer/midnight.ts`, a Home card, a calendar screen and two admin modals.

**Tech Stack:** Parse Cloud Code on Back4App (Node, Jest), Expo SDK 57 / React Native 0.86 with expo-router, NativeWind, Jest.

**Spec:** `docs/superpowers/specs/2026-10-06-midnight-prayer-design.md`

## Global Constraints

- All days are Indian calendar days (`Asia/Kolkata`). The **night of D** is the 12:00 AM at the end of day D.
- Initial rotation: Shiny `Jt6qzCzbVe`, Alekhya `IrdFyiDap8`, Ratna Kumari `BcSgcEa8zl`, Daya Ratnam `MWww7ztrlD`, Divya Jyothsna `COjhGkY8RX`.
- The rotation holds 0–20 active members with no duplicates. Admin only.
- Months that can be created: the current month, and the next month from the 20th onward.
- "I prayed" is allowed only for the night's person, from 11:00 PM on day D until 11:59 PM on D+1.
- Reminder from 9:00 PM on D. Nudge from 12:00 PM on D+1 if not prayed. Each is sent once, only to that person, gated by notification preference key `midnight` (default on).
- Only tonight or later nights can be reassigned. Reassigning clears `prayedAt`, `remindedAt` and `nudgedAt`.
- Every user-facing string exists in `en.ts` and `te.ts`.
- Error messages are plain sentences in a `MESSAGES` object, as in the other cloud modules.
- Production steps (schema, Cloud Code deploy, seeding the rotation, scheduling the job) change the live app. Ask the user before each.

## Review Focus

1. **The 1st of a month:** yesterday's night is in the previous month. "I prayed" for it and the Home card must still work. Pinned in Task 2.
2. **Admin reassigns tonight after the 9 PM reminder:** the new person must still get a reminder. Pinned in Task 2 (clears `remindedAt`) and Task 3.
3. **A rotation of one or two people:** the shuffle must finish and fill every night. One person means back-to-back nights, which is allowed. Pinned in Task 1.
4. **Two members open a new month at the same moment:** at most one row per night survives. Pinned in Task 2.
5. **Just after midnight (12:30 AM on D+1):** the card must show the next person for tonight and still let the person who just prayed confirm. Pinned in Task 5.

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/cloud/midnightPrayer.js` (new) | day helpers, seeded random, `planMonth`, handlers, reminder job |
| `backend/cloud/midnightPrayer.test.js` (new) | unit tests with in-memory repos |
| `backend/cloud/notifications.js` | `midnight` pref key, two message types, single-person targets |
| `backend/cloud/notifications.test.js` | tests for the above |
| `backend/cloud/main.js` | Parse repos `midnightNights`, `midnightRotations`; define functions and job |
| `backend/schema/setup.mjs` | `MidnightNight` class, `Group.midnightRotation` field |
| `apps/mobile/src/features/prayer/midnight.ts` (new) | types, service, hooks, `midnightCard` state, `dayLabel` |
| `apps/mobile/src/features/prayer/midnight.test.ts` (new) | service + card-state tests |
| `apps/mobile/src/features/prayer/MidnightPrayerCard.tsx` (new) | Home card |
| `apps/mobile/src/features/prayer/index.ts` | exports |
| `apps/mobile/src/lib/parse.ts` | `midnightService` |
| `apps/mobile/src/features/notifications/types.ts` | `midnight` pref |
| `apps/mobile/app/(tabs)/index.tsx` | place the card |
| `apps/mobile/app/prayer/midnight.tsx` (new) | monthly calendar |
| `apps/mobile/app/prayer/midnight-assign.tsx` (new) | admin: pick a person for a night |
| `apps/mobile/app/prayer/midnight-rotation.tsx` (new) | admin: choose rotation members |
| `apps/mobile/app/_layout.tsx` | register the three routes |
| `apps/mobile/src/i18n/en.ts`, `te.ts` | strings |

---

### Task 1: The fair monthly shuffle

**Files:**
- Create: `backend/cloud/midnightPrayer.js`
- Test: `backend/cloud/midnightPrayer.test.js`

**Interfaces:**
- Produces: `istNow(date) → { day: 'YYYY-MM-DD', hour: 0–23 }`, `addDays(day, n) → day`, `daysOfMonth('YYYY-MM') → day[]`, `nextMonth('YYYY-MM') → 'YYYY-MM'`, `seededRandom(seed: string) → () => number in [0,1)`, `planMonth({ month, rotation: string[], lastPersonBefore: string|null, random }) → [{ day, userId }]`.

- [ ] **Step 1: Write the failing tests**

```js
// backend/cloud/midnightPrayer.test.js
const { istNow, addDays, daysOfMonth, nextMonth, seededRandom, planMonth } = require('./midnightPrayer');

const FIVE = ['a', 'b', 'c', 'd', 'e'];

function counts(plan) {
  const out = {};
  plan.forEach((p) => (out[p.userId] = (out[p.userId] || 0) + 1));
  return out;
}

describe('day helpers', () => {
  it('reads the Indian day and hour', () => {
    expect(istNow(new Date('2026-10-06T18:29:00.000Z'))).toEqual({ day: '2026-10-06', hour: 23 });
    expect(istNow(new Date('2026-10-06T18:30:00.000Z'))).toEqual({ day: '2026-10-07', hour: 0 });
  });
  it('moves across month and year ends', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(nextMonth('2026-12')).toBe('2027-01');
  });
  it('lists every day of a month', () => {
    expect(daysOfMonth('2026-02')).toHaveLength(28);
    expect(daysOfMonth('2026-10')[30]).toBe('2026-10-31');
  });
  it('gives the same sequence for the same seed', () => {
    const a = seededRandom('g1:2026-10');
    const b = seededRandom('g1:2026-10');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    xs.forEach((x) => expect(x >= 0 && x < 1).toBe(true));
  });
});

describe('planMonth', () => {
  it('fills every night, fairly, with no back-to-back nights', () => {
    for (let s = 0; s < 50; s += 1) {
      const plan = planMonth({ month: '2026-10', rotation: FIVE, lastPersonBefore: 'e', random: seededRandom(`seed${s}`) });
      expect(plan.map((p) => p.day)).toEqual(daysOfMonth('2026-10'));
      const c = Object.values(counts(plan));
      expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1);
      expect(plan[0].userId).not.toBe('e');
      plan.slice(1).forEach((p, i) => expect(p.userId).not.toBe(plan[i].userId));
    }
  });
  it('handles a rotation of two and of one', () => {
    const two = planMonth({ month: '2026-10', rotation: ['a', 'b'], lastPersonBefore: null, random: seededRandom('x') });
    expect(two).toHaveLength(31);
    two.slice(1).forEach((p, i) => expect(p.userId).not.toBe(two[i].userId));
    const one = planMonth({ month: '2026-10', rotation: ['a'], lastPersonBefore: 'a', random: seededRandom('x') });
    expect(one.every((p) => p.userId === 'a')).toBe(true);
    expect(one).toHaveLength(31);
  });
  it('plans nothing for an empty rotation', () => {
    expect(planMonth({ month: '2026-10', rotation: [], lastPersonBefore: null, random: seededRandom('x') })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd backend && npx jest cloud/midnightPrayer.test.js`
Expected: FAIL with "Cannot find module './midnightPrayer'".

- [ ] **Step 3: Implement**

```js
// backend/cloud/midnightPrayer.js
'use strict';

/**
 * The midnight prayer: each night at 12:00 AM one member of the rotation prays for the group.
 * "The night of D" is the midnight at the end of Indian calendar day D. Each month is shuffled
 * in rounds, so everyone gets a night every few days and nobody prays two nights running.
 */

const TIME_ZONE = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's Indian calendar day and hour for an instant. */
function istNow(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

function daysOfMonth(month) {
  const out = [];
  for (let day = `${month}-01`; day.startsWith(month); day = addDays(day, 1)) out.push(day);
  return out;
}

function nextMonth(month) {
  return addDays(`${month}-28`, 7).slice(0, 7);
}

/** A small deterministic generator (FNV-1a hash into mulberry32), so a month's plan is repeatable. */
function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Every night of the month, filled round by round with a fresh order of the whole rotation. */
function planMonth({ month, rotation, lastPersonBefore = null, random }) {
  const days = daysOfMonth(month);
  if (!rotation.length) return [];
  const out = [];
  let previous = lastPersonBefore;
  while (out.length < days.length) {
    const round = shuffle(rotation, random);
    if (round.length > 1 && round[0] === previous) {
      const j = 1 + Math.floor(random() * (round.length - 1));
      [round[0], round[j]] = [round[j], round[0]];
    }
    for (const userId of round) {
      if (out.length === days.length) break;
      out.push({ day: days[out.length], userId });
      previous = userId;
    }
  }
  return out;
}

module.exports = { istNow, addDays, daysOfMonth, nextMonth, seededRandom, planMonth };
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd backend && npx jest cloud/midnightPrayer.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/cloud/midnightPrayer.js backend/cloud/midnightPrayer.test.js
git commit -m "midnight prayer: fair monthly shuffle"
```

---

### Task 2: Cloud handlers

**Files:**
- Modify: `backend/cloud/midnightPrayer.js`
- Test: `backend/cloud/midnightPrayer.test.js`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: `createMidnightPrayerHandlers({ memberships, rotations, nights, users, notify, now })` returning `getMidnightMonth`, `getMidnightTonight`, `markMidnightPrayed`, `reassignMidnightNight`, `setMidnightRotation` (each `(params, { callerId })`), `sendMidnightReminders()` (Task 3), and `MESSAGES`.
- Repository contracts (implemented with Parse in Task 4):
  - `memberships.findGroupId(userId)`, `findAdminGroupId(userId)`, `isActiveMember(userId, groupId) → bool`.
  - `rotations.get(groupId) → string[]`, `rotations.set(groupId, string[])`.
  - `users.findMany(ids) → [{ id, displayName }]`.
  - `nights.listMonth(groupId, month)`, `nights.listFrom(groupId, day)` (rows on or after `day`), `nights.findDay(groupId, day)` (oldest row, or null), `nights.findLastBefore(groupId, day)`, `nights.listDay(day)` (all groups), `nights.createMany([{ groupId, month, day, userId }])`, `nights.update(id, patch)`, `nights.remove(ids)`.
  - Every list is sorted by `day`, then `createdAt`.
  - A night row is `{ id, groupId, month, day, userId, prayedAt, remindedAt, nudgedAt, createdAt }`.
- Response shapes:
  - Night view: `{ day, userId, name, prayed }`.
  - `getMidnightMonth({ month })` → `{ month, nights: NightView[], rotation: [{ userId, name }], nextMonth: string|null }`.
  - `getMidnightTonight()` → `{ today, hour, tonight: NightView|null, yesterday: NightView|null, myNext: day|null, inRotation: bool }`.
  - `markMidnightPrayed({ day })` → `{ day, prayed: true }`.
  - `reassignMidnightNight({ day, userId })` → NightView.
  - `setMidnightRotation({ userIds })` → `{ rotation: [{ userId, name }] }`.

- [ ] **Step 1: Write the failing tests** (append to `midnightPrayer.test.js`)

```js
const { createMidnightPrayerHandlers, MESSAGES } = require('./midnightPrayer');

const NAMES = { a: 'Shiny', b: 'Alekhya', c: 'Ratna Kumari', d: 'Daya Ratnam', e: 'Divya Jyothsna', x: 'Devaki', admin: 'Shiny' };

/** In-memory repos; `clock.at` is the current instant. */
function world({ rotation = FIVE, at = '2026-10-06T10:00:00.000Z', admin = 'a', members = [...FIVE, 'x'] } = {}) {
  const clock = { at: new Date(at) };
  let seq = 0;
  const rows = [];
  const state = { rotation: [...rotation] };
  const sorted = (list) => [...list].sort((p, q) => p.day.localeCompare(q.day) || p.createdAt.localeCompare(q.createdAt));
  const notify = jest.fn(async () => undefined);
  const deps = {
    memberships: {
      findGroupId: async (u) => (members.includes(u) ? 'g1' : null),
      findAdminGroupId: async (u) => (u === admin ? 'g1' : null),
      isActiveMember: async (u, g) => g === 'g1' && members.includes(u),
    },
    rotations: { get: async () => [...state.rotation], set: async (_g, ids) => (state.rotation = [...ids]) },
    users: { findMany: async (ids) => ids.map((id) => ({ id, displayName: NAMES[id] || null })) },
    nights: {
      listMonth: async (g, m) => sorted(rows.filter((r) => r.groupId === g && r.month === m)),
      listFrom: async (g, d) => sorted(rows.filter((r) => r.groupId === g && r.day >= d)),
      findDay: async (g, d) => sorted(rows.filter((r) => r.groupId === g && r.day === d))[0] || null,
      findLastBefore: async (g, d) => sorted(rows.filter((r) => r.groupId === g && r.day < d)).pop() || null,
      listDay: async (d) => sorted(rows.filter((r) => r.day === d)),
      createMany: async (list) => list.forEach((r) => rows.push({ id: `n${(seq += 1)}`, prayedAt: null, remindedAt: null, nudgedAt: null, createdAt: new Date(1e12 + seq).toISOString(), ...r })),
      update: async (id, patch) => Object.assign(rows.find((r) => r.id === id), patch),
      remove: async (ids) => ids.forEach((id) => rows.splice(rows.findIndex((r) => r.id === id), 1)),
    },
    notify,
    now: () => clock.at,
  };
  return { h: createMidnightPrayerHandlers(deps), rows, state, clock, notify };
}

describe('getMidnightMonth', () => {
  it('creates the month once and returns names', async () => {
    const { h, rows } = world();
    const first = await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    expect(first.nights).toHaveLength(31);
    expect(first.nights[0]).toEqual({ day: '2026-10-01', userId: expect.any(String), name: expect.any(String), prayed: false });
    expect(first.rotation.map((r) => r.name)).toEqual(['Shiny', 'Alekhya', 'Ratna Kumari', 'Daya Ratnam', 'Divya Jyothsna']);
    expect(first.nextMonth).toBeNull();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'c' });
    expect(rows).toHaveLength(31);
  });
  it('keeps the oldest row when a race made two for one night', async () => {
    const { h, rows } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const original = rows.find((r) => r.day === '2026-10-09');
    rows.push({ ...original, id: 'dup', userId: 'x', createdAt: '2099-01-01T00:00:00.000Z' });
    const again = await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    expect(again.nights.find((n) => n.day === '2026-10-09').userId).toBe(original.userId);
    expect(rows.find((r) => r.id === 'dup')).toBeUndefined();
  });
  it('opens next month only from the 20th, and never a past month', async () => {
    const early = world({ at: '2026-10-19T10:00:00.000Z' });
    await expect(early.h.getMidnightMonth({ month: '2026-11' }, { callerId: 'b' })).rejects.toThrow(MESSAGES.badMonth);
    await expect(early.h.getMidnightMonth({ month: '2026-09' }, { callerId: 'b' })).rejects.toThrow(MESSAGES.badMonth);
    const late = world({ at: '2026-10-20T10:00:00.000Z' });
    expect((await late.h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' })).nextMonth).toBe('2026-11');
    expect((await late.h.getMidnightMonth({ month: '2026-11' }, { callerId: 'b' })).nights).toHaveLength(30);
  });
  it('turns away non-members and returns no nights for an empty rotation', async () => {
    await expect(world().h.getMidnightMonth({ month: '2026-10' }, { callerId: 'zz' })).rejects.toThrow(MESSAGES.notMember);
    expect((await world({ rotation: [] }).h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' })).nights).toEqual([]);
  });
});

describe('getMidnightTonight', () => {
  it('returns tonight, yesterday across a month end, and my next night', async () => {
    const { h, rows } = world({ at: '2026-10-01T10:00:00.000Z' });
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    rows.push({ id: 'sep30', groupId: 'g1', month: '2026-09', day: '2026-09-30', userId: 'c', prayedAt: null, remindedAt: null, nudgedAt: null, createdAt: '2026-09-01T00:00:00.000Z' });
    const me = rows.find((r) => r.day > '2026-10-01').userId;
    const res = await h.getMidnightTonight({}, { callerId: me });
    expect(res.today).toBe('2026-10-01');
    expect(res.hour).toBe(15);
    expect(res.tonight.day).toBe('2026-10-01');
    expect(res.yesterday).toEqual({ day: '2026-09-30', userId: 'c', name: 'Ratna Kumari', prayed: false });
    expect(res.myNext >= '2026-10-01').toBe(true);
    expect(res.inRotation).toBe(true);
  });
  it('says so when the caller is not in the rotation', async () => {
    const res = await world().h.getMidnightTonight({}, { callerId: 'x' });
    expect(res.inRotation).toBe(false);
    expect(res.myNext).toBeNull();
  });
});

describe('markMidnightPrayed', () => {
  async function setup(at) {
    const w = world({ at: '2026-10-06T10:00:00.000Z' });
    await w.h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const row = w.rows.find((r) => r.day === '2026-10-06');
    w.clock.at = new Date(at);
    return { ...w, row };
  }
  it('opens at 11 PM on the night and closes at the end of the next day', async () => {
    let w = await setup('2026-10-06T17:29:00.000Z'); // 10:59 PM IST
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).rejects.toThrow(MESSAGES.tooEarly);
    w = await setup('2026-10-06T17:30:00.000Z'); // 11:00 PM IST
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).resolves.toEqual({ day: '2026-10-06', prayed: true });
    w = await setup('2026-10-07T18:29:00.000Z'); // 11:59 PM IST on D+1
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).resolves.toEqual({ day: '2026-10-06', prayed: true });
    w = await setup('2026-10-07T18:30:00.000Z'); // 12:00 AM on D+2
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).rejects.toThrow(MESSAGES.tooLate);
  });
  it('is only for the night’s person and is idempotent', async () => {
    const w = await setup('2026-10-07T03:00:00.000Z');
    const other = FIVE.find((u) => u !== w.row.userId);
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: other })).rejects.toThrow(MESSAGES.notYours);
    await w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId });
    const first = w.row.prayedAt;
    await w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId });
    expect(w.row.prayedAt).toBe(first);
  });
});

describe('reassignMidnightNight', () => {
  it('lets the admin move tonight to any member and clears its reminders', async () => {
    const { h, rows } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const row = rows.find((r) => r.day === '2026-10-06');
    Object.assign(row, { remindedAt: new Date(), prayedAt: new Date() });
    const res = await h.reassignMidnightNight({ day: '2026-10-06', userId: 'x' }, { callerId: 'a' });
    expect(res).toEqual({ day: '2026-10-06', userId: 'x', name: 'Devaki', prayed: false });
    expect(row).toMatchObject({ userId: 'x', remindedAt: null, prayedAt: null, nudgedAt: null });
  });
  it('refuses non-admins, past nights and non-members', async () => {
    const { h } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    await expect(h.reassignMidnightNight({ day: '2026-10-07', userId: 'c' }, { callerId: 'b' })).rejects.toThrow(MESSAGES.adminOnly);
    await expect(h.reassignMidnightNight({ day: '2026-10-05', userId: 'c' }, { callerId: 'a' })).rejects.toThrow(MESSAGES.pastNight);
    await expect(h.reassignMidnightNight({ day: '2026-10-07', userId: 'zz' }, { callerId: 'a' })).rejects.toThrow(MESSAGES.badMember);
  });
});

describe('setMidnightRotation', () => {
  it('saves the rotation and hands a removed member’s coming nights to the others', async () => {
    const { h, rows, state } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const pastE = rows.filter((r) => r.userId === 'e' && r.day < '2026-10-06').map((r) => r.id);
    const res = await h.setMidnightRotation({ userIds: ['a', 'b', 'c', 'd'] }, { callerId: 'a' });
    expect(res.rotation.map((r) => r.userId)).toEqual(['a', 'b', 'c', 'd']);
    expect(state.rotation).toEqual(['a', 'b', 'c', 'd']);
    const future = rows.filter((r) => r.day >= '2026-10-06');
    expect(future.some((r) => r.userId === 'e')).toBe(false);
    expect(rows.filter((r) => r.userId === 'e').map((r) => r.id)).toEqual(pastE);
    future.slice(1).forEach((r, i) => expect(r.userId).not.toBe(future[i].userId));
  });
  it('removes coming nights when the rotation is emptied', async () => {
    const { h, rows } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    await h.setMidnightRotation({ userIds: [] }, { callerId: 'a' });
    expect(rows.every((r) => r.day < '2026-10-06')).toBe(true);
  });
  it('validates the list', async () => {
    const { h } = world();
    await expect(h.setMidnightRotation({ userIds: ['a', 'a'] }, { callerId: 'a' })).rejects.toThrow(MESSAGES.badRotation);
    await expect(h.setMidnightRotation({ userIds: ['zz'] }, { callerId: 'a' })).rejects.toThrow(MESSAGES.badRotation);
    await expect(h.setMidnightRotation({ userIds: ['a'] }, { callerId: 'b' })).rejects.toThrow(MESSAGES.adminOnly);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd backend && npx jest cloud/midnightPrayer.test.js`
Expected: FAIL with "createMidnightPrayerHandlers is not a function".

- [ ] **Step 3: Implement** (add to `midnightPrayer.js`, above `module.exports`)

```js
const MAX_ROTATION = 20;
const NEXT_MONTH_FROM = 20;
const PRAYED_FROM_HOUR = 23;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  adminOnly: 'Only an admin can change the midnight prayer.',
  badMonth: 'That month is not available yet.',
  notFound: 'That night is not on the calendar.',
  notYours: 'Only the person praying that night can mark it.',
  tooEarly: 'You can mark this only after your night begins.',
  tooLate: 'That night has passed.',
  pastNight: 'Only tonight or a later night can be changed.',
  badMember: 'Choose a member of the group.',
  badRotation: `Choose up to ${MAX_ROTATION} different members of the group.`,
};

function fail(message) {
  return new Error(message);
}

function createMidnightPrayerHandlers({ memberships, rotations, nights, users, notify = async () => undefined, now = () => new Date() }) {
  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  async function requireAdmin(callerId) {
    const groupId = await requireGroup(callerId);
    if ((await memberships.findAdminGroupId(callerId)) !== groupId) throw fail(MESSAGES.adminOnly);
    return groupId;
  }

  async function namesFor(ids) {
    const people = await users.findMany([...new Set(ids)].filter(Boolean));
    const byId = new Map(people.map((u) => [u.id, (u.displayName || '').trim() || 'Member']));
    return (id) => byId.get(id) || 'Member';
  }

  function nightView(row, name) {
    return { day: row.day, userId: row.userId, name: name(row.userId), prayed: Boolean(row.prayedAt) };
  }

  /** One row per night: the oldest wins, the rest (left by two first opens racing) are deleted. */
  async function dedupe(rows) {
    const seen = new Set();
    const keep = [];
    const extra = [];
    rows.forEach((r) => (seen.has(r.day) ? extra.push(r.id) : (seen.add(r.day), keep.push(r))));
    if (extra.length) await nights.remove(extra);
    return keep;
  }

  function openMonths(today) {
    const current = today.slice(0, 7);
    const next = Number(today.slice(8, 10)) >= NEXT_MONTH_FROM ? nextMonth(current) : null;
    return { current, next };
  }

  /** The month's nights, planned and saved the first time anyone asks. */
  async function ensureMonth(groupId, month) {
    const existing = await dedupe(await nights.listMonth(groupId, month));
    if (existing.length) return existing;
    const rotation = await rotations.get(groupId);
    if (!rotation.length) return [];
    const before = await nights.findLastBefore(groupId, `${month}-01`);
    const plan = planMonth({ month, rotation, lastPersonBefore: before ? before.userId : null, random: seededRandom(`${groupId}:${month}`) });
    await nights.createMany(plan.map((p) => ({ groupId, month, ...p })));
    return dedupe(await nights.listMonth(groupId, month));
  }

  /** Gives each of `rows` (in day order) to the rotation member with the fewest nights, avoiding neighbours. */
  async function redistribute(groupId, rows, rotation, today) {
    const upcoming = await nights.listFrom(groupId, today);
    const byDay = new Map(upcoming.map((r) => [r.day, r]));
    const load = new Map(rotation.map((id) => [id, 0]));
    upcoming.forEach((r) => load.has(r.userId) && load.set(r.userId, load.get(r.userId) + 1));
    for (const row of rows) {
      const neighbours = [byDay.get(addDays(row.day, -1)), byDay.get(addDays(row.day, 1))].filter(Boolean).map((r) => r.userId);
      const ranked = [...rotation].sort((p, q) => load.get(p) - load.get(q));
      const pick = ranked.find((id) => !neighbours.includes(id)) || ranked[0];
      await nights.update(row.id, { userId: pick, prayedAt: null, remindedAt: null, nudgedAt: null });
      // Rows from the repository are copies, so record the new person where the neighbour check reads.
      byDay.set(row.day, { ...row, userId: pick });
      load.set(pick, load.get(pick) + 1);
    }
  }

  return {
    MESSAGES,

    async getMidnightMonth({ month } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const { current, next } = openMonths(istNow(now()).day);
      if (month !== current && month !== next) throw fail(MESSAGES.badMonth);
      const rows = await ensureMonth(groupId, month);
      const rotation = await rotations.get(groupId);
      const name = await namesFor([...rows.map((r) => r.userId), ...rotation]);
      return {
        month,
        nights: rows.map((r) => nightView(r, name)),
        rotation: rotation.map((userId) => ({ userId, name: name(userId) })),
        nextMonth: month === current ? next : null,
      };
    },

    async getMidnightTonight(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const { day: today, hour } = istNow(now());
      const { current, next } = openMonths(today);
      const rows = [...(await ensureMonth(groupId, current)), ...(next ? await ensureMonth(groupId, next) : [])];
      const yesterdayDay = addDays(today, -1);
      const tonight = rows.find((r) => r.day === today) || null;
      const yesterday = rows.find((r) => r.day === yesterdayDay) || (await nights.findDay(groupId, yesterdayDay));
      const mine = rows.find((r) => r.day >= today && r.userId === callerId);
      const rotation = await rotations.get(groupId);
      const name = await namesFor([tonight && tonight.userId, yesterday && yesterday.userId]);
      return {
        today,
        hour,
        tonight: tonight ? nightView(tonight, name) : null,
        yesterday: yesterday ? nightView(yesterday, name) : null,
        myNext: mine ? mine.day : null,
        inRotation: rotation.includes(callerId),
      };
    },

    async markMidnightPrayed({ day } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const row = typeof day === 'string' && DAY_KEY.test(day) ? await nights.findDay(groupId, day) : null;
      if (!row) throw fail(MESSAGES.notFound);
      if (row.userId !== callerId) throw fail(MESSAGES.notYours);
      const { day: today, hour } = istNow(now());
      const open = (today === day && hour >= PRAYED_FROM_HOUR) || today === addDays(day, 1);
      if (!open) throw fail(today <= day ? MESSAGES.tooEarly : MESSAGES.tooLate);
      if (!row.prayedAt) await nights.update(row.id, { prayedAt: now() });
      return { day, prayed: true };
    },

    async reassignMidnightNight({ day, userId } = {}, { callerId } = {}) {
      const groupId = await requireAdmin(callerId);
      const row = typeof day === 'string' && DAY_KEY.test(day) ? await nights.findDay(groupId, day) : null;
      if (!row) throw fail(MESSAGES.notFound);
      if (day < istNow(now()).day) throw fail(MESSAGES.pastNight);
      if (typeof userId !== 'string' || !(await memberships.isActiveMember(userId, groupId))) throw fail(MESSAGES.badMember);
      await nights.update(row.id, { userId, prayedAt: null, remindedAt: null, nudgedAt: null });
      const name = await namesFor([userId]);
      return nightView({ ...row, userId, prayedAt: null }, name);
    },

    async setMidnightRotation({ userIds } = {}, { callerId } = {}) {
      const groupId = await requireAdmin(callerId);
      const ids = Array.isArray(userIds) ? userIds : null;
      const valid =
        ids &&
        ids.length <= MAX_ROTATION &&
        ids.every((id) => typeof id === 'string') &&
        new Set(ids).size === ids.length &&
        (await Promise.all(ids.map((id) => memberships.isActiveMember(id, groupId)))).every(Boolean);
      if (!valid) throw fail(MESSAGES.badRotation);
      const before = await rotations.get(groupId);
      await rotations.set(groupId, ids);
      const removed = before.filter((id) => !ids.includes(id));
      const today = istNow(now()).day;
      const orphaned = removed.length ? (await nights.listFrom(groupId, today)).filter((r) => removed.includes(r.userId)) : [];
      if (orphaned.length && !ids.length) await nights.remove((await nights.listFrom(groupId, today)).map((r) => r.id));
      else if (orphaned.length) await redistribute(groupId, orphaned, ids, today);
      const name = await namesFor(ids);
      return { rotation: ids.map((userId) => ({ userId, name: name(userId) })) };
    },
  };
}
```

Change the export line to:

```js
module.exports = { istNow, addDays, daysOfMonth, nextMonth, seededRandom, planMonth, createMidnightPrayerHandlers, MESSAGES };
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd backend && npx jest cloud/midnightPrayer.test.js`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add backend/cloud/midnightPrayer.js backend/cloud/midnightPrayer.test.js
git commit -m "midnight prayer: month, tonight, I prayed, reassign and rotation handlers"
```

---

### Task 3: Reminders and notifications

**Files:**
- Modify: `backend/cloud/midnightPrayer.js`, `backend/cloud/notifications.js`
- Test: `backend/cloud/midnightPrayer.test.js`, `backend/cloud/notifications.test.js`

**Interfaces:**
- Produces: handler `sendMidnightReminders() → { reminded, nudged }`. Notification events `{ type: 'midnightReminder' | 'midnightNudge', groupId, actorId: null, userId, day }`. Pref key `midnight`. Route `/prayer/midnight`.

- [ ] **Step 1: Write the failing tests**

Append to `midnightPrayer.test.js`:

```js
describe('sendMidnightReminders', () => {
  async function at(iso) {
    const w = world({ at: '2026-10-06T10:00:00.000Z' });
    await w.h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    // Earlier nights are confirmed, so only the nights under test can be nudged.
    w.rows.filter((r) => r.day < '2026-10-06').forEach((r) => (r.prayedAt = new Date()));
    w.clock.at = new Date(iso);
    return w;
  }
  it('reminds tonight’s person once from 9 PM', async () => {
    let w = await at('2026-10-06T15:29:00.000Z'); // 8:59 PM IST
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 0, nudged: 0 });
    w = await at('2026-10-06T15:30:00.000Z'); // 9:00 PM IST
    const person = w.rows.find((r) => r.day === '2026-10-06').userId;
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 1, nudged: 0 });
    expect(w.notify).toHaveBeenCalledWith({ type: 'midnightReminder', groupId: 'g1', actorId: null, userId: person, day: '2026-10-06' });
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 0, nudged: 0 });
  });
  it('reminds the new person when the admin reassigns after 9 PM', async () => {
    const w = await at('2026-10-06T15:30:00.000Z');
    await w.h.sendMidnightReminders();
    await w.h.reassignMidnightNight({ day: '2026-10-06', userId: 'x' }, { callerId: 'a' });
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 1, nudged: 0 });
    expect(w.notify).toHaveBeenLastCalledWith(expect.objectContaining({ userId: 'x' }));
  });
  it('nudges last night’s person from noon if they have not marked it', async () => {
    const w = await at('2026-10-07T06:30:00.000Z'); // 12:00 PM IST on D+1
    const row = w.rows.find((r) => r.day === '2026-10-06');
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 0, nudged: 1 });
    expect(w.notify).toHaveBeenCalledWith({ type: 'midnightNudge', groupId: 'g1', actorId: null, userId: row.userId, day: '2026-10-06' });
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 0, nudged: 0 });
  });
  it('does not nudge someone who prayed', async () => {
    const w = await at('2026-10-07T06:30:00.000Z');
    w.rows.find((r) => r.day === '2026-10-06').prayedAt = new Date();
    expect(await w.h.sendMidnightReminders()).toEqual({ reminded: 0, nudged: 0 });
  });
});
```

Append to `notifications.test.js` (it already has a `user(id, displayName, notificationPrefs)` helper; reuse it and any existing notifier fake builder in that file; if none fits, build one inline as shown):

```js
const { buildMessage: build, createNotifier: makeNotifier, DEFAULT_PREFS: PREFS } = require('./notifications');

describe('midnight prayer notifications', () => {
  it('builds the reminder and the nudge with the midnight pref', () => {
    expect(build({ type: 'midnightReminder', day: '2026-10-06' })).toEqual({ title: 'Your midnight prayer', body: 'Tonight at 12:00 AM is your night to pray for the group.', route: '/prayer/midnight', pref: 'midnight' });
    expect(build({ type: 'midnightNudge', day: '2026-10-06' })).toEqual({ title: 'Did you pray last night?', body: 'Tap to mark your midnight prayer.', route: '/prayer/midnight', pref: 'midnight' });
    expect(PREFS.midnight).toBe(true);
  });
  it('sends only to the person, respecting their preference', async () => {
    const inbox = { createMany: jest.fn(async () => undefined) };
    const deps = (prefs) => ({
      members: { listActiveUserIds: jest.fn(async () => ['u1', 'u2']) },
      users: { findMany: jest.fn(async (ids) => ids.map((id) => ({ id, displayName: id, notificationPrefs: prefs }))) },
      inbox,
      tokens: { forUsers: jest.fn(async () => []), remove: jest.fn() },
      push: { send: jest.fn(async () => []) },
    });
    await makeNotifier(deps(null)).notify({ type: 'midnightReminder', groupId: 'g1', actorId: null, userId: 'u2', day: '2026-10-06' });
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ recipientId: 'u2', type: 'midnightReminder' })]);
    inbox.createMany.mockClear();
    await makeNotifier(deps({ midnight: false })).notify({ type: 'midnightNudge', groupId: 'g1', actorId: null, userId: 'u2', day: '2026-10-06' });
    expect(inbox.createMany).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd backend && npx jest cloud/midnightPrayer.test.js cloud/notifications.test.js`
Expected: FAIL. `sendMidnightReminders` is not a function, and buildMessage throws "Unknown notification event: midnightReminder".

- [ ] **Step 3: Implement**

In `midnightPrayer.js`, add the constants next to the others:

```js
const REMIND_FROM_HOUR = 21;
const NUDGE_FROM_HOUR = 12;
```

Then add this to the returned handler object:

```js
    /** Hourly job: tonight's reminder from 9 PM, last night's nudge from noon. Each goes once. */
    async sendMidnightReminders() {
      const { day: today, hour } = istNow(now());
      let reminded = 0;
      let nudged = 0;
      if (hour >= REMIND_FROM_HOUR) {
        for (const row of await nights.listDay(today)) {
          if (row.remindedAt) continue;
          await nights.update(row.id, { remindedAt: now() });
          await notify({ type: 'midnightReminder', groupId: row.groupId, actorId: null, userId: row.userId, day: row.day });
          reminded += 1;
        }
      }
      if (hour >= NUDGE_FROM_HOUR) {
        for (const row of await nights.listDay(addDays(today, -1))) {
          if (row.prayedAt || row.nudgedAt) continue;
          await nights.update(row.id, { nudgedAt: now() });
          await notify({ type: 'midnightNudge', groupId: row.groupId, actorId: null, userId: row.userId, day: row.day });
          nudged += 1;
        }
      }
      return { reminded, nudged };
    },
```

In `notifications.js`:
- Change `const PREF_KEYS = ['prayer', 'praying', 'answered', 'calls', 'resources', 'funds'];` to `const PREF_KEYS = ['prayer', 'praying', 'answered', 'calls', 'resources', 'funds', 'midnight'];`.
- In `buildMessage`, before `default:`, add:

```js
    case 'midnightReminder':
      return { title: 'Your midnight prayer', body: 'Tonight at 12:00 AM is your night to pray for the group.', route: '/prayer/midnight', pref: 'midnight' };
    case 'midnightNudge':
      return { title: 'Did you pray last night?', body: 'Tap to mark your midnight prayer.', route: '/prayer/midnight', pref: 'midnight' };
```

- In `createNotifier`'s `targets`, after the `contribution` line, add:

```js
    if (event.type === 'midnightReminder' || event.type === 'midnightNudge') return [event.userId];
```

- [ ] **Step 4: Run all backend tests**

Run: `cd backend && npx jest`
Expected: PASS (all suites, including any existing test that enumerates the pref keys; if one asserts the exact key list, add `'midnight'` to its expectation).

- [ ] **Step 5: Commit**

```bash
git add backend/cloud/midnightPrayer.js backend/cloud/midnightPrayer.test.js backend/cloud/notifications.js backend/cloud/notifications.test.js
git commit -m "midnight prayer: 9 PM reminder, next-day nudge and the midnight notification setting"
```

---

### Task 4: Parse wiring, schema, deploy and seed

**Files:**
- Modify: `backend/cloud/main.js`, `backend/schema/setup.mjs`

**Interfaces:**
- Consumes: `createMidnightPrayerHandlers` (Tasks 2–3); the existing `memberships`, `users`, `notifier`, `pointer`, `refId` and `groupReadAcl` in `main.js`.
- Produces: Cloud functions `getMidnightMonth`, `getMidnightTonight`, `markMidnightPrayed`, `reassignMidnightNight`, `setMidnightRotation`; job `midnightPrayerReminders`.

- [ ] **Step 1: Add the repositories to `main.js`**

Insert after the `// ---------- all-night prayer ----------` repository block (after `const prayerNights = { … };`):

```js
// ---------- midnight prayer ----------

function midnightNightDto(obj) {
  const at = (key) => (obj.get(key) ? obj.get(key).toISOString() : null);
  return {
    id: obj.id,
    groupId: refId(obj.get('group')),
    month: obj.get('month'),
    day: obj.get('day'),
    userId: refId(obj.get('user')),
    prayedAt: at('prayedAt'),
    remindedAt: at('remindedAt'),
    nudgedAt: at('nudgedAt'),
    createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
  };
}

function midnightQuery(groupId) {
  const q = new Parse.Query('MidnightNight');
  if (groupId) q.equalTo('group', pointer('Group', groupId));
  return q.ascending('day').addAscending('createdAt');
}

const midnightNights = {
  async listMonth(groupId, month) {
    return (await midnightQuery(groupId).equalTo('month', month).limit(200).find({ useMasterKey: true })).map(midnightNightDto);
  },
  async listFrom(groupId, day) {
    return (await midnightQuery(groupId).greaterThanOrEqualTo('day', day).limit(500).find({ useMasterKey: true })).map(midnightNightDto);
  },
  async findDay(groupId, day) {
    const obj = await midnightQuery(groupId).equalTo('day', day).first({ useMasterKey: true });
    return obj ? midnightNightDto(obj) : null;
  },
  async findLastBefore(groupId, day) {
    const obj = await new Parse.Query('MidnightNight').equalTo('group', pointer('Group', groupId)).lessThan('day', day).descending('day').first({ useMasterKey: true });
    return obj ? midnightNightDto(obj) : null;
  },
  async listDay(day) {
    return (await midnightQuery(null).equalTo('day', day).limit(500).find({ useMasterKey: true })).map(midnightNightDto);
  },
  async createMany(rows) {
    const objs = rows.map(({ groupId, month, day, userId }) => {
      const obj = new Parse.Object('MidnightNight');
      obj.set('group', pointer('Group', groupId));
      obj.set('month', month);
      obj.set('day', day);
      obj.set('user', pointer('_User', userId));
      obj.setACL(groupReadAcl(groupId));
      return obj;
    });
    await Parse.Object.saveAll(objs, { useMasterKey: true });
  },
  async update(id, patch) {
    const obj = await new Parse.Query('MidnightNight').get(id, { useMasterKey: true });
    Object.entries(patch).forEach(([key, value]) => {
      if (key === 'userId') obj.set('user', pointer('_User', value));
      else if (value === null) obj.unset(key);
      else obj.set(key, value);
    });
    await obj.save(null, { useMasterKey: true });
  },
  async remove(ids) {
    const objs = await new Parse.Query('MidnightNight').containedIn('objectId', ids).limit(500).find({ useMasterKey: true });
    await Parse.Object.destroyAll(objs, { useMasterKey: true });
  },
};

const midnightRotations = {
  async get(groupId) {
    const group = await new Parse.Query('Group').get(groupId, { useMasterKey: true }).catch(() => null);
    const ids = group ? group.get('midnightRotation') : null;
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  },
  async set(groupId, ids) {
    const group = await new Parse.Query('Group').get(groupId, { useMasterKey: true });
    group.set('midnightRotation', ids);
    await group.save(null, { useMasterKey: true });
  },
};
```

Add the require next to the others at the top:

```js
const { createMidnightPrayerHandlers } = require('./midnightPrayer');
```

After `const prayerNightHandlers = …;` add:

```js
const midnightHandlers = createMidnightPrayerHandlers({ memberships, rotations: midnightRotations, nights: midnightNights, users, notify: (event) => notifier.notify(event) });
```

After the `Parse.Cloud.job('prayerNightReminders', …)` line add:

```js
['getMidnightMonth', 'getMidnightTonight', 'markMidnightPrayed', 'reassignMidnightNight', 'setMidnightRotation'].forEach((name) =>
  Parse.Cloud.define(name, (request) => midnightHandlers[name](request.params, { callerId: callerId(request) })),
);
Parse.Cloud.job('midnightPrayerReminders', () => midnightHandlers.sendMidnightReminders());
```

Check that `memberships.isActiveMember(userId, groupId)` in `main.js` takes `(userId, groupId)` in that order (line ~51). If its signature differs, adapt the call inside an inline wrapper object rather than changing `memberships`.

- [ ] **Step 2: Load-check `main.js`**

Run: `cd backend && node -e "global.Parse={Cloud:{define(){},job(){},beforeSave(){},afterSave(){},beforeLogin(){},afterDelete(){},beforeDelete(){}},Object:function(){},Query:function(){},ACL:function(){}};require('./cloud/main.js');console.log('ok')"`
Expected: `ok`. If it fails because `main.js` uses another `Parse.Cloud` hook, add that name to the stub and rerun. The point is only to catch syntax and require errors.

- [ ] **Step 3: Add the schema to `backend/schema/setup.mjs`**

In `groupSchema.fields`, after `nightOrder`, add:

```js
    midnightRotation: { type: 'Array' }, // user ids taking turns at the midnight prayer, in the admin's order
```

After `prayerNightSchema`, add:

```js
const midnightNightSchema = {
  className: 'MidnightNight',
  fields: {
    group: { type: 'Pointer', targetClass: 'Group', required: true },
    month: { type: 'String', required: true },
    day: { type: 'String', required: true },
    user: { type: 'Pointer', targetClass: '_User', required: true },
    prayedAt: { type: 'Date' },
    remindedAt: { type: 'Date' },
    nudgedAt: { type: 'Date' },
  },
  classLevelPermissions: {
    find: authenticated, get: authenticated, count: authenticated,
    create: masterOnly, update: masterOnly, delete: masterOnly, addField: masterOnly, protectedFields: {},
  },
};
```

After `await upsertSchema(prayerNightSchema);`, add `await upsertSchema(midnightNightSchema);`.

- [ ] **Step 4: Run the backend tests and commit**

Run: `cd backend && npx jest`
Expected: PASS.

```bash
git add backend/cloud/main.js backend/schema/setup.mjs
git commit -m "midnight prayer: Parse repositories, cloud functions, job and schema"
```

- [ ] **Step 5: Production — ask the user first, then apply the schema**

Run: `set -a; . backend/.env; set +a; node backend/schema/setup.mjs`
Expected: the script reports that `MidnightNight` was created and `Group` was updated, with no errors.

- [ ] **Step 6: Production — deploy Cloud Code**

Use `mcp__back4app__deploy_cloud_code_files` with applicationId `HPpFb31s1zsLI3ltmwVPVIALhF135BZRDKxUfdHQ`. Deploy every non-test file in `backend/cloud/` (`main.js`, `calls.js`, `finance.js`, `livekit.js`, `members.js`, `midnightPrayer.js`, `notifications.js`, `prayer.js`, `prayerNight.js`, `prayerPoints.js`, `quiz.js`, `quizQuestions.js`, `resources.js`), each as `{ path: '<name>', localPath: '<absolute path>' }`.
Expected: a new release, with checksums matching `md5 -q backend/cloud/<file>`.

- [ ] **Step 7: Production — seed the rotation**

```bash
set -a; . backend/.env; set +a
curl -s -X PUT "$PARSE_SERVER_URL/classes/Group/XKhTR8Y3OH" -H "X-Parse-Application-Id: $PARSE_APP_ID" -H "X-Parse-Master-Key: $PARSE_MASTER_KEY" -H "Content-Type: application/json" \
  -d '{"midnightRotation":["Jt6qzCzbVe","IrdFyiDap8","BcSgcEa8zl","MWww7ztrlD","COjhGkY8RX"]}'
```

Expected: `{"updatedAt": …}`. Check that `curl -s -X POST "$PARSE_SERVER_URL/functions/getMidnightTonight" -H "X-Parse-Application-Id: $PARSE_APP_ID" -H "X-Parse-Master-Key: $PARSE_MASTER_KEY" -d '{}'` returns `"You're not a member of this group yet."`. That proves the function loads; it has no user, so it stops before creating anything.

- [ ] **Step 8: Tell the user to schedule the job**

In the Back4App dashboard → Server Settings → Background Jobs → Schedule a job, choose `midnightPrayerReminders`, repeat every 1 hour, starting now.

---

### Task 5: App service, card state and notification setting

**Files:**
- Create: `apps/mobile/src/features/prayer/midnight.ts`
- Test: `apps/mobile/src/features/prayer/midnight.test.ts`
- Modify: `apps/mobile/src/features/prayer/index.ts`, `apps/mobile/src/lib/parse.ts`, `apps/mobile/src/features/notifications/types.ts`, `apps/mobile/src/i18n/en.ts`, `apps/mobile/src/i18n/te.ts`

**Interfaces:**
- Consumes: the cloud functions and shapes from Task 2.
- Produces:
  - Types `MidnightNight`, `MidnightMonth`, `MidnightTonight`, `MidnightCard`.
  - `createMidnightService({ cloud })` with `tonight()`, `month(month)`, `markPrayed(day)`, `reassign(day, userId)`, `setRotation(userIds)`.
  - Hooks `useMidnightTonight(service)` and `useMidnightMonth(service, month)`, each returning `{ data, loading, error, refresh }`.
  - `midnightCard(state, me) → MidnightCard` and `dayLabel(day, locale) → string`.
  - `midnightService` in `@/lib/parse`.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/mobile/src/features/prayer/midnight.test.ts
import { createMidnightService, dayLabel, midnightCard, type MidnightTonight } from './midnight';

const base: MidnightTonight = { today: '2026-10-07', hour: 15, tonight: { day: '2026-10-07', userId: 'c', name: 'Ratna Kumari', prayed: false }, yesterday: { day: '2026-10-06', userId: 'b', name: 'Alekhya', prayed: false }, myNext: null, inRotation: false };

describe('createMidnightService', () => {
  it('calls the cloud functions', async () => {
    const cloud = { run: jest.fn(async () => ({})) };
    const s = createMidnightService({ cloud });
    await s.tonight();
    await s.month('2026-10');
    await s.markPrayed('2026-10-06');
    await s.reassign('2026-10-08', 'u1');
    await s.setRotation(['u1', 'u2']);
    expect(cloud.run.mock.calls).toEqual([
      ['getMidnightTonight'],
      ['getMidnightMonth', { month: '2026-10' }],
      ['markMidnightPrayed', { day: '2026-10-06' }],
      ['reassignMidnightNight', { day: '2026-10-08', userId: 'u1' }],
      ['setMidnightRotation', { userIds: ['u1', 'u2'] }],
    ]);
  });
});

describe('midnightCard', () => {
  it('shows who prays tonight, and my next night', () => {
    expect(midnightCard({ ...base, myNext: '2026-10-10', inRotation: true }, 'e')).toEqual({ kind: 'other', name: 'Ratna Kumari', myNext: '2026-10-10' });
    expect(midnightCard(base, 'x')).toEqual({ kind: 'other', name: 'Ratna Kumari', myNext: null });
  });
  it('tells me tonight is mine, then asks me to confirm from 11 PM', () => {
    expect(midnightCard({ ...base, myNext: '2026-10-07' }, 'c')).toEqual({ kind: 'yours' });
    expect(midnightCard({ ...base, hour: 23 }, 'c')).toEqual({ kind: 'confirm', day: '2026-10-07' });
    expect(midnightCard({ ...base, hour: 23, tonight: { ...base.tonight!, prayed: true } }, 'c')).toEqual({ kind: 'prayed', day: '2026-10-07' });
  });
  it('just after midnight, lets last night’s person confirm while showing the next person to others', () => {
    const after = { ...base, hour: 0 };
    expect(midnightCard(after, 'b')).toEqual({ kind: 'confirm', day: '2026-10-06' });
    expect(midnightCard({ ...after, yesterday: { ...base.yesterday!, prayed: true } }, 'b')).toEqual({ kind: 'prayed', day: '2026-10-06' });
    expect(midnightCard(after, 'e')).toEqual({ kind: 'other', name: 'Ratna Kumari', myNext: null });
  });
  it('hides when nobody is on the calendar tonight', () => {
    expect(midnightCard({ ...base, tonight: null, yesterday: null }, 'b')).toEqual({ kind: 'hidden' });
  });
});

describe('dayLabel', () => {
  it('formats a day key without shifting the date', () => {
    expect(dayLabel('2026-10-10', 'en-IN')).toMatch(/10/);
    expect(dayLabel('2026-10-10', 'en-IN')).toMatch(/Oct/);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd apps/mobile && npx jest src/features/prayer/midnight.test.ts`
Expected: FAIL with "Cannot find module './midnight'".

- [ ] **Step 3: Implement**

```ts
// apps/mobile/src/features/prayer/midnight.ts
import { useCachedQuery } from '../../lib/useCachedQuery';
import { mapParseError } from '../auth/errors';

/** One night of the midnight prayer: the 12:00 AM at the end of `day` (Indian calendar day). */
export type MidnightNight = { day: string; userId: string; name: string; prayed: boolean };

export type MidnightMonth = {
  month: string;
  nights: MidnightNight[];
  rotation: { userId: string; name: string }[];
  /** The next month's key once it can be opened (from the 20th), else null. */
  nextMonth: string | null;
};

export type MidnightTonight = {
  /** Today's Indian calendar day and hour, from the server's clock. */
  today: string;
  hour: number;
  tonight: MidnightNight | null;
  yesterday: MidnightNight | null;
  myNext: string | null;
  inRotation: boolean;
};

export type MidnightCard =
  | { kind: 'hidden' }
  | { kind: 'other'; name: string; myNext: string | null }
  | { kind: 'yours' }
  | { kind: 'confirm'; day: string }
  | { kind: 'prayed'; day: string };

type Deps = { cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> } };

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createMidnightService({ cloud }: Deps) {
  return {
    tonight: () => guarded(() => cloud.run('getMidnightTonight')) as Promise<MidnightTonight>,
    month: (month: string) => guarded(() => cloud.run('getMidnightMonth', { month })) as Promise<MidnightMonth>,
    markPrayed: (day: string) => guarded(() => cloud.run('markMidnightPrayed', { day })) as Promise<{ day: string; prayed: true }>,
    reassign: (day: string, userId: string) => guarded(() => cloud.run('reassignMidnightNight', { day, userId })) as Promise<MidnightNight>,
    setRotation: (userIds: string[]) => guarded(() => cloud.run('setMidnightRotation', { userIds })) as Promise<{ rotation: MidnightMonth['rotation'] }>,
  };
}

export type MidnightService = ReturnType<typeof createMidnightService>;

const PRAYED_FROM_HOUR = 23;

/** What the Home card shows for this member right now. */
export function midnightCard(state: MidnightTonight, me: string): MidnightCard {
  const { tonight, yesterday, hour } = state;
  if (yesterday && yesterday.userId === me && (!tonight || tonight.userId !== me || hour < PRAYED_FROM_HOUR)) {
    return yesterday.prayed ? { kind: 'prayed', day: yesterday.day } : { kind: 'confirm', day: yesterday.day };
  }
  if (!tonight) return { kind: 'hidden' };
  if (tonight.userId === me) {
    if (hour < PRAYED_FROM_HOUR) return { kind: 'yours' };
    return tonight.prayed ? { kind: 'prayed', day: tonight.day } : { kind: 'confirm', day: tonight.day };
  }
  return { kind: 'other', name: tonight.name, myNext: state.myNext };
}

/** "Sat, 10 Oct" for a day key, read at noon India time so no time zone moves it to another date. */
export function dayLabel(day: string, locale: string): string {
  return new Date(`${day}T12:00:00+05:30`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function useMidnightTonight(service: MidnightService) {
  return useCachedQuery<MidnightTonight>('prayer:midnightTonight', () => service.tonight(), { fallback: 'Could not load the midnight prayer.' });
}

export function useMidnightMonth(service: MidnightService, month: string) {
  return useCachedQuery<MidnightMonth>(`prayer:midnightMonth:${month}`, () => service.month(month), { fallback: 'Could not load the midnight prayer.' });
}
```

The first rule in `midnightCard` covers the person who prayed last night and is not also tonight's person before 11 PM. A last-night person who prayed and has now gone past their window still sees `prayed` until the day ends. That is the intended ✓.

Append to `apps/mobile/src/features/prayer/index.ts`:

```ts
export { createMidnightService, dayLabel, midnightCard, useMidnightMonth, useMidnightTonight } from './midnight';
export type { MidnightCard, MidnightMonth, MidnightNight, MidnightService, MidnightTonight } from './midnight';
```

In `apps/mobile/src/lib/parse.ts`:
- Add `createMidnightService` to the existing `@/features/prayer` (or `../features/prayer`) import, using the same path style as `createPrayerNightService`.
- After `export const prayerNightService = …;`, add:

```ts
export const midnightService = createMidnightService({ cloud: Parse.Cloud });
```

In `apps/mobile/src/features/notifications/types.ts`:
- `PREF_KEYS` becomes `['prayer', 'praying', 'answered', 'calls', 'resources', 'funds', 'midnight'] as const`.
- `DEFAULT_PREFS` gains `midnight: true`.
- `PREF_LABELS` gains `midnight: { title: 'Midnight prayer', description: 'A reminder on your night to pray at 12:00 AM.' },`.

In `en.ts`, add after the `'prayer.night.…'` keys:

```ts
  'midnight.title': 'Midnight prayer',
  'midnight.other': '{name} is praying tonight at 12:00 AM',
  'midnight.yours': 'Tonight is your night · 12:00 AM',
  'midnight.confirmTitle': 'Did you pray at midnight?',
  'midnight.confirm': 'I prayed',
  'midnight.prayed': 'Prayed — thank you',
  'midnight.next': 'Your next night: {date}',
  'midnight.intro': 'Each night one person prays for the group at 12:00 AM.',
  'midnight.tonight': 'Tonight',
  'midnight.thisMonth': 'This month',
  'midnight.nextMonth': 'Next month',
  'midnight.empty': 'No one is in the rotation yet.',
  'midnight.rotation': 'Rotation',
  'midnight.rotationIntro': 'Choose who takes turns. Anyone removed hands their coming nights to the others; someone added starts next month.',
  'midnight.assignTitle': 'Who prays this night?',
  'midnight.failed': 'Could not save. Try again.',
```

And with the other `notifications.pref.*` keys:

```ts
  'notifications.pref.midnight': 'Midnight prayer',
  'notifications.pref.midnightHint': 'A reminder on your night to pray at 12:00 AM.',
```

In `te.ts`, add:

```ts
  'midnight.title': 'అర్ధరాత్రి ప్రార్థన',
  'midnight.other': '{name} ఈ రాత్రి 12:00 కి ప్రార్థిస్తున్నారు',
  'midnight.yours': 'ఈ రాత్రి మీ వంతు · 12:00 AM',
  'midnight.confirmTitle': 'అర్ధరాత్రి ప్రార్థించారా?',
  'midnight.confirm': 'నేను ప్రార్థించాను',
  'midnight.prayed': 'ప్రార్థించారు — ధన్యవాదాలు',
  'midnight.next': 'మీ తదుపరి రాత్రి: {date}',
  'midnight.intro': 'ప్రతి రాత్రి 12:00 కి ఒకరు గుంపు కొరకు ప్రార్థిస్తారు.',
  'midnight.tonight': 'ఈ రాత్రి',
  'midnight.thisMonth': 'ఈ నెల',
  'midnight.nextMonth': 'వచ్చే నెల',
  'midnight.empty': 'ఇంకా ఎవరూ జాబితాలో లేరు.',
  'midnight.rotation': 'వంతుల జాబితా',
  'midnight.rotationIntro': 'ఎవరు వంతులుగా ప్రార్థించాలో ఎంచుకోండి. తీసివేసినవారి రాబోయే రాత్రులు మిగతావారికి వెళ్తాయి; కొత్తవారు వచ్చే నెల నుండి.',
  'midnight.assignTitle': 'ఈ రాత్రి ఎవరు ప్రార్థిస్తారు?',
  'midnight.failed': 'సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.',
  'notifications.pref.midnight': 'అర్ధరాత్రి ప్రార్థన',
  'notifications.pref.midnightHint': 'మీ వంతు రాత్రి 12:00 కి ప్రార్థన గుర్తు.',
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `cd apps/mobile && npx jest && npx tsc --noEmit -p .`
Expected: all suites PASS and no type errors. If a notifications test asserts the exact `PREF_KEYS` or `DEFAULT_PREFS`, add `midnight` to its expectation.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/prayer/midnight.ts apps/mobile/src/features/prayer/midnight.test.ts apps/mobile/src/features/prayer/index.ts apps/mobile/src/lib/parse.ts apps/mobile/src/features/notifications/types.ts apps/mobile/src/i18n/en.ts apps/mobile/src/i18n/te.ts
git commit -m "midnight prayer: app service, card state and notification setting"
```

---

### Task 6: Home card

**Files:**
- Create: `apps/mobile/src/features/prayer/MidnightPrayerCard.tsx`
- Modify: `apps/mobile/src/features/prayer/index.ts`, `apps/mobile/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `midnightCard`, `dayLabel`, `useMidnightTonight`, `midnightService`, `useAuth`, and `Card`/`Text`/`Button` from `@/ui`.
- Produces: `<MidnightPrayerCard />`, which loads its own data and renders nothing when hidden.

- [ ] **Step 1: Write the component**

```tsx
// apps/mobile/src/features/prayer/MidnightPrayerCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useLanguage } from '@/i18n';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Text } from '@/ui';

import { dayLabel, midnightCard, useMidnightTonight } from './midnight';

/** Home: who prays at 12:00 AM tonight; on your night, a reminder and then "I prayed". */
export function MidnightPrayerCard() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { data, refresh } = useMidnightTonight(midnightService);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  if (!data || !user) return null;
  const card = midnightCard(data, user.id);
  if (card.kind === 'hidden') return null;

  async function confirm(day: string) {
    setBusy(true);
    setError(null);
    try {
      await midnightService.markPrayed(day);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('midnight.failed'));
    } finally {
      setBusy(false);
    }
  }

  const headline =
    card.kind === 'other' ? t('midnight.other', { name: card.name }) : card.kind === 'yours' ? t('midnight.yours') : card.kind === 'confirm' ? t('midnight.confirmTitle') : t('midnight.prayed');
  const sub = card.kind === 'other' && card.myNext ? t('midnight.next', { date: dayLabel(card.myNext, locale) }) : null;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('midnight.title')} onPress={() => router.push('/prayer/midnight')} className="active:opacity-90">
      <Card className="gap-3 p-4">
        <View className="flex-row items-center gap-3.5">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-lavender">
            <Ionicons name={card.kind === 'prayed' ? 'checkmark' : 'moon'} size={22} color={colors.violet} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="caption">{t('midnight.title')}</Text>
            <Text variant="label" className="text-[15px]">
              {headline}
            </Text>
            {sub ? <Text variant="caption">{sub}</Text> : null}
          </View>
        </View>
        {card.kind === 'confirm' ? <Button title={t('midnight.confirm')} size="compact" onPress={() => confirm(card.day)} loading={busy} disabled={busy} /> : null}
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
```

Before using them, check that `Button` accepts `size="compact"` (it is used that way in `app/(tabs)/community.tsx`), that `colors.violet` and the `bg-lavender` class exist (both are used on Home), and that `Text` has a `danger` color. If `danger` is missing, use the color the other screens use for errors (search `color="` in `app/prayer/night.tsx`).

Append to `apps/mobile/src/features/prayer/index.ts`:

```ts
export { MidnightPrayerCard } from './MidnightPrayerCard';
```

- [ ] **Step 2: Place it on Home**

In `apps/mobile/app/(tabs)/index.tsx`, add `MidnightPrayerCard` to the `@/features/prayer` import. Then insert `<MidnightPrayerCard />` straight after the greeting row's closing `</View>` and before the `{/* Today's promise on the sunrise. */}` comment.

- [ ] **Step 3: Typecheck and test**

Run: `cd apps/mobile && npx tsc --noEmit -p . && npx jest`
Expected: no type errors; all suites PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/prayer/MidnightPrayerCard.tsx apps/mobile/src/features/prayer/index.ts "apps/mobile/app/(tabs)/index.tsx"
git commit -m "midnight prayer: Home card"
```

---

### Task 7: Calendar and admin screens

**Files:**
- Create: `apps/mobile/app/prayer/midnight.tsx`, `apps/mobile/app/prayer/midnight-assign.tsx`, `apps/mobile/app/prayer/midnight-rotation.tsx`
- Modify: `apps/mobile/app/_layout.tsx`

**Interfaces:**
- Consumes: `useMidnightMonth`, `useMidnightTonight`, `dayLabel`, `midnightService`, `useMembers()` (returns `{ members: Member[], isAdmin, … }`, with `Member = { userId, displayName, status, … }`), `goBackOr(router, fallback)` from `@/lib/navigation`, and `Button`/`Card`/`Screen`/`Text` from `@/ui`.
- Produces: routes `/prayer/midnight`, `/prayer/midnight-assign?day=…`, `/prayer/midnight-rotation`.

- [ ] **Step 1: Calendar screen**

The screen first learns today's month from `useMidnightTonight`, then renders a `MonthList` for the month being viewed. That way `useMidnightMonth` is only ever called with a real month key.

```tsx
// apps/mobile/app/prayer/midnight.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { dayLabel, useMidnightMonth, useMidnightTonight } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

/** The month's midnight prayer: who prays each night, and who has prayed. Admins can change it. */
export default function MidnightCalendarScreen() {
  const { data: tonight, error } = useMidnightTonight(midnightService);
  const [showNext, setShowNext] = useState(false);
  if (!tonight) {
    return (
      <Screen edges={['bottom']} className="pt-5">
        {error ? <Text variant="caption">{error}</Text> : null}
      </Screen>
    );
  }
  const thisMonth = tonight.today.slice(0, 7);
  return <MonthList key={showNext ? 'next' : 'this'} thisMonth={thisMonth} today={tonight.today} showNext={showNext} onShowNext={setShowNext} />;
}

function MonthList({ thisMonth, today, showNext, onShowNext }: { thisMonth: string; today: string; showNext: boolean; onShowNext: (next: boolean) => void }) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const { data: current, error, refresh } = useMidnightMonth(midnightService, thisMonth);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const nextMonth = current?.nextMonth ?? null;

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-5">
      <Text variant="muted">{t('midnight.intro')}</Text>
      {nextMonth ? (
        <View className="flex-row gap-2">
          <Button title={t('midnight.thisMonth')} size="compact" variant={showNext ? 'secondary' : undefined} className="flex-1" onPress={() => onShowNext(false)} />
          <Button title={t('midnight.nextMonth')} size="compact" variant={showNext ? undefined : 'secondary'} className="flex-1" onPress={() => onShowNext(true)} />
        </View>
      ) : null}
      {isAdmin ? <Button title={t('midnight.rotation')} variant="secondary" onPress={() => router.push('/prayer/midnight-rotation')} /> : null}
      {error ? <Text variant="caption">{error}</Text> : null}
      {showNext && nextMonth ? (
        <Nights month={nextMonth} today={today} me={user?.id ?? null} isAdmin={isAdmin} locale={locale} />
      ) : current ? (
        <NightRows nights={current.nights} today={today} me={user?.id ?? null} isAdmin={isAdmin} locale={locale} />
      ) : null}
    </Screen>
  );
}

/** The next month, loaded only once the server has said it can be opened. */
function Nights({ month, ...rest }: { month: string; today: string; me: string | null; isAdmin: boolean; locale: string }) {
  const { data } = useMidnightMonth(midnightService, month);
  return data ? <NightRows nights={data.nights} {...rest} /> : null;
}

function NightRows({ nights, today, me, isAdmin, locale }: { nights: { day: string; userId: string; name: string; prayed: boolean }[]; today: string; me: string | null; isAdmin: boolean; locale: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  if (!nights.length) return <Text variant="muted">{t('midnight.empty')}</Text>;
  return (
    <Card className="gap-0 p-0">
      {nights.map((night, index) => {
        const isTonight = night.day === today;
        const editable = isAdmin && night.day >= today;
        return (
          <Pressable
            key={night.day}
            disabled={!editable}
            accessibilityRole={editable ? 'button' : undefined}
            onPress={() => router.push({ pathname: '/prayer/midnight-assign', params: { day: night.day } })}
            className={`flex-row items-center gap-3 px-4 py-3 ${index ? 'border-t border-border' : ''} ${isTonight ? 'bg-lavender' : ''}`}
          >
            <Text variant="caption" className="w-28">
              {isTonight ? t('midnight.tonight') : dayLabel(night.day, locale)}
            </Text>
            <Text variant="label" className={`flex-1 text-[15px] ${night.userId === me ? 'text-primary' : ''}`} numberOfLines={1}>
              {night.name}
            </Text>
            {night.prayed ? <Ionicons name="checkmark-circle" size={20} color={colors.leaf} /> : null}
            {editable ? <Ionicons name="chevron-forward" size={16} color={colors.violet} /> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}
```

Check that `Button` accepts `variant="secondary"`, `size="compact"` and `className` (all three are used in `app/(tabs)/community.tsx`). Leaving `variant` undefined gives the default filled button.

- [ ] **Step 2: Admin: assign a night**

```tsx
// apps/mobile/app/prayer/midnight-assign.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useMembers } from '@/features/members';
import { dayLabel, useMidnightMonth } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';

/** Admin: choose who prays on one night. */
export default function MidnightAssignScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { day } = useLocalSearchParams<{ day: string }>();
  const { members } = useMembers();
  const { refresh } = useMidnightMonth(midnightService, (day ?? '').slice(0, 7));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(userId: string) {
    if (!day || busy) return;
    setBusy(true);
    setError(null);
    try {
      await midnightService.reassign(day, userId);
      await refresh();
      goBackOr(router, '/prayer/midnight');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('midnight.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-5">
      <Text variant="label">{day ? dayLabel(day, locale) : ''}</Text>
      {error ? <Text variant="caption">{error}</Text> : null}
      <Card className="gap-0 p-0">
        {members
          .filter((m) => m.status === 'active')
          .map((m, index) => (
            <Pressable key={m.userId} accessibilityRole="button" onPress={() => pick(m.userId)} className={`flex-row items-center px-4 py-3.5 ${index ? 'border-t border-border' : ''}`}>
              <Text variant="label" className="flex-1 text-[15px]">
                {m.displayName}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.violet} />
            </Pressable>
          ))}
      </Card>
    </Screen>
  );
}
```

- [ ] **Step 3: Admin: rotation**

Like the calendar, this loads today's month first and only then the month's rotation.

```tsx
// apps/mobile/app/prayer/midnight-rotation.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useMembers } from '@/features/members';
import { useMidnightMonth, useMidnightTonight } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

/** Admin: who takes turns at the midnight prayer. */
export default function MidnightRotationScreen() {
  const { data: tonight, refresh: refreshTonight } = useMidnightTonight(midnightService);
  if (!tonight) return <Screen edges={['bottom']} className="pt-5" />;
  return <RotationForm month={tonight.today.slice(0, 7)} onSaved={refreshTonight} />;
}

function RotationForm({ month, onSaved }: { month: string; onSaved: () => Promise<unknown> | void }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { members } = useMembers();
  const { data, refresh } = useMidnightMonth(midnightService, month);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const selected = chosen ?? data?.rotation.map((r) => r.userId) ?? [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(userId: string) {
    setChosen(selected.includes(userId) ? selected.filter((id) => id !== userId) : [...selected, userId]);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await midnightService.setRotation(selected);
      await Promise.all([refresh(), onSaved()]);
      goBackOr(router, '/prayer/midnight');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('midnight.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-5">
      <Text variant="muted">{t('midnight.rotationIntro')}</Text>
      <Card className="gap-0 p-0">
        {members
          .filter((m) => m.status === 'active')
          .map((m, index) => {
            const on = selected.includes(m.userId);
            return (
              <Pressable key={m.userId} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(m.userId)} className={`flex-row items-center px-4 py-3.5 ${index ? 'border-t border-border' : ''}`}>
                <Text variant="label" className="flex-1 text-[15px]">
                  {m.displayName}
                </Text>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={colors.violet} />
              </Pressable>
            );
          })}
      </Card>
      {error ? <Text variant="caption">{error}</Text> : null}
      {/* Saving before the rotation has loaded would empty it. */}
      <Button title={t('common.save')} onPress={save} loading={busy} disabled={busy || !data} />
    </Screen>
  );
}
```

- [ ] **Step 4: Register the routes**

In `apps/mobile/app/_layout.tsx`, after the `prayer/order` line, add:

```tsx
        <Stack.Screen name="prayer/midnight" options={{ ...cardOptions, title: t('midnight.title') }} />
        <Stack.Screen name="prayer/midnight-assign" options={{ ...modalOptions, title: t('midnight.assignTitle') }} />
        <Stack.Screen name="prayer/midnight-rotation" options={{ ...modalOptions, title: t('midnight.rotation') }} />
```

These must come before `prayer/[id]` so the dynamic route does not capture them.

- [ ] **Step 5: Typecheck, test and commit**

Run: `cd apps/mobile && npx tsc --noEmit -p . && npx jest`
Expected: no type errors; all suites PASS.

```bash
git add apps/mobile/app/prayer/midnight.tsx apps/mobile/app/prayer/midnight-assign.tsx apps/mobile/app/prayer/midnight-rotation.tsx apps/mobile/app/_layout.tsx
git commit -m "midnight prayer: monthly calendar, reassign and rotation screens"
```

---

### Task 8: Check it end to end

**Files:** none (verification only)

- [ ] **Step 1: Run every test**

Run: `cd backend && npx jest && cd ../apps/mobile && npx jest && npx tsc --noEmit -p .`
Expected: everything PASS, no type errors.

- [ ] **Step 2: Run the app on the simulator**

Start Metro on port 8083, because 8081 is often taken by another project: `cd apps/mobile && npx expo start --dev-client --port 8083`. Then:

`xcrun simctl launch booted com.prayerwarriors.app --initialUrl "exp+prayer-warriors://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8083"`

Sign in as a rotation member. Expected:
- The Home card shows tonight's person, and "Your next night: …" for someone in the rotation.
- Tapping it opens the calendar for the whole month with names.
- As Shiny (admin): the Rotation button and tappable future nights both appear.

Take a screenshot with `xcrun simctl io booted screenshot <scratchpad>/midnight.png` and look at it.

- [ ] **Step 3: Check the data**

```bash
set -a; . backend/.env; set +a
curl -s -G "$PARSE_SERVER_URL/classes/MidnightNight" -H "X-Parse-Application-Id: $PARSE_APP_ID" -H "X-Parse-Master-Key: $PARSE_MASTER_KEY" --data-urlencode 'count=1' --data-urlencode 'limit=0'
```

Expected: `"count": 31` (October) after the first open. That rises to 61 once anyone opens it from 20 Oct, when November is created too.

- [ ] **Step 4: Push** (after the user says so)

```bash
git push origin main
```
