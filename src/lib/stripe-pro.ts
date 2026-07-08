import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { createCheckout } from './agent';

export type ProUpgradeResult = 'success' | 'cancel' | 'dismiss';

/**
 * Hybrid iOS billing strategy:
 * - iOS: never open Stripe in-app. Route to the web dashboard where the
 *   user completes checkout with the same Supabase session cookie. This
 *   keeps Apple satisfied while we work on real IAP + entitlement (Sprint 3+).
 * - Android / web: open Stripe Checkout in a system-browser auth session so
 *   the matemobile:// return URL comes right back into the app.
 */
export async function openProUpgradeFlow(): Promise<ProUpgradeResult> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('https://app.talent-mates.com/mate-pro-dashboard.html?intent=upgrade');
    return 'dismiss';
  }

  const { url } = await createCheckout();
  // Deep link back into the app once checkout returns. Anything the browser
  // resolves before this url appears (Stripe success/cancel query params)
  // will fire the WebBrowser resolver.
  const returnUrl = Linking.createURL('mate-pro-subscribed');
  const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
  if (result.type === 'success') return 'success';
  if (result.type === 'cancel') return 'cancel';
  return 'dismiss';
}

/**
 * Send the user to the web dashboard to manage / update / view the invoice
 * history on their Stripe subscription. iOS behaviour matches openProUpgradeFlow.
 */
export async function openProManageFlow(): Promise<void> {
  await Linking.openURL('https://app.talent-mates.com/mate-pro-dashboard.html?intent=manage');
}
