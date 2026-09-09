import type { ReminderCall } from './reminders';

// Local notifications are native-only.
export async function syncCallReminders(_upcoming: ReminderCall[]): Promise<void> {}
