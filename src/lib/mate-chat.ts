import { supabase, SUPABASE } from './supabase';
import type { AgentId, ResolvedAgent } from './types';

export interface MateChatRequest {
  message: string;
  player_id: string;
  session_id: string;
  agent_type: AgentId;
  pdf_base64?: string;
  pdf_name?: string;
}

export interface MateChatResponse {
  response: string;
  agent_type: ResolvedAgent;
  had_real_time_data: boolean;
  had_pdf: boolean;
}

const ENDPOINT = `${SUPABASE.URL}/functions/v1/mate-chat`;

export async function callMateChat(req: MateChatRequest): Promise<MateChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mate-chat ${res.status}: ${text}`);
  }

  return res.json();
}
