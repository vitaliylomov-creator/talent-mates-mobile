import { useCallback, useEffect, useState } from 'react';
import { fetchTrainingLogs, type TrainingLogRow } from '../lib/training';

export function useTrainingLogs(playerId: string | null) {
  const [items, setItems] = useState<TrainingLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!playerId) { setItems([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrainingLogs(playerId);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => { void reload(); }, [reload]);

  return { items, loading, error, reload };
}
