export type Lang = 'en' | 'ua';

// English is the default for every screen the user hits BEFORE they've told
// us their language preference: role picker, sign-in / sign-up, both
// onboarding flows, and the whole MATE Pro surface (professional B2B
// product, English-only to mirror the web).
//
// After Player onboarding step 5 writes language_preference to the players
// row, Player screens should switch by reading usePlayerLang() instead of
// getLang(). Agent screens stay on getLang() and thus always English.
export function getLang(): Lang {
  return 'en';
}
