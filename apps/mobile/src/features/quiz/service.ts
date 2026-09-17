import { useCallback, useEffect, useState } from 'react';

import { mapParseError } from '../auth/errors';

/** One question in both languages; the right answer is only known to the server until you play. */
export type QuizQuestion = {
  id: string;
  en: { q: string; o: string[] };
  te: { q: string; o: string[] };
};

export type QuizResult = { score: number; answers: number[]; correct: number[] };

export type DailyQuiz = { day: string; questions: QuizQuestion[]; result: QuizResult | null; streak: number };

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string;
  /** Consecutive days played this month, still alive (reaches today or yesterday). */
  streak: number;
  /** Longest run in the month. */
  best: number;
  points: number;
  days: number;
  today: number | null;
  me: boolean;
};

/** One month's board; the board starts again on the 1st and earlier months remain as history. */
export type Leaderboard = {
  month: string;
  /** Every month with results, newest first; always includes the current one. */
  months: string[];
  current: boolean;
  resetsOn: string;
  daysInMonth: number;
  entries: LeaderboardEntry[];
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
    leaderboard: (month?: string) => guarded(() => cloud.run('getQuizLeaderboard', month ? { month } : {})) as Promise<Leaderboard>,
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
      setQuiz({ ...quiz, result: { score: result.score, answers, correct: result.correct }, streak: quiz.streak + 1 });
    },
    [quiz, service],
  );

  return { quiz, loading, error, refresh: load, submit };
}

export function useLeaderboard(service: QuizService) {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await service.leaderboard(month));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the leaderboard.');
    } finally {
      setLoading(false);
    }
  }, [service, month]);

  useEffect(() => {
    load();
  }, [load]);

  return { board, loading, error, refresh: load, setMonth };
}
