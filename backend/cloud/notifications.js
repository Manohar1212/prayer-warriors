'use strict';

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  invalidToken: "That push token isn't valid.",
  invalidPrefs: 'Choose on or off for each notification type.',
};

const PREF_KEYS = ['prayer', 'praying', 'answered', 'calls', 'resources', 'funds', 'midnight'];
const DEFAULT_PREFS = Object.freeze(Object.fromEntries(PREF_KEYS.map((k) => [k, true])));
const PUSH_BATCH = 100;
const EXPO_TOKEN = /^ExponentPushToken\[[^\]\s]+\]$/;
const PLATFORMS = ['ios', 'android'];
const TIME_ZONE = 'Asia/Kolkata';

function fail(message) {
  return new Error(message);
}

function groupIndian(digits) {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** ₹ with Indian grouping; paise only when non-zero (mirrors the app's formatter). */
function rupees(paise) {
  const abs = Math.abs(Math.round(paise || 0));
  const whole = groupIndian(String(Math.floor(abs / 100)));
  const rest = abs % 100;
  return rest === 0 ? `₹${whole}` : `₹${whole}.${String(rest).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Calendar fields of an instant in the group's time zone, independent of the runtime's ICU data. */
function localParts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (type) => (parts.find((p) => p.type === type) || {}).value;
  const hour = Number(get('hour')) % 24;
  return { weekday: WEEKDAYS.indexOf(get('weekday')), day: Number(get('day')), month: Number(get('month')) - 1, year: Number(get('year')), hour, minute: get('minute') };
}

function shortDate(iso) {
  const p = localParts(iso);
  return p ? `${p.day} ${MONTHS[p.month]} ${p.year}` : '';
}

function dayTime(iso) {
  const p = localParts(iso);
  if (!p) return '';
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const suffix = p.hour < 12 ? 'am' : 'pm';
  return `${WEEKDAYS[p.weekday]} ${p.day} ${MONTHS[p.month]}, ${h12}:${p.minute} ${suffix}`;
}

function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function clip(s, max) {
  const text = typeof s === 'string' ? s.trim() : '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Title, body, route and the preference key that gates an event. */
function buildMessage(event, actorName) {
  const actor = actorName && actorName.trim() ? actorName.trim() : 'A member';
  const title = clip(event.title, 120);
  switch (event.type) {
    case 'prayerRequest':
      return { title: 'New prayer request', body: `${actor}: ${title}`, route: `/prayer/${event.requestId}`, pref: 'prayer' };
    case 'praying':
      return { title: `${actor} is praying for you`, body: title, route: `/prayer/${event.requestId}`, pref: 'praying' };
    case 'answered':
      return { title: 'Prayer answered', body: title, route: `/prayer/${event.requestId}`, pref: 'answered' };
    case 'comment':
      return { title: `${actor} commented on your request`, body: clip(event.body, 120) || title, route: `/prayer/${event.requestId}`, pref: 'praying' };
    case 'callScheduled':
      return { title: 'Group call scheduled', body: `${title} · ${dayTime(event.scheduledAt)}`, route: `/calls/${event.callId}`, pref: 'calls' };
    case 'callStarted':
      return { title: `${actor} started the call`, body: `${title} — join now`, route: `/calls/${event.callId}`, pref: 'calls' };
    case 'callCancelled':
      return { title: 'Call cancelled', body: title, route: '/(tabs)/community', pref: 'calls' };
    case 'prayerNight':
      return { title: 'All-night prayer announced', body: `${dayTime(event.scheduledAt)}${event.note ? ` · ${clip(event.note, 80)}` : ''}`, route: '/(tabs)/prayer?tab=monthly', pref: 'prayer' };
    case 'prayerNightMoved':
      return { title: 'All-night prayer rescheduled', body: `Now ${dayTime(event.scheduledAt)}`, route: '/(tabs)/prayer?tab=monthly', pref: 'prayer' };
    case 'prayerNightCancelled':
      return { title: 'All-night prayer cancelled', body: dayTime(event.scheduledAt), route: '/(tabs)/prayer?tab=monthly', pref: 'prayer' };
    case 'prayerNightReminder': {
      const when = event.daysUntil === 0 ? 'All-night prayer is tonight' : event.daysUntil === 1 ? 'All-night prayer is tomorrow' : `All-night prayer in ${event.daysUntil} days`;
      return { title: when, body: `${dayTime(event.scheduledAt)} · Pick your prayer point and come ready`, route: '/(tabs)/prayer?tab=monthly', pref: 'prayer' };
    }
    case 'resource':
      return { title: `New ${event.resourceType} shared`, body: title, route: `/resources/${event.resourceId}`, pref: 'resources' };
    case 'contribution':
      return { title: 'Contribution recorded', body: `${rupees(event.amountPaise)} on ${shortDate(event.transactionDate)}`, route: '/(tabs)/funds', pref: 'funds' };
    case 'expense':
      return { title: 'Expense recorded', body: `${capitalise(event.category)}: ${rupees(event.amountPaise)}`, route: '/(tabs)/funds', pref: 'funds' };
    case 'midnightReminder':
      return { title: 'Your midnight prayer', body: 'Tonight at 12:00 AM is your night to pray for the group.', route: '/prayer/midnight', pref: 'midnight' };
    case 'midnightNudge':
      return { title: 'Did you pray last night?', body: 'Tap to mark your midnight prayer.', route: '/prayer/midnight', pref: 'midnight' };
    default:
      throw new Error(`Unknown notification event: ${event.type}`);
  }
}

function prefsOf(user) {
  return { ...DEFAULT_PREFS, ...((user && user.notificationPrefs) || {}) };
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Turns a domain event into inbox rows and Expo push messages. Never throws: the action that
 * produced the event has already succeeded, so failures here are logged and dropped.
 */
function createNotifier({ members, users, inbox, tokens, push, log = (m) => console.error(m) }) {
  async function targets(event) {
    if (event.type === 'praying' || event.type === 'comment') return [event.authorId];
    if (event.type === 'contribution') return [event.memberId];
    if (event.type === 'midnightReminder' || event.type === 'midnightNudge') return [event.userId];
    return members.listActiveUserIds(event.groupId);
  }

  async function run(event) {
    const candidateIds = (await targets(event)).filter((id) => id && id !== event.actorId);
    if (!candidateIds.length) return;
    const people = await users.findMany([...new Set([event.actorId, ...candidateIds])].filter(Boolean));
    const byId = new Map(people.map((u) => [u.id, u]));
    const actor = byId.get(event.actorId);
    const message = buildMessage(event, actor ? actor.displayName : null);
    const recipientIds = candidateIds.filter((id) => prefsOf(byId.get(id))[message.pref] !== false);
    if (!recipientIds.length) return;

    await inbox.createMany(
      recipientIds.map((recipientId) => ({
        groupId: event.groupId,
        recipientId,
        actorId: event.actorId || null,
        type: event.type,
        title: message.title,
        body: message.body,
        route: message.route,
      })),
    );

    // Daily reminders also ring locally on each phone, so they go to the inbox only.
    if (event.inboxOnly) return;
    const deviceTokens = await tokens.forUsers(recipientIds);
    if (!deviceTokens.length) return;
    const payloads = deviceTokens.map(({ token }) => ({
      to: token,
      title: message.title,
      body: message.body,
      data: { route: message.route, type: event.type },
      sound: 'default',
      channelId: 'default',
      priority: 'high',
    }));
    for (const batch of chunk(payloads, PUSH_BATCH)) {
      const tickets = (await push.send(batch)) || [];
      await Promise.all(
        tickets.map((ticket, i) => {
          const gone = ticket && ticket.status === 'error' && ticket.details && ticket.details.error === 'DeviceNotRegistered';
          return gone && batch[i] ? tokens.remove(batch[i].to) : null;
        }),
      );
    }
  }

  return {
    async notify(event) {
      try {
        await run(event);
      } catch (err) {
        log(`notify(${event && event.type}) failed: ${err && err.message ? err.message : err}`);
      }
    },
  };
}

function createNotificationHandlers({ memberships, inbox, tokens, users }) {
  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  return {
    async registerPushToken({ token, platform, deviceName } = {}, { callerId } = {}) {
      await requireGroup(callerId);
      if (typeof token !== 'string' || !EXPO_TOKEN.test(token)) throw fail(MESSAGES.invalidToken);
      await tokens.upsert({
        userId: callerId,
        token,
        platform: PLATFORMS.includes(platform) ? platform : 'unknown',
        deviceName: clip(deviceName, 80) || '',
      });
      return { registered: true };
    },

    async unregisterPushToken({ token } = {}, { callerId } = {}) {
      await requireGroup(callerId);
      if (typeof token === 'string' && token) await tokens.removeForUser(callerId, token);
      return { unregistered: true };
    },

    async markNotificationsRead({ ids } = {}, { callerId } = {}) {
      await requireGroup(callerId);
      const clean = Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && id) : [];
      const updated = clean.length ? await inbox.markRead(callerId, clean) : 0;
      return { updated };
    },

    async markAllNotificationsRead(_params, { callerId } = {}) {
      await requireGroup(callerId);
      return { updated: await inbox.markAllRead(callerId) };
    },

    /** Empties the caller's own inbox; nobody else's notifications are touched. */
    async clearNotifications(_params, { callerId } = {}) {
      await requireGroup(callerId);
      return { removed: await inbox.clearFor(callerId) };
    },

    async updateNotificationPrefs(prefs, { callerId } = {}) {
      await requireGroup(callerId);
      if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) throw fail(MESSAGES.invalidPrefs);
      const entries = Object.entries(prefs);
      if (entries.some(([key, value]) => !PREF_KEYS.includes(key) || typeof value !== 'boolean')) throw fail(MESSAGES.invalidPrefs);
      const stored = (await users.getPrefs(callerId)) || {};
      const merged = { ...DEFAULT_PREFS, ...stored, ...Object.fromEntries(entries) };
      await users.setPrefs(callerId, merged);
      return merged;
    },
  };
}

module.exports = { createNotifier, createNotificationHandlers, buildMessage, MESSAGES, DEFAULT_PREFS, PREF_KEYS };
