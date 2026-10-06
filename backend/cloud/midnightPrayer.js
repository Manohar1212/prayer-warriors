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

const MAX_ROTATION = 20;
const NEXT_MONTH_FROM = 20;
const PRAYED_FROM_HOUR = 23;
const REMIND_FROM_HOUR = 21;
const NUDGE_FROM_HOUR = 12;
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

  /** The rotation without anyone who has since left the group. */
  async function activeRotation(groupId) {
    const rotation = await rotations.get(groupId);
    const active = await Promise.all(rotation.map((id) => memberships.isActiveMember(id, groupId)));
    return rotation.filter((_id, i) => active[i]);
  }

  /**
   * The month's nights, planned and saved the first time anyone asks. A month left part-saved
   * (a create that failed half way) is completed from the same plan, keeping the rows it has.
   */
  async function ensureMonth(groupId, month) {
    const existing = await dedupe(await nights.listMonth(groupId, month));
    if (existing.length >= daysOfMonth(month).length) return existing;
    const rotation = await activeRotation(groupId);
    if (!rotation.length) return existing;
    const before = await nights.findLastBefore(groupId, `${month}-01`);
    const plan = planMonth({ month, rotation, lastPersonBefore: before ? before.userId : null, random: seededRandom(`${groupId}:${month}`) });
    const have = new Set(existing.map((r) => r.day));
    await nights.createMany(plan.filter((p) => !have.has(p.day)).map((p) => ({ groupId, month, ...p })));
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

  /** Hands every coming night that `belongs` says is orphaned to `rotation`; with no rotation, removes the coming nights. */
  async function handOver(groupId, rotation, today, belongs) {
    const upcoming = await nights.listFrom(groupId, today);
    const orphaned = upcoming.filter(belongs);
    if (!orphaned.length) return;
    if (!rotation.length) await nights.remove(upcoming.map((r) => r.id));
    else await redistribute(groupId, orphaned, rotation, today);
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
      // Same person: nothing changes, so their prayed mark and reminders stay.
      if (row.userId === userId) return nightView(row, await namesFor([userId]));
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
      const today = istNow(now()).day;
      const changed = before.length !== ids.length || ids.some((id) => !before.includes(id));
      // Next month may be planned already (from the 20th) but has not begun, so plan it afresh
      // with the new list; getMidnightMonth/getMidnightTonight do that when it is next opened.
      const upcomingMonth = nextMonth(today.slice(0, 7));
      if (changed && `${upcomingMonth}-01` > today) {
        const planned = await nights.listMonth(groupId, upcomingMonth);
        if (planned.length) await nights.remove(planned.map((r) => r.id));
      }
      // Coming nights of someone taken off the list, or of someone no longer in the group, so saving
      // again repairs a half-done change. Nights given by hand to an active member stay put.
      const upcoming = await nights.listFrom(groupId, today);
      const gone = new Set();
      for (const userId of new Set(upcoming.map((r) => r.userId))) {
        if (!ids.includes(userId) && !before.includes(userId) && !(await memberships.isActiveMember(userId, groupId))) gone.add(userId);
      }
      await handOver(
        groupId,
        ids,
        today,
        (r) => !ids.length || (!ids.includes(r.userId) && (before.includes(r.userId) || gone.has(r.userId))),
      );
      const name = await namesFor(ids);
      return { rotation: ids.map((userId) => ({ userId, name: name(userId) })) };
    },

    /**
     * A member left the group (called by removeMember, not a Cloud function): out of the
     * rotation, and their coming nights - including any given to them by hand - go to the rest.
     */
    async dropMember(groupId, userId) {
      const before = await rotations.get(groupId);
      const rotation = before.filter((id) => id !== userId);
      const emptied = before.length > 0 && rotation.length === 0;
      if (rotation.length !== before.length) await rotations.set(groupId, rotation);
      await handOver(groupId, rotation, istNow(now()).day, (r) => emptied || r.userId === userId);
    },

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
  };
}

module.exports = { istNow, addDays, daysOfMonth, nextMonth, seededRandom, planMonth, createMidnightPrayerHandlers, MESSAGES };
