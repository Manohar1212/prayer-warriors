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
    await service.start();
    await service.submit('2026-09-17', [1]);
    await service.leaderboard();
    await service.leaderboard('2026-08');
    expect(cloud.run.mock.calls).toEqual([['getDailyQuiz'], ['startQuiz'], ['submitQuiz', { day: '2026-09-17', answers: [1] }], ['getQuizLeaderboard', {}], ['getQuizLeaderboard', { month: '2026-08' }]]);
  });
});

describe('useDailyQuiz clock', () => {
  beforeEach(() => clearQueryCache());
  const cloudFor = (today: typeof quiz) => ({ run: jest.fn(async (name: string) => (name === 'getDailyQuiz' ? today : name === 'startQuiz' ? { day: today.day, startedAt: '2026-09-17T02:00:00.000Z' } : {})) });

  it('starts the server clock once when the quiz screen opens an unplayed quiz', async () => {
    const cloud = cloudFor(quiz);
    const { result, rerender } = await renderHook(() => useDailyQuiz(createQuizService({ cloud }), { startClock: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await rerender({});
    await waitFor(() => expect(cloud.run).toHaveBeenCalledWith('startQuiz'));
    expect(cloud.run.mock.calls.filter(([name]) => name === 'startQuiz')).toHaveLength(1);
  });

  it('does not start the clock from Home or once today is already played', async () => {
    const home = cloudFor(quiz);
    const { result } = await renderHook(() => useDailyQuiz(createQuizService({ cloud: home })));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(home.run).not.toHaveBeenCalledWith('startQuiz');

    clearQueryCache();
    const played = cloudFor({ ...quiz, result: { score: 1, answers: [1], correct: [1], durationMs: 30000 } });
    const shown = await renderHook(() => useDailyQuiz(createQuizService({ cloud: played }), { startClock: true }));
    await waitFor(() => expect(shown.result.current.loading).toBe(false));
    expect(played.run).not.toHaveBeenCalledWith('startQuiz');
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
