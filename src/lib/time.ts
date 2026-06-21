import type { Lang } from './lang';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface DateBucket {
  key: 'today' | 'yesterday' | 'this_week' | 'older';
  label: string;
}

export function bucketFor(iso: string, lang: Lang = 'en'): DateBucket {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (t >= startOfToday.getTime()) {
    return { key: 'today', label: lang === 'ua' ? 'Сьогодні' : 'Today' };
  }
  if (t >= startOfYesterday.getTime()) {
    return { key: 'yesterday', label: lang === 'ua' ? 'Вчора' : 'Yesterday' };
  }
  if (t >= startOfWeek.getTime()) {
    return { key: 'this_week', label: lang === 'ua' ? 'Цього тижня' : 'This week' };
  }
  return { key: 'older', label: lang === 'ua' ? 'Раніше' : 'Earlier' };
}

export function relativeTime(iso: string, lang: Lang = 'en'): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;

  if (diff < 60_000) return lang === 'ua' ? 'щойно' : 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / 60_000);
    return lang === 'ua' ? `${m} хв тому` : `${m}m ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return lang === 'ua' ? `${h} год тому` : `${h}h ago`;
  }
  if (diff < 7 * DAY) {
    const d = Math.floor(diff / DAY);
    return lang === 'ua' ? `${d} дн тому` : `${d}d ago`;
  }
  // Older: locale-aware short date.
  return new Date(iso).toLocaleDateString(lang === 'ua' ? 'uk-UA' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
