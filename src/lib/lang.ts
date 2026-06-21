import * as Localization from 'expo-localization';

export type Lang = 'en' | 'ua';

// Detect the device's primary language. We only resolve to two buckets right
// now (UK pilot is English, Ukrainian corridor is Yegor + family) — additional
// locales fall through to English.
export function getLang(): Lang {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode ?? 'en';
  if (code === 'uk' || code === 'ru') return 'ua';
  return 'en';
}
