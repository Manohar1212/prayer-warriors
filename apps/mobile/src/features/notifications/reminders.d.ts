export type ReminderCall = { id: string; title: string; scheduledAt: string; status: string };

/**
 * Keeps one local "call in 10 minutes" reminder per upcoming scheduled call (identifier `call-<id>`)
 * and cancels reminders for calls that are gone, cancelled, or already started. Never throws.
 */
export declare function syncCallReminders(upcoming: ReminderCall[]): Promise<void>;

export type ReminderNight = { id: string; scheduledAt: string } | null;

/**
 * Keeps local reminders for the all-night prayer: one each morning at 8:00 for the seven days
 * before it (and on the day), plus one an hour before it starts. Identifiers start with `night-`;
 * anything for an older or cancelled night is removed. Never throws.
 */
export declare function syncPrayerNightReminders(night: ReminderNight, labels: { daysAway: (days: number) => string; tonight: string; soon: string; body: string }): Promise<void>;
