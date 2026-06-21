import { supabase } from './supabase';
import type { Player } from './types';

export type OnboardingDraft = Partial<Omit<Player, 'id' | 'email' | 'created_at'>>;

/**
 * Insert the player row that mate-chat will read on every request.
 * Called when the user finishes step 5. Idempotent via upsert on the
 * auth.uid()-matched id so repeated taps don't double-insert.
 */
export async function savePlayerProfile(userId: string, email: string, draft: OnboardingDraft) {
  // Filter out nulls/empty strings so we don't blow away real defaults.
  const cleaned: Record<string, unknown> = { id: userId, email };
  for (const [k, v] of Object.entries(draft)) {
    if (v !== '' && v !== null && v !== undefined) cleaned[k] = v;
  }

  return supabase
    .from('players')
    .upsert(cleaned, { onConflict: 'id' })
    .select()
    .single();
}
