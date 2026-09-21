import { forwardRef } from 'react';
import { Image, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { CrossMark } from '../../ui/CrossMark';
import { Scene, type SceneVariant } from '../../ui/Scene';
import { Text } from '../../ui/Text';
import { headingSpacing, quoted } from './quote';

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
  /** The same passage in the reader's second language (Telugu, Tamil, Kannada, Malayalam or Hindi). */
  second?: { text: string; reference: string } | null;
};

const W = 360;
const MIN_H = 500;

/**
 * The card that goes out on WhatsApp: the verse set on the sky over the mountains, with the
 * title and day above and the Lord's Prayer line and emblem below. 360pt wide and at least
 * 500pt tall; it grows with long verses so nothing is ever cut off. Captured at 3×.
 */
export const VerseShareCard = forwardRef<View, VerseShareCardProps>(function VerseShareCard({ text, reference, title, date, prayer, prayerReference, sky, second = null }, ref) {
  const both = Boolean(second);
  const long = text.length > 170;
  const verseSize = both ? 18 : long ? 20 : 24;
  const verseLine = both ? 26 : long ? 30 : 35;
  return (
    <View ref={ref} collapsable={false} style={{ width: W, minHeight: MIN_H, backgroundColor: '#1E2D42', overflow: 'hidden' }}>
      <Scene variant={sky} shape="tall" dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {/* A darker veil in the middle so the verse reads on the bright skies too. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(11,21,38,0.28)' }} />
      <View style={{ flexGrow: 1, paddingHorizontal: 30, paddingTop: 30, paddingBottom: 24, alignItems: 'center', justifyContent: 'space-between', gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <CrossMark size={36} color={colors.surface} />
          <Text variant="caption" color="cream" style={{ letterSpacing: headingSpacing(title) }}>
            {title.toUpperCase()}
          </Text>
          <Text variant="caption" color="creamSoft" style={{ fontSize: 12 }}>
            {date}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text variant="scripture" color="cream" style={{ textAlign: 'center', fontSize: verseSize, lineHeight: verseLine }}>
            {quoted(text)}
          </Text>
          <Text variant="label" color="cream" style={{ fontSize: 14, textAlign: 'center' }}>
            {reference}
          </Text>
          {second ? (
            <>
              <View style={{ width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginVertical: 2 }} />
              <Text variant="scripture" color="cream" style={{ textAlign: 'center', fontSize: 16, lineHeight: 27 }}>
                {quoted(second.text)}
              </Text>
              <Text variant="label" color="cream" style={{ fontSize: 14, textAlign: 'center' }}>
                {second.reference}
              </Text>
            </>
          ) : null}
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
