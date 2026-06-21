import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Player } from '../lib/types';

export function usePlayer() {
  const { session } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setPlayer(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('players')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn('[usePlayer]', error.message);
        setPlayer(data as Player | null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [session?.user.id]);

  return { player, loading, hasProfile: !!player };
}
