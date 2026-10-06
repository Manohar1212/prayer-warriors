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
