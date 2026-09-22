import { View } from 'react-native';

import { Text } from '../../ui/Text';
import { splitPointTitle } from './points';

/** A prayer point's title, with the people it names listed one per line beneath it. */
export function PointTitle({ title }: { title: string }) {
  const { heading, names } = splitPointTitle(title);
  return (
    <View className="gap-1">
      <Text variant="label" className="text-[17px] leading-[26px]">
        {heading}
      </Text>
      {names.length ? (
        <View className="gap-0.5">
          {names.map((name, i) => (
            <Text key={`${i}-${name}`} className="text-[16px] leading-[25px] text-ink/80">
              {name}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
