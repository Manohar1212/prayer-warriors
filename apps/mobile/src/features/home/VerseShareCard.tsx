import { forwardRef } from 'react';
import { Image, View } from 'react-native';

import { colors, fonts } from '../../theme/tokens';
import { Text } from '../../ui/Text';

const emblem = require('../../../assets/logo-emblem.png');

export type VerseShareCardProps = {
  text: string;
  reference: string;
  /** Telugu verses take the Telugu face automatically; this only tunes the size. */
  telugu?: boolean;
};

/** The square card that goes out on WhatsApp: verse, reference, emblem. Rendered off screen at 360pt and captured at 3x. */
export const VerseShareCard = forwardRef<View, VerseShareCardProps>(function VerseShareCard({ text, reference, telugu = false }, ref) {
  const long = text.length > 160;
  return (
    <View ref={ref} collapsable={false} style={{ width: 360, height: 360, backgroundColor: '#FFFDF9', padding: 28, justifyContent: 'space-between' }}>
      {/* Two soft washes in the corners, drawn as plain circles so the capture stays fast. */}
      <View style={{ position: 'absolute', right: -80, top: -90, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(244,180,200,0.45)' }} />
      <View style={{ position: 'absolute', left: -90, bottom: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(180,214,196,0.5)' }} />
      <View style={{ position: 'absolute', right: -40, bottom: 40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,224,170,0.5)' }} />
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, color: colors.roseDeep, textAlign: 'center' }}>❦</Text>
      <Text
        variant="scripture"
        style={{ textAlign: 'center', fontSize: telugu ? (long ? 17 : 20) : long ? 19 : 23, lineHeight: telugu ? (long ? 27 : 32) : long ? 28 : 33 }}
      >
        {text}
      </Text>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text variant="label" color="primary" style={{ fontSize: 14 }}>
          {reference}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={emblem} style={{ width: 22, height: 22 }} resizeMode="contain" />
          <Text variant="caption" style={{ fontSize: 12 }}>
            Prayer Warriors
          </Text>
        </View>
      </View>
    </View>
  );
});
