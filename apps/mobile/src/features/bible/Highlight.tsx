import { Text as RNText } from 'react-native';

import { colors } from '../../theme/tokens';
import { Text, type TextProps } from '../../ui/Text';

/** Renders `text` with case-insensitive matches of `query` in bold, inline. */
export function Highlight({ text, query, ...rest }: TextProps & { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <Text {...rest}>{text}</Text>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'));
  return (
    <Text {...rest}>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <RNText key={i} style={{ fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
            {part}
          </RNText>
        ) : (
          part
        ),
      )}
    </Text>
  );
}
