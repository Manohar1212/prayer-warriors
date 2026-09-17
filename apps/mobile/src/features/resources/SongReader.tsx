import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { Text } from '../../ui';
import { SONG_TEXT_SIZES, songTextStyle, useSongTextSize, verses } from './songbook';

type Neighbour = { number: number; title: string } | null;

type Props = {
  number: number;
  title: string;
  subtitle?: string;
  body: string;
  numberLabel: string;
  previous: Neighbour;
  next: Neighbour;
  onPrevious: () => void;
  onNext: () => void;
  labels: { smaller: string; larger: string; previous: string; next: string };
  /** Extra tool buttons on the right of the text-size controls. */
  tools?: ReactNode;
  /** Shown instead of the lyrics when there are none. */
  empty?: ReactNode;
  /** Anything under the navigation, such as a remove control. */
  footer?: ReactNode;
};

export function ToolButton({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} className={`h-10 w-10 items-center justify-center rounded-full border border-border bg-surface ${disabled ? 'opacity-30' : 'active:opacity-70'}`}>
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

/** One page of a songbook: number, title, big verse-spaced lyrics, and a way to the neighbours. */
export function SongReader({ number, title, subtitle, body, numberLabel, previous, next, onPrevious, onNext, labels, tools, empty, footer }: Props) {
  const [size, setSize] = useSongTextSize();
  const sizeAt = SONG_TEXT_SIZES.indexOf(size);
  const style = songTextStyle[size];

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text variant="label" color="gold" className="text-[13px] uppercase tracking-[1px]">
          {numberLabel}
        </Text>
        <Text variant="display" className="text-[24px] leading-[31px]">
          {title}
        </Text>
        {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
      </View>

      <View className="flex-row items-center gap-2">
        <ToolButton icon="remove" label={labels.smaller} disabled={sizeAt === 0} onPress={() => setSize(SONG_TEXT_SIZES[sizeAt - 1])} />
        <ToolButton icon="add" label={labels.larger} disabled={sizeAt === SONG_TEXT_SIZES.length - 1} onPress={() => setSize(SONG_TEXT_SIZES[sizeAt + 1])} />
        <View className="flex-1" />
        {tools}
      </View>

      {body ? (
        <View className="gap-5 py-1">
          {verses(body).map((verse, i) => (
            <Text key={i} style={{ fontSize: style.fontSize, lineHeight: style.lineHeight }}>
              {verse}
            </Text>
          ))}
        </View>
      ) : (
        empty ?? null
      )}

      <View className="flex-row gap-3 border-t border-border pt-4">
        <Pressable accessibilityRole="button" accessibilityLabel={labels.previous} disabled={!previous} onPress={onPrevious} className={`flex-1 flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3 py-3 ${previous ? 'active:opacity-70' : 'opacity-40'}`}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <View className="flex-1">
            <Text variant="caption" color="muted">
              {labels.previous}
            </Text>
            <Text variant="label" numberOfLines={1}>
              {previous ? `${previous.number}. ${previous.title}` : '—'}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={labels.next} disabled={!next} onPress={onNext} className={`flex-1 flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3 py-3 ${next ? 'active:opacity-70' : 'opacity-40'}`}>
          <View className="flex-1">
            <Text variant="caption" color="muted" className="text-right">
              {labels.next}
            </Text>
            <Text variant="label" className="text-right" numberOfLines={1}>
              {next ? `${next.number}. ${next.title}` : '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {footer}
    </View>
  );
}
