import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Subscription } from '../lib/types';

export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('subscriptions')
      .select('*')
      .eq('player_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn('[useSubscription]', error.message);
        setSubscription((data as Subscription | null) ?? { player_id: session.user.id, status: 'free', period_end: null });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [session?.user.id]);

  const isPro = subscription?.status === 'pro';
  return { subscription, isPro, loading };
}
