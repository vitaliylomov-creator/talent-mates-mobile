import { supabase } from './supabase';
import type { ChatMessage, ConversationSummary, ResolvedAgent } from './types';

// Rows we read from the `conversations` table that mate-chat writes to.
interface ConversationRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_type: ResolvedAgent | null;
  created_at: string;
  had_real_time_data?: boolean | null;
}

/**
 * Fetches the player's recent conversations, groups them by session_id, and
 * returns a summary per session sorted by recency. Title is the first user
 * message of the session (truncated).
 *
 * Pilot-scale approach: fetch up to 300 rows and group client-side. We'll
 * promote to a Postgres RPC once any player goes over a few dozen sessions.
 */
export async function fetchConversationSummaries(playerId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, session_id, role, content, agent_type, created_at')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) throw error;
  const rows = (data ?? []) as ConversationRow[];

  const groups = new Map<string, ConversationRow[]>();
  for (const r of rows) {
    const arr = groups.get(r.session_id);
    if (arr) arr.push(r);
    else groups.set(r.session_id, [r]);
  }

  const summaries: ConversationSummary[] = [];
  for (const [session_id, sessionRows] of groups.entries()) {
    // sessionRows are still in DESC order from the query.
    const newest = sessionRows[0];
    // Walk DESC list backwards to find the first user message chronologically.
    const firstUser = [...sessionRows].reverse().find((r) => r.role === 'user');
    summaries.push({
      session_id,
      title: truncate(firstUser?.content ?? newest.content ?? 'Conversation', 70),
      last_message_at: newest.created_at,
      agent_type: newest.agent_type ?? null,
    });
  }

  summaries.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  return summaries;
}

/**
 * Loads every message for a given session, oldest first (display order).
 */
export async function fetchSessionMessages(playerId: string, sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, role, content, agent_type, created_at')
    .eq('player_id', playerId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  type Row = Pick<ConversationRow, 'id' | 'role' | 'content' | 'agent_type' | 'created_at'>;
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    agentType: r.agent_type ?? undefined,
    liveData: undefined, // not persisted in DB
    createdAt: r.created_at,
  }));
}

export async function deleteSession(playerId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('player_id', playerId)
    .eq('session_id', sessionId);
  if (error) throw error;
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim();
  if (trimmed.length <= n) return trimmed;
  return trimmed.slice(0, n).trimEnd() + '…';
}
