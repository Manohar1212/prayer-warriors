const { createQuizHandlers, dayKeyFor, questionsForDay, streaksFor, MESSAGES } = require('./quiz');
const { QUESTIONS } = require('./quizQuestions');

const NOW = new Date('2026-09-16T20:30:00.000Z'); // 02:00 on 17 Sept in India
const TODAY = '2026-09-17';
const caller = { callerId: 'u1' };

const bank = Array.from({ length: 7 }, (_, i) => ({ id: `q${i}`, answer: i % 4, en: { q: `Q${i}`, o: ['a', 'b', 'c', 'd'] }, te: { q: `ప${i}`, o: ['అ', 'ఆ', 'ఇ', 'ఈ'] } }));

function deps({ groupId = 'g1', mine = null, rows = [], started = null } = {}) {
  return {
    memberships: { findGroupId: jest.fn(async () => groupId) },
    results: {
      find: jest.fn(async () => mine),
      create: jest.fn(async (fields) => ({ id: 'r-new', ...fields })),
      listForMonth: jest.fn(async (_g, month) => rows.filter((r) => r.day.startsWith(month))),
      listForUser: jest.fn(async (userId, month) => rows.filter((r) => r.userId === userId && r.day.startsWith(month))),
      listDays: jest.fn(async () => [...new Set(rows.map((r) => r.day))]),
    },
    starts: {
      find: jest.fn(async () => started),
      create: jest.fn(async (fields) => ({ id: 's-new', ...fields })),
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
  it('hides the questions until the quiz screen starts, so nobody reads them before the clock', async () => {
    const d = deps();
    const home = await createQuizHandlers(d).getDailyQuiz({}, caller);
    expect(home.questions).toHaveLength(0);
    expect(home.questionCount).toBe(3);
    expect(d.starts.create).not.toHaveBeenCalled();
  });

  it('returns today questions without answers once started, and starts the clock', async () => {
    const d = deps();
    const result = await createQuizHandlers(d).getDailyQuiz({ start: true }, caller);
    expect(d.starts.create).toHaveBeenCalledWith(expect.objectContaining({ userId: caller.callerId, day: TODAY }));
    expect(result.day).toBe(TODAY);
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0]).not.toHaveProperty('answer');
    expect(result.questions[0].te.q).toMatch(/ప/);
    expect(result.result).toBeNull();
  });

  it('includes the correct answers once the caller has played', async () => {
    const d = deps({ mine: { score: 2, answers: [0, 1, 2], day: TODAY, durationMs: 42_000 } });
    const result = await createQuizHandlers(d).getDailyQuiz({}, caller);
    expect(result.result.score).toBe(2);
    expect(result.result.correct).toHaveLength(3);
    expect(result.result.durationMs).toBe(42_000);
  });

  it('refuses non-members', async () => {
    await expect(createQuizHandlers(deps({ groupId: null })).getDailyQuiz({}, caller)).rejects.toThrow(MESSAGES.notMember);
  });
});

describe('submitQuiz', () => {
  it('takes back a second result from a double tap', async () => {
    const d = deps();
    d.results.listFor = jest.fn(async () => [{ id: 'r-first' }, { id: 'r-new' }]);
    d.results.remove = jest.fn(async () => undefined);
    const qs = questionsForDay(bank, TODAY);
    await expect(createQuizHandlers(d).submitQuiz({ day: TODAY, answers: qs.map((q) => q.answer) }, caller)).rejects.toThrow(MESSAGES.alreadyPlayed);
    expect(d.results.remove).toHaveBeenCalledWith('r-new');
  });

  it('scores against the day questions and saves one result', async () => {
    const d = deps();
    const qs = questionsForDay(bank, TODAY);
    const answers = [qs[0].answer, qs[1].answer, (qs[2].answer + 1) % 4];
    const result = await createQuizHandlers(d).submitQuiz({ day: TODAY, answers }, caller);
    expect(result.score).toBe(2);
    expect(result.correct).toEqual(qs.map((q) => q.answer));
    expect(d.results.create).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u1', day: TODAY, score: 2, answers, durationMs: null });
  });

  it('measures the time from the first open on the server clock', async () => {
    const started = { userId: 'u1', day: TODAY, startedAt: new Date(NOW.getTime() - 42_000) };
    const d = deps({ started });
    const result = await createQuizHandlers(d).submitQuiz({ day: TODAY, answers: [0, 0, 0] }, caller);
    expect(result.durationMs).toBe(42_000);
    expect(d.results.create).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 42_000 }));
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

describe('startQuiz', () => {
  it('records the first open of today and returns it', async () => {
    const d = deps();
    const result = await createQuizHandlers(d).startQuiz({}, caller);
    expect(result).toEqual({ day: TODAY, startedAt: NOW.toISOString() });
    expect(d.starts.create).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u1', day: TODAY, startedAt: NOW });
  });

  it('keeps the first open when the quiz is opened again', async () => {
    const earlier = new Date(NOW.getTime() - 90_000);
    const d = deps({ started: { userId: 'u1', day: TODAY, startedAt: earlier } });
    const result = await createQuizHandlers(d).startQuiz({}, caller);
    expect(result.startedAt).toBe(earlier.toISOString());
    expect(d.starts.create).not.toHaveBeenCalled();
  });

  it('refuses non-members', async () => {
    await expect(createQuizHandlers(deps({ groupId: null })).startQuiz({}, caller)).rejects.toThrow(MESSAGES.notMember);
  });
});

describe('streaksFor', () => {
  it('counts the run reaching today, or yesterday when today is unplayed', () => {
    expect(streaksFor(['2026-09-15', '2026-09-16', '2026-09-17'], TODAY)).toEqual({ current: 3, best: 3 });
    expect(streaksFor(['2026-09-15', '2026-09-16'], TODAY)).toEqual({ current: 2, best: 2 });
    expect(streaksFor(['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-15'], TODAY)).toEqual({ current: 0, best: 3 });
    expect(streaksFor([], TODAY)).toEqual({ current: 0, best: 0 });
  });

  it('keeps the closing run of a finished month', () => {
    expect(streaksFor(['2026-08-29', '2026-08-30', '2026-08-31'], TODAY)).toEqual({ current: 3, best: 3 });
  });
});

describe('getQuizLeaderboard', () => {
  const rows = [
    { userId: 'u2', userName: 'Mary', day: '2026-09-15', score: 3, durationMs: 60_000 },
    { userId: 'u2', userName: 'Mary', day: TODAY, score: 3, durationMs: 50_000 },
    { userId: 'u1', userName: 'Shiny', day: '2026-09-15', score: 2, durationMs: 40_000 },
    { userId: 'u1', userName: 'Shiny', day: '2026-09-16', score: 3, durationMs: 30_000 },
    { userId: 'u1', userName: 'Shiny', day: TODAY, score: 1, durationMs: 20_000 },
    { userId: 'u3', userName: 'Anna', day: TODAY, score: 3, durationMs: 10_000 },
    { userId: 'u3', userName: 'Anna', day: '2026-08-30', score: 3, durationMs: null },
    { userId: 'u3', userName: 'Anna', day: '2026-08-31', score: 2, durationMs: 15_000 },
  ];

  it('ranks this month by right answers, then the faster total time, and lists the months with history', async () => {
    const board = await createQuizHandlers(deps({ rows })).getQuizLeaderboard({}, caller);
    expect(board.month).toBe('2026-09');
    expect(board.current).toBe(true);
    expect(board.resetsOn).toBe('2026-10-01');
    expect(board.daysInMonth).toBe(30);
    expect(board.months).toEqual(['2026-09', '2026-08']);
    expect(board.entries.map((e) => [e.rank, e.userName, e.points, e.timeMs, e.streak, e.best, e.days, e.today])).toEqual([
      [1, 'Shiny', 6, 90_000, 3, 3, 3, 1],
      [2, 'Mary', 6, 110_000, 1, 1, 2, 3],
      [3, 'Anna', 3, 10_000, 1, 1, 1, 3],
    ]);
    expect(board.entries[0].me).toBe(true);
  });

  it('places untimed results after timed ones on equal points, then by name', async () => {
    const tie = [
      { userId: 'u1', userName: 'Shiny', day: TODAY, score: 3, durationMs: null },
      { userId: 'u2', userName: 'Mary', day: TODAY, score: 3, durationMs: 80_000 },
      { userId: 'u3', userName: 'Anna', day: TODAY, score: 3, durationMs: null },
    ];
    const board = await createQuizHandlers(deps({ rows: tie })).getQuizLeaderboard({}, caller);
    expect(board.entries.map((e) => [e.userName, e.timeMs])).toEqual([
      ['Mary', 80_000],
      ['Anna', null],
      ['Shiny', null],
    ]);
  });

  it('shows a past month as history and ignores a future month', async () => {
    const h = createQuizHandlers(deps({ rows }));
    const past = await h.getQuizLeaderboard({ month: '2026-08' }, caller);
    expect(past.current).toBe(false);
    expect(past.entries.map((e) => [e.userName, e.streak, e.points, e.timeMs])).toEqual([['Anna', 2, 5, 15_000]]);
    const future = await h.getQuizLeaderboard({ month: '2027-01' }, caller);
    expect(future.month).toBe('2026-09');
  });

  it('reports the streak with the daily quiz', async () => {
    const result = await createQuizHandlers(deps({ rows })).getDailyQuiz({}, caller);
    expect(result.streak).toBe(3);
  });
});
