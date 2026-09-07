import { useAuth } from '@/features/auth';
import { Card, Screen, Text } from '@/ui';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <Screen scroll className="gap-4">
      <Text variant="display" className="text-primary">
        {greeting(new Date())}, {user?.displayName ?? 'friend'}
      </Text>
      <Card className="gap-1">
        <Text variant="label" className="text-gold">
          Today's Scripture
        </Text>
        <Text className="font-display text-lg">
          "The prayer of a righteous person is powerful and effective."
        </Text>
        <Text variant="muted">James 5:16</Text>
      </Card>
      <Text variant="muted">
        Prayer requests, calls, and resources arrive in the next phases.
      </Text>
    </Screen>
  );
}
