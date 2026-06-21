import { useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';
import { setAnalytics, identify, reset } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';

// Wires the PostHog instance from PostHogProvider into our singleton
// analytics module, and identifies/resets on auth state changes.
export function AnalyticsBridge() {
  const posthog = usePostHog();
  const { session } = useAuth();

  useEffect(() => {
    setAnalytics(posthog ?? null);
  }, [posthog]);

  useEffect(() => {
    if (session?.user.id) {
      identify(session.user.id, {
        email: session.user.email ?? '',
      });
    } else {
      reset();
    }
  }, [session?.user.id]);

  return null;
}
