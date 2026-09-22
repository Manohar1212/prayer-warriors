import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { goBackOr } from '../lib/navigation';
import { useT } from '../i18n';
import { colors } from '../theme/tokens';
import { Chevron } from './Chevron';

type Props = {
  /** Modals close downwards; pushed screens go back leftwards. */
  modal?: boolean;
  /** Where to land when there is no history, e.g. after a deep link or a web reload. */
  fallback?: Href;
  /** Light variant for purple backgrounds. */
  onDark?: boolean;
};

/** Back or close control for a header. */
export function HeaderBack({ modal = false, fallback = '/(tabs)', onDark = false }: Props) {
  const router = useRouter();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={modal ? t('common.close') : t('common.back')}
      onPress={() => goBackOr(router, fallback)}
      hitSlop={10}
      className={`h-9 w-9 items-center justify-center rounded-full ${onDark ? 'bg-surface/15' : ''}`}
      style={{ marginLeft: onDark ? 0 : -4 }}
    >
      {modal ? <Ionicons name="close" size={22} color={onDark ? colors.surface : colors.ink} /> : <Chevron size={24} color={onDark ? colors.surface : colors.ink} />}
    </Pressable>
  );
}
