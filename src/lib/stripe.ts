import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export type UpgradeResult = 'success' | 'cancel' | 'dismiss';

/**
 * Opens Stripe Checkout in the system browser. The existing create-checkout
 * edge function returns a one-shot URL bound to the current player. After the
 * user pays and Stripe redirects to matemobile://upgrade-complete,
 * WebBrowser.openAuthSessionAsync resolves with type: 'success'.
 *
 * Region note: we deliberately ship UK + EU only at v1.0 (Q3 of D1). For US
 * we'd need Apple's External Purchase Link Entitlement.
 */
export async function openUpgradeFlow(): Promise<UpgradeResult> {
  const returnUrl = Linking.createURL('upgrade-complete');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { return_url: returnUrl },
  });
  if (error) throw error;
  const url = (data as { url?: string } | null)?.url;
  if (!url) throw new Error('No checkout URL returned');

  const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
  if (result.type === 'success') return 'success';
  if (result.type === 'cancel') return 'cancel';
  return 'dismiss';
}
