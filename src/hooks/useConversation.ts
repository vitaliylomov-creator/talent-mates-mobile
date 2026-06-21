import { useCallback, useState } from 'react';
import * as Crypto from 'expo-crypto';
import type { ChatMessage, AgentId } from '../lib/types';
import { callMateChat } from '../lib/mate-chat';
import { fetchSessionMessages } from '../lib/conversations';

interface State {
  sessionId: string;
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
}

function newSession(): string {
  return Crypto.randomUUID();
}

// Per-screen conversation state. The mate-chat edge function already persists
// messages to the `conversations` table, so this hook is purely UI state —
// D4 will add a history drawer that loads past sessions from the DB.
export function useConversation(playerId: string | null) {
  const [state, setState] = useState<State>(() => ({
    sessionId: newSession(),
    messages: [],
    sending: false,
    error: null,
  }));

  const startNew = useCallback(() => {
    setState({
      sessionId: newSession(),
      messages: [],
      sending: false,
      error: null,
    });
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!playerId) return;
    setState(prev => ({ ...prev, sessionId, sending: true, error: null }));
    try {
      const msgs = await fetchSessionMessages(playerId, sessionId);
      setState({ sessionId, messages: msgs, sending: false, error: null });
    } catch (e: any) {
      setState(prev => ({ ...prev, sending: false, error: e?.message ?? 'Load failed' }));
    }
  }, [playerId]);

  const append = useCallback((m: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { ...m, id: Crypto.randomUUID(), createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  const send = useCallback(async (text: string, agent: AgentId) => {
    if (!playerId) return;
    const userMsg: ChatMessage = {
      id: Crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      sending: true,
      error: null,
    }));

    try {
      const res = await callMateChat({
        message: text,
        player_id: playerId,
        session_id: state.sessionId,
        agent_type: agent,
      });
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: Crypto.randomUUID(),
            role: 'assistant',
            content: res.response,
            liveData: res.had_real_time_data,
            agentType: res.agent_type,
            createdAt: new Date().toISOString(),
          },
        ],
        sending: false,
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        sending: false,
        error: e?.message ?? 'Unknown error',
      }));
    }
  }, [playerId, state.sessionId]);

  return {
    sessionId: state.sessionId,
    messages: state.messages,
    sending: state.sending,
    error: state.error,
    send,
    append,
    startNew,
    loadSession,
  };
}
