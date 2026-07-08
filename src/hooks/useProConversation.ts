import { useCallback, useEffect, useState } from 'react';
import { newId } from '../lib/uuid';
import { callMateProChat, type ProSubAgent } from '../lib/agent';
import { fetchProMessages, type ProMessage } from '../lib/conversations-pro';
import { track, EVT } from '../lib/analytics';

interface State {
  conversationId: string | null;
  clientId: string | null;
  messages: ProMessage[];
  sending: boolean;
  loading: boolean;
  error: string | null;
}

interface Options {
  initialConversationId?: string | null;
  initialClientId?: string | null;
}

/**
 * State + actions for a single Agent chat surface. conversation_id is
 * null for a fresh thread and is filled from the server's response on
 * the first send. When loading a historical conversation, pass its id
 * via loadConversation() to hydrate the message list.
 */
export function useProConversation(options: Options = {}) {
  const [state, setState] = useState<State>({
    conversationId: options.initialConversationId ?? null,
    clientId: options.initialClientId ?? null,
    messages: [],
    sending: false,
    loading: false,
    error: null,
  });

  // Hydrate messages when conversationId is known from the start.
  useEffect(() => {
    const cid = options.initialConversationId;
    if (!cid) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchProMessages(cid).then(
      (msgs) => {
        if (cancelled) return;
        setState((s) => ({ ...s, messages: msgs, loading: false }));
      },
      (e: any) => {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: e?.message ?? 'Load failed' }));
      },
    );
    return () => { cancelled = true; };
  }, [options.initialConversationId]);

  const send = useCallback(async (text: string, subAgent: ProSubAgent) => {
    const optimistic: ProMessage = {
      id: newId(),
      role: 'user',
      content: text,
      subAgent: null,
      attachmentType: null,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, optimistic],
      sending: true,
      error: null,
    }));

    try {
      const res = await callMateProChat({
        conversation_id: state.conversationId,
        client_id: state.clientId,
        sub_agent: subAgent,
        message: text,
      });

      const assistant: ProMessage = {
        id: res.message_id,
        role: 'assistant',
        content: res.response,
        subAgent: res.sub_agent,
        attachmentType: null,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        conversationId: res.conversation_id,
        messages: [...prev.messages, assistant],
        sending: false,
      }));

      track(EVT.proChatSent, {
        sub_agent_selected: subAgent,
        sub_agent_resolved: res.sub_agent,
        iterations: res.iterations,
        tools_used_count: res.tools_used?.length ?? 0,
        input_tokens: res.input_tokens,
        output_tokens: res.output_tokens,
        chars: text.length,
      });
    } catch (e: any) {
      const msg = e?.message ?? 'Unknown error';
      setState((prev) => ({ ...prev, sending: false, error: msg }));
      track(EVT.proChatFailed, { message: msg });
    }
  }, [state.conversationId, state.clientId]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setState((s) => ({ ...s, loading: true, conversationId, error: null }));
    try {
      const msgs = await fetchProMessages(conversationId);
      setState((s) => ({ ...s, messages: msgs, loading: false }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? 'Load failed' }));
    }
  }, []);

  const startNew = useCallback(() => {
    setState({
      conversationId: null,
      clientId: null,
      messages: [],
      sending: false,
      loading: false,
      error: null,
    });
  }, []);

  const setClient = useCallback((clientId: string | null) => {
    setState((s) => ({ ...s, clientId }));
  }, []);

  return {
    ...state,
    send,
    loadConversation,
    startNew,
    setClient,
  };
}
