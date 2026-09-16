import { forwardRef } from 'react';
import { Image, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { CrossMark } from '../../ui/CrossMark';
import { Scene, type SceneVariant } from '../../ui/Scene';
import { Text } from '../../ui/Text';

const emblem = require('../../../assets/logo-emblem.png');

export type VerseShareCardProps = {
  text: string;
  reference: string;
  /** Card heading, e.g. "Daily Bread" in the app language. */
  title: string;
  /** The day, already formatted in the app language. */
  date: string;
  /** Closing line, e.g. "Give us this day our daily bread." */
  prayer: string;
  prayerReference: string;
  /** The same sky as the card on screen, so what goes out matches what you saw. */
  sky: SceneVariant;
  telugu?: boolean;
};

const W = 360;
const H = 450;

/**
 * The card that goes out on WhatsApp: the verse set on the sky over the mountains, with the
 * title and day above and the Lord's Prayer line and emblem below. 360×450pt, captured at 3×.
 */
export const VerseShareCard = forwardRef<View, VerseShareCardProps>(function VerseShareCard({ text, reference, title, date, prayer, prayerReference, sky, telugu = false }, ref) {
  const long = text.length > 170;
  const verseSize = telugu ? (long ? 18 : 21) : long ? 20 : 24;
  const verseLine = telugu ? (long ? 30 : 34) : long ? 30 : 35;
  return (
    <View ref={ref} collapsable={false} style={{ width: W, height: H, backgroundColor: '#1E2D42', overflow: 'hidden' }}>
      <Scene variant={sky} dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {/* A darker veil in the middle so the verse reads on the bright skies too. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(11,21,38,0.28)' }} />
      <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 30, paddingBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <CrossMark size={36} color={colors.surface} />
          <Text variant="caption" color="cream" style={{ letterSpacing: 2.5 }}>
            {title.toUpperCase()}
          </Text>
          <Text variant="caption" color="creamSoft" style={{ fontSize: 12 }}>
            {date}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text variant="scripture" color="cream" style={{ textAlign: 'center', fontSize: verseSize, lineHeight: verseLine }}>
            {`“${text}”`}
          </Text>
          <Text variant="label" color="cream" style={{ fontSize: 15, textAlign: 'center' }}>
            {reference}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={{ width: 36, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.7)' }} />
          <Text variant="caption" color="creamSoft" style={{ fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
            {prayer} · {prayerReference}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
            <Image source={emblem} style={{ width: 20, height: 20 }} resizeMode="contain" />
            <Text variant="label" color="cream" style={{ fontSize: 13 }}>
              Prayer Warriors
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});
