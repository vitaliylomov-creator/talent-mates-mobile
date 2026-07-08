import { useCallback, useEffect, useState } from 'react';
import { fetchClients, type Client } from '../lib/agent';

export function useClients(agentId: string | null | undefined) {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!agentId) { setItems([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(agentId);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { void reload(); }, [reload]);

  return { items, loading, error, reload };
}

export function useClient(clientId: string | null | undefined, items: Client[]): Client | null {
  if (!clientId) return null;
  return items.find((c) => c.id === clientId) ?? null;
}
