import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PrayerRequest } from '../api/prayerRequests';
import { colors, spacing } from '../theme';

type Props = {
  request: PrayerRequest;
  onPray: (id: string) => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function PrayerRequestCard({ request, onPray }: Props) {
  const label = request.prayerCount === 1 ? '1 prayer' : `${request.prayerCount} prayers`;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{request.title}</Text>
      {request.details ? <Text style={styles.details}>{request.details}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.meta}>
          {request.author} · {formatDate(request.createdAt)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pray for ${request.title}`}
          onPress={() => onPray(request.id)}
          style={({ pressed }) => [styles.prayButton, pressed && styles.prayButtonPressed]}
        >
          <Text style={styles.prayText}>🙏 {label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: '600', color: colors.ink },
  details: { marginTop: spacing.xs, fontSize: 15, lineHeight: 21, color: colors.ink },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  prayButton: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  prayButtonPressed: { opacity: 0.6 },
  prayText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
});
