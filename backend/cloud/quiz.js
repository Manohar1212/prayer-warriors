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
      return {
        day,
        questions: questions.map(publicQuestion),
        result: mine ? { score: mine.score, answers: mine.answers, correct: questions.map((q) => q.answer) } : null,
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

    /** Everyone's totals, best first; ties broken by fewer days played (better accuracy), then name. */
    async getQuizLeaderboard(_params, { callerId } = {}) {
      const groupId = await requireGroup(callerId);
      const today = dayKeyFor(now());
      const rows = await results.listForGroup(groupId);
      const byUser = new Map();
      for (const r of rows) {
        const entry = byUser.get(r.userId) || { userId: r.userId, userName: r.userName, total: 0, days: 0, today: null, perfect: 0 };
        entry.total += r.score;
        entry.days += 1;
        if (r.score === PER_DAY) entry.perfect += 1;
        if (r.day === today) entry.today = r.score;
        byUser.set(r.userId, entry);
      }
      return [...byUser.values()]
        .sort((a, b) => b.total - a.total || a.days - b.days || String(a.userName).localeCompare(String(b.userName)))
        .map((e, i) => ({ ...e, rank: i + 1, me: e.userId === callerId }));
    },
  };
}

module.exports = { createQuizHandlers, dayKeyFor, dayIndexFor, questionsForDay, MESSAGES, PER_DAY };
