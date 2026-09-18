import type { ReminderCall } from './reminders';

// Local notifications are native-only.
export async function syncCallReminders(_upcoming: ReminderCall[]): Promise<void> {}

export async function syncPrayerNightReminders(): Promise<void> {
  // No local notifications on web.
}
