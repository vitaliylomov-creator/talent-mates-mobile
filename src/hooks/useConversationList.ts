import { useCallback, useEffect, useState } from 'react';
import { fetchConversationSummaries, deleteSession } from '../lib/conversations';
import type { ConversationSummary } from '../lib/types';

export function useConversationList(playerId: string | null) {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!playerId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversationSummaries(playerId);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load conversations');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => { void reload(); }, [reload]);

  const remove = useCallback(async (sessionId: string) => {
    if (!playerId) return;
    // Optimistic removal — Supabase round-trip happens in the background.
    setItems((prev) => prev.filter((i) => i.session_id !== sessionId));
    try { await deleteSession(playerId, sessionId); }
    catch (e: any) {
      setError(e?.message ?? 'Delete failed');
      void reload();
    }
  }, [playerId, reload]);

  return { items, loading, error, reload, remove };
}
