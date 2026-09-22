'use strict';

const { monthKeyFor } = require('./prayerPoints');

/**
 * The monthly all-night prayer. An admin schedules one date and time per month; the group is
 * told at once, and in the last seven days everyone gets a reminder each day.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = 7;
const NOTICE_DAYS = 14;
const CALL_TITLE = 'All-night prayer';
const ORDER_MAX_ITEMS = 30;
const ORDER_MAX_LENGTH = 120;

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  adminOnly: 'Only an admin can schedule the all-night prayer.',
  invalidDate: 'Choose a date and time.',
  inPast: 'Pick a date and time that is still ahead.',
  notFound: 'That prayer night is not on the calendar.',
  noteTooLong: 'Keep the note under 300 characters.',
  adminOnlyOrder: 'Only an admin can change the order of the night.',
  orderTooLong: `Keep the order to ${ORDER_MAX_ITEMS} steps of up to ${ORDER_MAX_LENGTH} characters each.`,
};

function fail(message) {
  return new Error(message);
}

/** "2026-10-03" for the instant in India. */
function dayKeyFor(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Whole days from now until the prayer night, by Indian calendar day (today = 0). */
function daysUntil(scheduledAt, now) {
  const [y1, m1, d1] = dayKeyFor(now).split('-').map(Number);
  const [y2, m2, d2] = dayKeyFor(scheduledAt).split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
}

function view(night, now) {
  const scheduledAt = new Date(night.scheduledAt);
  const days = daysUntil(scheduledAt, now);
  return {
    id: night.id,
    month: night.month,
    scheduledAt: scheduledAt.toISOString(),
    note: night.note || '',
    /** The group call scheduled for the same time, so members can join from the prayer card. */
    callId: night.callId || null,
    daysUntil: days,
    /** True while the daily reminders are running (the last week, including the day itself). */
    reminding: days >= 0 && days <= REMINDER_DAYS,
  };
}

function createPrayerNightHandlers({ memberships, nights, groups = null, calls = null, notify = async () => undefined, now = () => new Date() }) {
  /** Keeps one group call on the calendar at the night's time: moved with it, cancelled with it. */
  async function syncCall(night, { groupId, scheduledAt, createdById, cancel = false }) {
    if (!calls) return night.callId || null;
    const existing = night.callId ? await calls.get(night.callId) : null;
    const open = existing && existing.status === 'scheduled';
    if (cancel) {
      if (open) await calls.update(existing.id, { status: 'cancelled' });
      return night.callId || null;
    }
    if (open) {
      await calls.update(existing.id, { scheduledAt, title: CALL_TITLE });
      return existing.id;
    }
    const created = await calls.create({ groupId, title: CALL_TITLE, scheduledAt, status: 'scheduled', createdById });
    return created.id;
  }

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

  /**
   * Sends today's reminder for a night in its last week, once per day, no matter which member's
   * app or which scheduled job asked. Returns true when a reminder went out.
   */
  async function remindIfDue(night) {
    const today = dayKeyFor(now());
    const days = daysUntil(new Date(night.scheduledAt), now());
    if (days < 0 || days > REMINDER_DAYS || night.lastReminderDay === today) return false;
    await nights.update(night.id, { lastReminderDay: today });
    await notify({ type: 'prayerNightReminder', groupId: night.groupId, actorId: null, nightId: night.id, scheduledAt: night.scheduledAt, daysUntil: days, note: night.note || '', inboxOnly: true });
    return true;
  }

  return {
    MESSAGES,

    /** The next all-night prayer, or null. Also sends the day's reminder when one is due. */
    async getPrayerNight(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const night = await nights.findUpcoming(groupId, new Date(now().getTime() - 12 * 60 * 60 * 1000));
      if (!night) return null;
      await remindIfDue(night);
      return view(night, now());
    },

    /** Admin: set (or move) the all-night prayer for the month of the chosen date, and announce it. */
    async schedulePrayerNight({ scheduledAt, note } = {}, { callerId } = {}) {
      const groupId = await requireAdmin(callerId);
      const at = typeof scheduledAt === 'string' ? new Date(scheduledAt) : null;
      if (!at || Number.isNaN(at.getTime())) throw fail(MESSAGES.invalidDate);
      if (at.getTime() <= now().getTime()) throw fail(MESSAGES.inPast);
      const cleanNote = typeof note === 'string' ? note.trim() : '';
      if (cleanNote.length > 300) throw fail(MESSAGES.noteTooLong);
      const month = monthKeyFor(at);
      const existing = await nights.findByMonth(groupId, month);
      const callId = await syncCall(existing || {}, { groupId, scheduledAt: at, createdById: callerId });
      const saved = existing
        ? // A new date is a new night: its picks must clear again once it is over.
          await nights.update(existing.id, { scheduledAt: at, note: cleanNote, cancelledAt: null, lastReminderDay: '', callId, pointsResetAt: null })
        : await nights.create({ groupId, month, scheduledAt: at, note: cleanNote, createdById: callerId, callId });
      const days = daysUntil(at, now());
      await notify({ type: existing ? 'prayerNightMoved' : 'prayerNight', groupId, actorId: callerId, nightId: saved.id, scheduledAt: at.toISOString(), daysUntil: days, note: cleanNote });
      return { ...view(saved, now()), shortNotice: days < NOTICE_DAYS };
    },

    /** Admin: take the night off the calendar. */
    async cancelPrayerNight({ nightId } = {}, { callerId } = {}) {
      const groupId = await requireAdmin(callerId);
      const night = nightId ? await nights.get(nightId) : null;
      if (!night || night.groupId !== groupId || night.cancelledAt) throw fail(MESSAGES.notFound);
      await syncCall(night, { groupId, cancel: true });
      await nights.update(night.id, { cancelledAt: now() });
      await notify({ type: 'prayerNightCancelled', groupId, actorId: callerId, nightId: night.id, scheduledAt: new Date(night.scheduledAt).toISOString() });
      return { cancelled: true };
    },

    /** The steps of the night (songs, worship, testimonies, ...), the same every month. */
    async getNightOrder(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      return { items: (await groups.getNightOrder(groupId)) || [] };
    },

    /** Admin: replace the steps of the night; blank lines are dropped. */
    async setNightOrder({ items } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      if ((await memberships.findAdminGroupId(callerId)) !== groupId) throw fail(MESSAGES.adminOnlyOrder);
      const clean = (Array.isArray(items) ? items : []).filter((i) => typeof i === 'string').map((i) => i.trim()).filter(Boolean);
      if (clean.length > ORDER_MAX_ITEMS || clean.some((i) => i.length > ORDER_MAX_LENGTH)) throw fail(MESSAGES.orderTooLong);
      await groups.setNightOrder(groupId, clean);
      return { items: clean };
    },

    /** For a daily Cloud Job: send the reminder for every group's night in its last week. */
    async sendDueReminders() {
      const upcoming = await nights.listUpcoming(now());
      let sent = 0;
      for (const night of upcoming) if (await remindIfDue(night)) sent += 1;
      return { checked: upcoming.length, sent };
    },
  };
}

module.exports = { createPrayerNightHandlers, daysUntil, dayKeyFor, MESSAGES, REMINDER_DAYS, NOTICE_DAYS };
