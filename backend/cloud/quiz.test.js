const { createQuizHandlers, dayKeyFor, questionsForDay, MESSAGES } = require('./quiz');
const { QUESTIONS } = require('./quizQuestions');

const NOW = new Date('2026-09-16T20:30:00.000Z'); // 02:00 on 17 Sept in India
const TODAY = '2026-09-17';
const caller = { callerId: 'u1' };

const bank = Array.from({ length: 7 }, (_, i) => ({ id: `q${i}`, answer: i % 4, en: { q: `Q${i}`, o: ['a', 'b', 'c', 'd'] }, te: { q: `ప${i}`, o: ['అ', 'ఆ', 'ఇ', 'ఈ'] } }));

function deps({ groupId = 'g1', mine = null, rows = [] } = {}) {
  return {
    memberships: { findGroupId: jest.fn(async () => groupId) },
    results: {
      find: jest.fn(async () => mine),
      create: jest.fn(async (fields) => ({ id: 'r-new', ...fields })),
      listForGroup: jest.fn(async () => rows),
    },
    bank,
    now: () => NOW,
  };
}

describe('day helpers', () => {
  it('uses the Indian calendar day', () => {
    expect(dayKeyFor(NOW)).toBe(TODAY);
    expect(dayKeyFor(new Date('2026-09-16T18:00:00.000Z'))).toBe('2026-09-16');
  });

  it('draws three consecutive questions per day and cycles the bank', () => {
    const a = questionsForDay(bank, '2026-01-01').map((q) => q.id);
    const b = questionsForDay(bank, '2026-01-02').map((q) => q.id);
    const c = questionsForDay(bank, '2026-01-03').map((q) => q.id);
    expect(a).toEqual(['q0', 'q1', 'q2']);
    expect(b).toEqual(['q3', 'q4', 'q5']);
    expect(c).toEqual(['q6', 'q0', 'q1']);
  });
});

describe('question bank', () => {
  it('has four options in both languages and a valid answer index', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(60);
    for (const q of QUESTIONS) {
      expect(q.en.o).toHaveLength(4);
      expect(q.te.o).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(3);
      expect(q.en.q.length).toBeGreaterThan(5);
      expect(q.te.q.length).toBeGreaterThan(3);
    }
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
});

describe('getDailyQuiz', () => {
  it('returns today questions without answers', async () => {
    const result = await createQuizHandlers(deps()).getDailyQuiz({}, caller);
    expect(result.day).toBe(TODAY);
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0]).not.toHaveProperty('answer');
    expect(result.questions[0].te.q).toMatch(/ప/);
    expect(result.result).toBeNull();
  });

  it('includes the correct answers once the caller has played', async () => {
    const d = deps({ mine: { score: 2, answers: [0, 1, 2], day: TODAY } });
    const result = await createQuizHandlers(d).getDailyQuiz({}, caller);
    expect(result.result.score).toBe(2);
    expect(result.result.correct).toHaveLength(3);
  });

  it('refuses non-members', async () => {
    await expect(createQuizHandlers(deps({ groupId: null })).getDailyQuiz({}, caller)).rejects.toThrow(MESSAGES.notMember);
  });
});

describe('submitQuiz', () => {
  it('scores against the day questions and saves one result', async () => {
    const d = deps();
    const qs = questionsForDay(bank, TODAY);
    const answers = [qs[0].answer, qs[1].answer, (qs[2].answer + 1) % 4];
    const result = await createQuizHandlers(d).submitQuiz({ day: TODAY, answers }, caller);
    expect(result.score).toBe(2);
    expect(result.correct).toEqual(qs.map((q) => q.answer));
    expect(d.results.create).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u1', day: TODAY, score: 2, answers });
  });

  it('refuses another day, a second attempt, or incomplete answers', async () => {
    const h = createQuizHandlers(deps());
    await expect(h.submitQuiz({ day: '2026-09-16', answers: [0, 0, 0] }, caller)).rejects.toThrow(MESSAGES.wrongDay);
    await expect(h.submitQuiz({ day: TODAY, answers: [0, 0] }, caller)).rejects.toThrow(MESSAGES.badAnswers);
    await expect(h.submitQuiz({ day: TODAY, answers: [0, 4, 0] }, caller)).rejects.toThrow(MESSAGES.badAnswers);
    const played = createQuizHandlers(deps({ mine: { score: 1 } }));
    await expect(played.submitQuiz({ day: TODAY, answers: [0, 0, 0] }, caller)).rejects.toThrow(MESSAGES.alreadyPlayed);
  });
});

describe('getQuizLeaderboard', () => {
  it('totals per member, best first, and marks the caller', async () => {
    const rows = [
      { userId: 'u2', userName: 'Mary', day: '2026-09-15', score: 3 },
      { userId: 'u2', userName: 'Mary', day: TODAY, score: 3 },
      { userId: 'u1', userName: 'Shiny', day: '2026-09-15', score: 2 },
      { userId: 'u1', userName: 'Shiny', day: '2026-09-16', score: 3 },
      { userId: 'u1', userName: 'Shiny', day: TODAY, score: 1 },
      { userId: 'u3', userName: 'Anna', day: TODAY, score: 3 },
    ];
    const board = await createQuizHandlers(deps({ rows })).getQuizLeaderboard({}, caller);
    expect(board.map((e) => [e.rank, e.userName, e.total, e.days, e.today, e.perfect])).toEqual([
      [1, 'Mary', 6, 2, 3, 2],
      [2, 'Shiny', 6, 3, 1, 1],
      [3, 'Anna', 3, 1, 3, 1],
    ]);
    expect(board.find((e) => e.userName === 'Shiny').me).toBe(true);
  });
});
