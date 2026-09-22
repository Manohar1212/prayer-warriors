jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { clearQueryCache } from '../../lib/useCachedQuery';
import { createQuizService, useDailyQuiz, type DailyQuiz } from './service';

const quiz: DailyQuiz = {
  day: '2026-09-17',
  questions: [{ id: 'q1', en: { q: 'Who built the ark?', o: ['Moses', 'Noah', 'Abraham', 'David'] }, te: { q: 'ఓడను ఎవరు నిర్మించారు?', o: ['మోషే', 'నోవహు', 'అబ్రాహాము', 'దావీదు'] } }],
  result: null,
  streak: 2,
};

describe('createQuizService', () => {
  it('calls the cloud functions with the day and answers', async () => {
    const cloud = { run: jest.fn(async () => ({ day: '2026-09-17', score: 1, correct: [1] })) };
    const service = createQuizService({ cloud });
    await service.today();
    await service.today(true);
    await service.submit('2026-09-17', [1]);
    await service.leaderboard();
    await service.leaderboard('2026-08');
    expect(cloud.run.mock.calls).toEqual([['getDailyQuiz', {}], ['getDailyQuiz', { start: true }], ['submitQuiz', { day: '2026-09-17', answers: [1] }], ['getQuizLeaderboard', {}], ['getQuizLeaderboard', { month: '2026-08' }]]);
  });
});

describe('useDailyQuiz clock', () => {
  beforeEach(() => clearQueryCache());
  const cloudFor = (today: typeof quiz) => ({ run: jest.fn(async (name: string) => (name === 'getDailyQuiz' ? today : name === 'startQuiz' ? { day: today.day, startedAt: '2026-09-17T02:00:00.000Z' } : {})) });

  it('asks the server to start the clock when the quiz screen opens', async () => {
    const cloud = cloudFor(quiz);
    const { result } = await renderHook(() => useDailyQuiz(createQuizService({ cloud }), { startClock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cloud.run).toHaveBeenCalledWith('getDailyQuiz', { start: true });
  });

  it('does not start the clock from Home', async () => {
    const home = cloudFor(quiz);
    const { result } = await renderHook(() => useDailyQuiz(createQuizService({ cloud: home })));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(home.run).toHaveBeenCalledWith('getDailyQuiz', {});
    expect(home.run).not.toHaveBeenCalledWith('getDailyQuiz', { start: true });
  });
});

describe('useDailyQuiz', () => {
  beforeEach(() => clearQueryCache());
  it('loads today, then keeps the score and correct answers after submitting', async () => {
    const cloud = { run: jest.fn(async (name: string) => (name === 'getDailyQuiz' ? quiz : { day: '2026-09-17', score: 1, correct: [1], durationMs: 42000 })) };
    const service = createQuizService({ cloud });
    const { result } = await renderHook(() => useDailyQuiz(service));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quiz?.questions).toHaveLength(1);
    expect(result.current.quiz?.result).toBeNull();
    await act(() => result.current.submit([1]));
    expect(result.current.quiz?.result).toEqual({ score: 1, answers: [1], correct: [1], durationMs: 42000 });
    expect(result.current.quiz?.streak).toBe(3);
  });

  it('surfaces a load failure', async () => {
    const cloud = { run: jest.fn(async () => Promise.reject(new Error('offline'))) };
    const { result } = await renderHook(() => useDailyQuiz(createQuizService({ cloud })));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });
});
