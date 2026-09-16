import { forwardRef } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors, fonts } from '../../theme/tokens';
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
  telugu?: boolean;
};

const W = 360;
const H = 450;

/** A gold cross with soft rays: the mark at the top of every Daily Bread card. */
function CrossWithRays() {
  return (
    <Svg width={96} height={96} viewBox="0 0 96 96">
      <Defs>
        <RadialGradient id="rays" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F3D27A" stopOpacity={0.55} />
          <Stop offset="0.6" stopColor="#F3D27A" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#F3D27A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={48} cy={48} r={48} fill="url(#rays)" />
      {[0, 30, 60, 90, 120, 150].map((deg) => (
        <Line key={deg} x1={48} y1={48} x2={48 + 44 * Math.cos((deg * Math.PI) / 180)} y2={48 + 44 * Math.sin((deg * Math.PI) / 180)} stroke="#E3C77A" strokeWidth={0.8} strokeOpacity={0.5} />
      ))}
      {[0, 30, 60, 90, 120, 150].map((deg) => (
        <Line key={`b${deg}`} x1={48} y1={48} x2={48 - 44 * Math.cos((deg * Math.PI) / 180)} y2={48 - 44 * Math.sin((deg * Math.PI) / 180)} stroke="#E3C77A" strokeWidth={0.8} strokeOpacity={0.5} />
      ))}
      <Circle cx={48} cy={48} r={26} fill="#FFFDF9" fillOpacity={0.9} />
      <Rect x={45} y={30} width={6} height={36} rx={2} fill="#C99A3F" />
      <Rect x={35} y={41} width={26} height={6} rx={2} fill="#C99A3F" />
    </Svg>
  );
}

/**
 * The Daily Bread card that goes out on WhatsApp: cross and rays, the day, the verse, and a line
 * from the Lord's Prayer, inside a double hairline frame on watercolour paper. 360×450pt, captured at 3×.
 */
export const VerseShareCard = forwardRef<View, VerseShareCardProps>(function VerseShareCard({ text, reference, title, date, prayer, prayerReference, telugu = false }, ref) {
  const long = text.length > 170;
  const verseSize = telugu ? (long ? 18 : 21) : long ? 20 : 24;
  const verseLine = telugu ? (long ? 30 : 34) : long ? 30 : 35;
  return (
    <View ref={ref} collapsable={false} style={{ width: W, height: H, backgroundColor: '#FFFDF9', overflow: 'hidden' }}>
      {/* Washes: soft radial gradients, like colour bleeding into wet paper. */}
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <RadialGradient id="w-rose" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F4B4C8" stopOpacity={0.6} />
            <Stop offset="0.6" stopColor="#F4B4C8" stopOpacity={0.25} />
            <Stop offset="1" stopColor="#F4B4C8" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="w-sage" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#B4D6C4" stopOpacity={0.65} />
            <Stop offset="0.6" stopColor="#B4D6C4" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#B4D6C4" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="w-honey" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFE0AA" stopOpacity={0.65} />
            <Stop offset="0.6" stopColor="#FFE0AA" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#FFE0AA" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={330} cy={30} rx={190} ry={150} fill="url(#w-rose)" />
        <Ellipse cx={20} cy={250} rx={170} ry={150} fill="url(#w-sage)" />
        <Ellipse cx={330} cy={420} rx={180} ry={140} fill="url(#w-honey)" />
      </Svg>
      {/* Double frame */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 12, top: 12, right: 12, bottom: 12, borderWidth: 1, borderColor: 'rgba(201,154,63,0.55)', borderRadius: 4 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 17, top: 17, right: 17, bottom: 17, borderWidth: 0.6, borderColor: 'rgba(201,154,63,0.4)', borderRadius: 2 }} />

      <View style={{ flex: 1, paddingHorizontal: 34, paddingTop: 30, paddingBottom: 26, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <CrossWithRays />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.ink, textAlign: 'center' }}>{title}</Text>
          <Text variant="caption" style={{ fontSize: 13, textAlign: 'center' }}>
            {date}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text variant="scripture" style={{ textAlign: 'center', fontSize: verseSize, lineHeight: verseLine }}>
            {text}
          </Text>
          <Text variant="label" color="primary" style={{ fontSize: 15, textAlign: 'center' }}>
            {reference}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 16, lineHeight: 20, color: colors.roseDeep }}>❦</Text>
          <Text variant="caption" style={{ fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
            {prayer}
          </Text>
          <Text variant="caption" style={{ fontSize: 12, textAlign: 'center', marginTop: -4 }}>
            {prayerReference}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 }}>
            <Image source={emblem} style={{ width: 20, height: 20 }} resizeMode="contain" />
            <Text variant="label" style={{ fontSize: 13 }}>
              Prayer Warriors
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});
