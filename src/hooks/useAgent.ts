import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { fetchAgent, fetchAgentSubscription, type Agent, type AgentSubscription } from '../lib/agent';

export function useAgent() {
  const { session } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session) return null;
    const row = await fetchAgent(session.user.id);
    setAgent(row);
    return row;
  }, [session?.user.id]);

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

  return { agent, loading, refetch };
}

export function useAgentSubscription(agentId: string | null | undefined) {
  const [subscription, setSubscription] = useState<AgentSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!agentId) return null;
    const row = await fetchAgentSubscription(agentId);
    setSubscription(row);
    return row;
  }, [agentId]);

  useEffect(() => {
    if (!agentId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchAgentSubscription(agentId).then((row) => {
      if (cancelled) return;
      setSubscription(row);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [agentId]);

  return { subscription, loading, refetch };
}
