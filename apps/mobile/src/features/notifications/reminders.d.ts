export type ReminderCall = { id: string; title: string; scheduledAt: string; status: string };

/**
 * Keeps one local "call in 10 minutes" reminder per upcoming scheduled call (identifier `call-<id>`)
 * and cancels reminders for calls that are gone, cancelled, or already started. Never throws.
 */
export declare function syncCallReminders(upcoming: ReminderCall[]): Promise<void>;
