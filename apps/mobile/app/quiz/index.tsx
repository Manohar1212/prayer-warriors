import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useDailyQuiz, type QuizQuestion } from '@/features/quiz';
import { useLanguage } from '@/i18n';
import { quizService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

type Lang = 'en' | 'te';

/** A question shown in the app language with the other language underneath it. */
function QuestionText({ question, lang }: { question: QuizQuestion; lang: Lang }) {
  const other: Lang = lang === 'te' ? 'en' : 'te';
  return (
    <View className="gap-1">
      <Text variant="label" className={lang === 'te' ? 'text-[17px] leading-[27px]' : 'text-[18px] leading-[26px]'}>
        {question[lang].q}
      </Text>
      <Text variant="muted">{question[other].q}</Text>
    </View>
  );
}

type OptionState = 'idle' | 'picked' | 'correct' | 'wrong';

const optionClass: Record<OptionState, string> = {
  idle: 'border-border bg-surface',
  picked: 'border-primary bg-sky',
  correct: 'border-leaf bg-sage',
  wrong: 'border-roseDeep bg-blush',
};

function Option({ question, index, lang, state, onPress }: { question: QuizQuestion; index: number; lang: Lang; state: OptionState; onPress?: () => void }) {
  const other: Lang = lang === 'te' ? 'en' : 'te';
  const letter = String.fromCharCode(65 + index);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: state === 'picked' }} disabled={!onPress} onPress={onPress} className={`flex-row items-center gap-3 rounded-[12px] border px-3.5 py-3 ${optionClass[state]} ${onPress ? 'active:opacity-80' : ''}`}>
      <View className={`h-7 w-7 items-center justify-center rounded-full ${state === 'idle' ? 'bg-panel' : state === 'picked' ? 'bg-primary' : state === 'correct' ? 'bg-leaf' : 'bg-roseDeep'}`}>
        {state === 'correct' ? <Ionicons name="checkmark" size={16} color={colors.surface} /> : state === 'wrong' ? <Ionicons name="close" size={16} color={colors.surface} /> : (
          <Text variant="label" color={state === 'picked' ? 'cream' : 'muted'} className="text-[12px]">
            {letter}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text variant="body">{question[lang].o[index]}</Text>
        <Text variant="caption">{question[other].o[index]}</Text>
      </View>
    </Pressable>
  );
}

function scoreKey(score: number) {
  if (score === 3) return 'quiz.score3' as const;
  if (score === 2) return 'quiz.score2' as const;
  if (score === 1) return 'quiz.score1' as const;
  return 'quiz.score0' as const;
}

export default function QuizScreen() {
  const router = useRouter();
  const { t, language, locale } = useLanguage();
  const lang: Lang = language === 'te' ? 'te' : 'en';
  const { quiz, loading, error, refresh, submit } = useDailyQuiz(quizService);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) {
    return (
      <Screen edges={['bottom']} className="items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!quiz || error) {
    return (
      <Screen edges={['bottom']} className="items-center justify-center gap-4 px-8">
        <Text variant="body" color="muted" className="text-center">
          {error ?? t('quiz.failed')}
        </Text>
        <Button title={t('common.retry')} variant="secondary" onPress={refresh} />
      </Screen>
    );
  }

  const day = new Date(`${quiz.day}T00:00:00`);
  const dateLabel = day.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  // Already played: show the score and every question with the right answer marked.
  if (quiz.result) {
    const { score, answers, correct } = quiz.result;
    return (
      <Screen edges={['bottom']} scroll className="gap-4 pt-4">
        <Card tone="forest" className="items-center gap-1 py-6">
          <Text variant="caption" color="creamSoft" className="uppercase tracking-[1px]">
            {dateLabel}
          </Text>
          <Text variant="display" color="cream" className="text-[44px] leading-[52px]">
            {score} / {quiz.questions.length}
          </Text>
          <Text variant="body" color="creamSoft" className="text-center">
            {t(scoreKey(score))}
          </Text>
        </Card>
        {quiz.questions.map((q, i) => (
          <Card key={q.id} className="gap-3">
            <Text variant="caption" color="muted">
              {t('quiz.questionOf', { n: i + 1, total: quiz.questions.length })}
            </Text>
            <QuestionText question={q} lang={lang} />
            <View className="gap-2">
              {q[lang].o.map((_, idx) => (
                <Option key={idx} question={q} index={idx} lang={lang} state={idx === correct[i] ? 'correct' : idx === answers[i] ? 'wrong' : 'idle'} />
              ))}
            </View>
          </Card>
        ))}
        <Button title={t('quiz.leaderboard')} icon="trophy-outline" onPress={() => router.push('/quiz/leaderboard')} />
        <Text variant="caption" color="muted" className="text-center">
          {t('quiz.comeBack')}
        </Text>
      </Screen>
    );
  }

  const question = quiz.questions[step];
  const last = step === quiz.questions.length - 1;
  const choice = picked[step];

  function choose(idx: number) {
    setPicked((prev) => prev.map((p, i) => (i === step ? idx : p)));
  }

  async function finish() {
    if (picked.some((p) => p === null)) return;
    setBusy(true);
    setSubmitError(null);
    try {
      await submit(picked as number[]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('quiz.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-4">
      <View className="gap-1">
        <Text variant="caption" color="muted">
          {dateLabel}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text variant="label" color="primary">
            {t('quiz.questionOf', { n: step + 1, total: quiz.questions.length })}
          </Text>
          <View className="flex-row gap-1.5">
            {quiz.questions.map((q, i) => (
              <View key={q.id} className={`h-2 rounded-full ${i === step ? 'w-6 bg-primary' : picked[i] !== null ? 'w-2 bg-primary' : 'w-2 bg-border'}`} />
            ))}
          </View>
        </View>
      </View>

      <Card className="gap-4">
        <QuestionText question={question} lang={lang} />
        <View className="gap-2">
          {question[lang].o.map((_, idx) => (
            <Option key={idx} question={question} index={idx} lang={lang} state={choice === idx ? 'picked' : 'idle'} onPress={() => choose(idx)} />
          ))}
        </View>
      </Card>

      {submitError ? (
        <Text variant="caption" color="roseDeep" className="text-center">
          {submitError}
        </Text>
      ) : null}

      <View className="flex-row gap-3">
        {step > 0 ? <Button title={t('common.back')} variant="secondary" className="flex-1" onPress={() => setStep(step - 1)} /> : null}
        {last ? (
          <Button title={t('quiz.submit')} icon="checkmark-circle-outline" className="flex-1" disabled={choice === null || busy} loading={busy} onPress={finish} />
        ) : (
          <Button title={t('quiz.next')} className="flex-1" disabled={choice === null} onPress={() => setStep(step + 1)} />
        )}
      </View>
    </Screen>
  );
}
