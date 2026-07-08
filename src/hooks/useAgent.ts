import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { fetchAgent, type Agent } from '../lib/agent';

export function useAgent() {
  const { session } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setAgent(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchAgent(session.user.id).then((row) => {
      if (cancelled) return;
      setAgent(row);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.user.id]);

  return { agent, loading };
}

/**
 * Live re-fetch subscription for realtime UI updates when Stripe webhook
 * flips status. For MVP we just do a manual refetch. Realtime channel can
 * come in Sprint 3.
 */
export function useAgentRefetch() {
  const { session } = useAuth();
  return async () => {
    if (!session) return null;
    return fetchAgent(session.user.id);
  };
}
