import { Screen } from './Screen';
import { Text } from './Text';

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <Screen className="items-center justify-center gap-2">
      <Text variant="display">{title}</Text>
      <Text variant="muted">Coming in {phase}.</Text>
    </Screen>
  );
}
