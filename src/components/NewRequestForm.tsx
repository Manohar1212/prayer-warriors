import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { NewPrayerRequest } from '../api/prayerRequests';
import { colors, spacing } from '../theme';

type Props = {
  onSubmit: (input: NewPrayerRequest) => Promise<void>;
};

export function NewRequestForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title, details, author });
      setTitle('');
      setDetails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>Share a prayer request</Text>
      <TextInput
        style={styles.input}
        placeholder="What can we pray for?"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        returnKeyType="next"
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Details (optional)"
        placeholderTextColor={colors.muted}
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={1000}
      />
      <TextInput
        style={styles.input}
        placeholder="Your name (optional)"
        placeholderTextColor={colors.muted}
        value={author}
        onChangeText={setAuthor}
        maxLength={60}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={!canSubmit}
        onPress={submit}
        style={({ pressed }) => [
          styles.button,
          !canSubmit && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>{submitting ? 'Posting…' : 'Post request'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  heading: { fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 13 },
  button: {
    marginTop: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
