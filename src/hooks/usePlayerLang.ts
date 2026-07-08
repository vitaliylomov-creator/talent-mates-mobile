import { usePlayer } from './usePlayer';
import type { Lang } from '../lib/lang';

// Player-screen language: read language_preference off the persisted players
// row and map to our two-bucket system. Before a profile exists (mid
// onboarding, cold sign-in) we return 'en' — the same default getLang()
// hands out. Once step 5 completes, Chat / Training / Profile pick up
// the language automatically on the next render pass.
export function usePlayerLang(): Lang {
  const { player } = usePlayer();
  if (!player) return 'en';
  const pref = player.language_preference;
  if (pref === 'uk' || pref === 'ru') return 'ua';
  return 'en';
}
