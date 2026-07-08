import { supabase } from './supabase';
import type { ProSubAgent } from './agent';

export interface ProMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  subAgent: Exclude<ProSubAgent, 'auto'> | null;
  attachmentType: 'pdf' | 'video_analysis' | null;
  createdAt: string;
}

export interface ProConversationSummary {
  id: string;
  client_id: string | null;
  title: string | null;
  sub_agent: Exclude<ProSubAgent, 'auto'> | null;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sub_agent: Exclude<ProSubAgent, 'auto'> | null;
  attachment_type: 'pdf' | 'video_analysis' | null;
  created_at: string;
}

/**
 * Load every message in a conversation, oldest first for direct list render.
 * mate-pro-chat writes to mate_pro_messages with server-generated ids so we
 * don't have to reconcile optimistic user messages after refresh.
 */
export async function fetchProMessages(conversationId: string): Promise<ProMessage[]> {
  const { data, error } = await supabase
    .from('mate_pro_messages')
    .select('id, role, content, sub_agent, attachment_type, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    subAgent: r.sub_agent,
    attachmentType: r.attachment_type,
    createdAt: r.created_at,
  }));
}

/**
 * Recent conversations for the agent, newest first. Sprint 2 D4 uses this
 * to power the history drawer.
 */
export async function fetchProConversations(agentId: string, limit = 50): Promise<ProConversationSummary[]> {
  const { data, error } = await supabase
    .from('mate_pro_conversations')
    .select('id, client_id, title, sub_agent, message_count, last_message_at, created_at')
    .eq('agent_id', agentId)
    .order('last_message_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProConversationSummary[];
}

export async function deleteProConversation(conversationId: string) {
  // RLS scopes this to the requesting agent's rows only.
  const { error } = await supabase
    .from('mate_pro_conversations')
    .delete()
    .eq('id', conversationId);
  if (error) throw error;
}
