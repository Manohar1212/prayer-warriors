'use strict';

/**
 * Daily Bible quiz: three questions a day, the same three for everyone, chosen by the date.
 * Answers are scored here so the app never sees which option is right before answering, and
 * one result per member per day feeds the overall leaderboard.
 */

const PER_DAY = 3;

const MESSAGES = {
  notMember: "You're not a member of this group yet.",
  wrongDay: "That quiz is not today's quiz.",
  alreadyPlayed: "You've already played today's quiz.",
  badAnswers: 'Answer all three questions first.',
};

function fail(message) {
  return new Error(message);
}

/** "2026-09-17" for the given instant in India, where the group lives. */
function dayKeyFor(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Days since 1 Jan 2026 for a day key; drives which three questions a day gets. */
function dayIndexFor(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 86400000);
}

function questionsForDay(bank, dayKey) {
  const start = ((dayIndexFor(dayKey) * PER_DAY) % bank.length + bank.length) % bank.length;
  return Array.from({ length: PER_DAY }, (_, i) => bank[(start + i) % bank.length]);
}

function publicQuestion(q) {
  return { id: q.id, en: q.en, te: q.te };
}

function monthOf(dayKey) {
  return dayKey.slice(0, 7);
}

function shiftMonth(monthKey, by) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Streaks over a set of played days (keys), all within one month.
 * `current` is the run that reaches `today` (or yesterday, when today is still unplayed);
 * `best` is the longest run in the month. For a month already over, `current` is the run
 * that reached the month's last played day.
 */
function streaksFor(days, today) {
  const idx = [...new Set(days)].map(dayIndexFor).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = null;
  for (const i of idx) {
    run = prev !== null && i === prev + 1 ? run + 1 : 1;
    prev = i;
    if (run > best) best = run;
  }
  const last = idx.length ? idx[idx.length - 1] : null;
  const todayIdx = dayIndexFor(today);
  const sameMonth = days.length && monthOf(days[0]) === monthOf(today);
  const alive = last !== null && (!sameMonth || last === todayIdx || last === todayIdx - 1);
  return { current: alive ? run : 0, best };
}

function createQuizHandlers({ memberships, results, bank, now = () => new Date() }) {
  async function requireGroup(callerId) {
    const groupId = callerId ? await memberships.findGroupId(callerId) : null;
    if (!groupId) throw fail(MESSAGES.notMember);
    return groupId;
  }

  return {
    MESSAGES,

    /** Today's questions (without answers) and the caller's result if they already played. */
    async getDailyQuiz(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const day = dayKeyFor(now());
      const questions = questionsForDay(bank, day);
      const mine = await results.find(callerId, day);
      const played = await results.listForUser(callerId, monthOf(day));
      return {
        day,
        questions: questions.map(publicQuestion),
        result: mine ? { score: mine.score, answers: mine.answers, correct: questions.map((q) => q.answer) } : null,
        streak: streaksFor(played.map((r) => r.day), day).current,
        groupId,
      };
    },

    async submitQuiz({ day, answers } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const today = dayKeyFor(now());
      if (day !== today) throw fail(MESSAGES.wrongDay);
      if (!Array.isArray(answers) || answers.length !== PER_DAY || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3)) throw fail(MESSAGES.badAnswers);
      if (await results.find(callerId, today)) throw fail(MESSAGES.alreadyPlayed);
      const questions = questionsForDay(bank, today);
      const correct = questions.map((q) => q.answer);
      const score = answers.reduce((sum, a, i) => sum + (a === correct[i] ? 1 : 0), 0);
      const saved = await results.create({ groupId, userId: callerId, day: today, score, answers });
      return { day: today, score, correct, id: saved.id };
    },

    /**
     * One month's board, ranked by streak. The board starts fresh each month (India time);
     * earlier months stay readable as history. Ties: longer best streak, then points, then name.
     */
    async getQuizLeaderboard({ month } = {}, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const today = dayKeyFor(now());
      const thisMonth = monthOf(today);
      const wanted = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) && month <= thisMonth ? month : thisMonth;
      const playedDays = await results.listDays(groupId);
      const months = [...new Set([thisMonth, ...playedDays.map(monthOf)])].sort().reverse();
      const rows = await results.listForMonth(groupId, wanted);
      const byUser = new Map();
      for (const r of rows) {
        const entry = byUser.get(r.userId) || { userId: r.userId, userName: r.userName, days: [], points: 0, today: null };
        entry.days.push(r.day);
        entry.points += r.score;
        if (r.day === today) entry.today = r.score;
        byUser.set(r.userId, entry);
      }
      const entries = [...byUser.values()]
        .map((e) => {
          const { current, best } = streaksFor(e.days, today);
          return { userId: e.userId, userName: e.userName, streak: current, best, points: e.points, days: e.days.length, today: e.today, me: e.userId === callerId };
        })
        .sort((a, b) => b.streak - a.streak || b.best - a.best || b.points - a.points || String(a.userName).localeCompare(String(b.userName)))
        .map((e, i) => ({ ...e, rank: i + 1 }));
      return { month: wanted, months, current: wanted === thisMonth, resetsOn: `${shiftMonth(thisMonth, 1)}-01`, daysInMonth: daysIn(wanted), entries };
    },
  };
}

function daysIn(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

module.exports = { createQuizHandlers, dayKeyFor, dayIndexFor, questionsForDay, streaksFor, MESSAGES, PER_DAY };
