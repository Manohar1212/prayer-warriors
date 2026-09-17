import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createQuizService, useDailyQuiz } from './service';

const quiz = {
  day: '2026-09-17',
  questions: [{ id: 'q1', en: { q: 'Who built the ark?', o: ['Moses', 'Noah', 'Abraham', 'David'] }, te: { q: 'ఓడను ఎవరు నిర్మించారు?', o: ['మోషే', 'నోవహు', 'అబ్రాహాము', 'దావీదు'] } }],
  result: null,
};

describe('createQuizService', () => {
  it('calls the cloud functions with the day and answers', async () => {
    const cloud = { run: jest.fn(async () => ({ day: '2026-09-17', score: 1, correct: [1] })) };
    const service = createQuizService({ cloud });
    await service.today();
    await service.submit('2026-09-17', [1]);
    await service.leaderboard();
    expect(cloud.run.mock.calls).toEqual([['getDailyQuiz'], ['submitQuiz', { day: '2026-09-17', answers: [1] }], ['getQuizLeaderboard']]);
  });
});

describe('useDailyQuiz', () => {
  it('loads today, then keeps the score and correct answers after submitting', async () => {
    const cloud = { run: jest.fn(async (name: string) => (name === 'getDailyQuiz' ? quiz : { day: '2026-09-17', score: 1, correct: [1] })) };
    const service = createQuizService({ cloud });
    const { result } = await renderHook(() => useDailyQuiz(service));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quiz?.questions).toHaveLength(1);
    expect(result.current.quiz?.result).toBeNull();
    await act(() => result.current.submit([1]));
    expect(result.current.quiz?.result).toEqual({ score: 1, answers: [1], correct: [1] });
  });

  it('surfaces a load failure', async () => {
    const cloud = { run: jest.fn(async () => Promise.reject(new Error('offline'))) };
    const { result } = await renderHook(() => useDailyQuiz(createQuizService({ cloud })));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });
});
