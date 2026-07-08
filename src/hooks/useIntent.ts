import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MateRole } from '../lib/agent';

const KEY = 'mate_intent';

// AsyncStorage-backed but exposed as a synchronous React state so the auth
// gate can pattern-match without awaiting inside useEffect. Reads on mount,
// re-reads on every focus (in case another screen wrote it).
export function useIntent() {
  const [intent, setIntentState] = useState<MateRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY).then((v) => {
      if (cancelled) return;
      setIntentState(v === 'player' || v === 'agent' ? v : null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { intent, loading };
}
