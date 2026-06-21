import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Required for WebBrowser.openAuthSessionAsync to dismiss properly on iOS.
WebBrowser.maybeCompleteAuthSession();

// matemobile://auth/callback — must match the Redirect URL added in Supabase
// Auth settings.
export const AUTH_REDIRECT = Linking.createURL('auth/callback');

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: AUTH_REDIRECT },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Google OAuth via Supabase's hosted OAuth handler (not the native Google SDK).
 * Pros: no iOS/Android Google client IDs needed — Supabase brokers the token
 * exchange. Same flow as mate-auth.html on the web.
 *
 * Flow:
 *   1. Ask Supabase for the Google authorize URL (skipBrowserRedirect: true).
 *   2. Open it inside a Web Browser auth session that listens for matemobile://.
 *   3. Supabase redirects back to matemobile://auth/callback with either a
 *      PKCE code (newer flow) or a hash with access_token/refresh_token (legacy).
 *   4. Exchange the code (or set the session) on the client.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) throw error ?? new Error('OAuth init failed');

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT);
  if (result.type !== 'success' || !result.url) return null;

  return completeOAuthFromUrl(result.url);
}

/**
 * Parse a callback URL and finalise the Supabase session. Used by the deep-link
 * handler (when the browser sends the user back outside a managed auth session,
 * e.g. when clicking the email-confirmation link).
 */
export async function completeOAuthFromUrl(url: string) {
  const parsed = Linking.parse(url);
  const params = { ...parsed.queryParams } as Record<string, string | undefined>;

  // Some providers put tokens in the URL fragment instead of query string.
  // Linking.parse doesn't surface the fragment, so we read it ourselves.
  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const search = new URLSearchParams(url.slice(hashIndex + 1));
    search.forEach((v, k) => { params[k] = v; });
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  return null;
}
