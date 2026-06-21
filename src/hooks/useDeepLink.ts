import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { completeOAuthFromUrl } from '../lib/auth';

// Watches for matemobile:// URLs that arrive while the app is running — chiefly
// the Supabase email-confirmation link. WebBrowser.openAuthSessionAsync handles
// its own callback inline; this hook covers the case where the user taps a
// link in Mail/Messages and the app is launched cold.
export function useDeepLink() {
  useEffect(() => {
    const handle = (url: string) => {
      if (!url.includes('auth/callback')) return;
      completeOAuthFromUrl(url).catch(err => {
        console.warn('[deep-link] OAuth complete failed:', err.message);
      });
    };

    Linking.getInitialURL().then(url => {
      if (url) handle(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
}
