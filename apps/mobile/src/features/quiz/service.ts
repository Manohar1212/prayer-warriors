import { useCallback, useEffect, useState } from 'react';

import { mapParseError } from '../auth/errors';

/** One question in both languages; the right answer is only known to the server until you play. */
export type QuizQuestion = {
  id: string;
  en: { q: string; o: string[] };
  te: { q: string; o: string[] };
};

export type QuizResult = { score: number; answers: number[]; correct: number[] };

export type DailyQuiz = { day: string; questions: QuizQuestion[]; result: QuizResult | null };

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string;
  total: number;
  days: number;
  perfect: number;
  today: number | null;
  me: boolean;
};

type Deps = { cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> } };

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createQuizService({ cloud }: Deps) {
  return {
    today: () => guarded(() => cloud.run('getDailyQuiz')) as Promise<DailyQuiz>,
    submit: (day: string, answers: number[]) => guarded(() => cloud.run('submitQuiz', { day, answers })) as Promise<{ day: string; score: number; correct: number[] }>,
    leaderboard: () => guarded(() => cloud.run('getQuizLeaderboard')) as Promise<LeaderboardEntry[]>,
  };
}

export type QuizService = ReturnType<typeof createQuizService>;

export type DailyQuizState = {
  quiz: DailyQuiz | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Scores the answers; on success the quiz carries the result and the correct options. */
  submit: (answers: number[]) => Promise<void>;
};

export function useDailyQuiz(service: QuizService): DailyQuizState {
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setQuiz(await service.today());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the quiz.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (answers: number[]) => {
      if (!quiz) return;
      const result = await service.submit(quiz.day, answers);
      setQuiz({ ...quiz, result: { score: result.score, answers, correct: result.correct } });
    },
    [quiz, service],
  );

  return { quiz, loading, error, refresh: load, submit };
}

export function useLeaderboard(service: QuizService) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await service.leaderboard());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the leaderboard.');
    }
  }, [service]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, error, refresh: load };
}
