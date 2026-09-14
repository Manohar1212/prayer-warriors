import { translate, type Language, type TranslationKey } from '../i18n';

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;
const english: T = (key, vars) => translate('en', key, vars);

/** "Just now", "12 min ago", "3 hours ago", "Yesterday", "4 days ago", then a short date, in the app language. */
export function timeAgo(iso: string, now: Date = new Date(), t: T = english, locale?: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60000));
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minAgo', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? t('time.hourAgo') : t('time.hoursAgo', { count: hours });
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? t('time.yesterday') : t('time.daysAgo', { count: days });
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export type { Language };

/** Compact "2h ago" style for tight rows. */
export function timeAgoShort(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function shortDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
