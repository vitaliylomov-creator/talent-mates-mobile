// Types and query helpers for the Agent (MATE Pro) flow. See
// MATE_PRO_MOBILE_BRIEFING.md at repo root for the full contract with the
// server. Column names come straight from the live production schema on
// project zlkzjeaojpxzccpovygk (mate_pro_* tables).

import { supabase, SUPABASE } from './supabase';

export type MateRole = 'player' | 'agent';

// ─── mate_pro_agents ────────────────────────────────────────────────────
export interface Agent {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  ffar_licence: string;
  ffar_country: string;
  ffar_verified: boolean;
  ffar_verified_at: string | null;
  agency_name: string | null;
  country_of_operation: string | null;
  years_experience: number | null;
  specialisation: string | null;
  founding_number: number | null;
  is_founding: boolean;
  founding_window_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── mate_pro_clients ───────────────────────────────────────────────────
export type ClientPosition =
  | 'Goalkeeper' | 'Right Back' | 'Left Back' | 'Centre Back'
  | 'Defensive Midfielder' | 'Central Midfielder' | 'Attacking Midfielder'
  | 'Right Winger' | 'Left Winger' | 'Second Striker' | 'Centre Forward';

export type ClientFoot = 'Right' | 'Left' | 'Both';
export type ClientStatus = 'active' | 'prospect' | 'dormant';

export interface Client {
  id: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position_primary: ClientPosition | null;
  dominant_foot: ClientFoot | null;
  current_club: string | null;
  current_league: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  contract_expires: string | null;
  status: ClientStatus;
  representation_notes: string | null;
  commission_pct: number | null;
  career_history: string | null;
  notes_for_mate: string | null;
  created_at: string;
  updated_at: string;
}

// ─── mate_pro_subscriptions ─────────────────────────────────────────────
export type SubscriptionPlan = 'founding' | 'standard';
export type SubscriptionStatus =
  | 'trialing' | 'active' | 'past_due' | 'canceled'
  | 'incomplete' | 'incomplete_expired' | 'unpaid';

export interface AgentSubscription {
  id: string;
  agent_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Chat types (mate-pro-chat request/response) ────────────────────────
export type ProSubAgent = 'auto' | 'legal' | 'coach' | 'analyst' | 'concierge';

export interface MateProChatRequest {
  conversation_id: string | null;
  client_id: string | null;
  sub_agent: ProSubAgent;
  message: string;
  pdf_base64?: string;
  pdf_name?: string;
}

export interface MateProChatResponse {
  conversation_id: string;
  message_id: string;
  sub_agent: Exclude<ProSubAgent, 'auto'>;
  response: string;
  tools_used: string[];
  iterations: number;
  input_tokens: number;
  output_tokens: number;
  had_pdf: boolean;
  had_tool_use: boolean;
}

// ─── Query helpers ──────────────────────────────────────────────────────

/**
 * Read the agent row for the current authenticated user. Returns null if the
 * user hasn't completed step-2 (FFAR profile) or isn't an agent at all.
 */
export async function fetchAgent(userId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('mate_pro_agents')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[fetchAgent]', error.message);
    return null;
  }
  return (data as Agent | null) ?? null;
}

/**
 * mate-pro-complete-profile step 2 of registration. Server assigns
 * founding_number atomically (1..100 or null after cap).
 */
export interface CompleteProfileInput {
  first_name: string;
  last_name: string;
  ffar_licence: string;
  ffar_country: string;
}
export interface CompleteProfileResponse {
  agent_id: string;
  founding_number: number | null;
  is_founding: boolean;
  email: string;
}

export async function completeAgentProfile(
  body: CompleteProfileInput,
): Promise<CompleteProfileResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE.URL}/functions/v1/mate-pro-complete-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE.ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`complete-profile ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * mate-pro-chat — one-shot request, non-streaming response.
 */
export async function callMateProChat(req: MateProChatRequest): Promise<MateProChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE.URL}/functions/v1/mate-pro-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE.ANON_KEY,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mate-pro-chat ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Client CRUD ────────────────────────────────────────────────────────

export async function fetchClients(agentId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('mate_pro_clients')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function createClient(
  agentId: string,
  input: Omit<Client, 'id' | 'agent_id' | 'created_at' | 'updated_at'>,
) {
  const cleaned: Record<string, unknown> = { agent_id: agentId };
  for (const [k, v] of Object.entries(input)) {
    if (v !== '' && v !== null && v !== undefined) cleaned[k] = v;
  }
  return supabase.from('mate_pro_clients').insert(cleaned).select().single();
}

// ─── Subscription snapshot ──────────────────────────────────────────────

export async function fetchAgentSubscription(agentId: string): Promise<AgentSubscription | null> {
  const { data, error } = await supabase
    .from('mate_pro_subscriptions')
    .select('*')
    .eq('agent_id', agentId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('[fetchAgentSubscription]', error.message);
    return null;
  }
  return (data as AgentSubscription | null) ?? null;
}

// ─── Editable agent fields (post-registration) ──────────────────────────
// FFAR licence/country stay read-only — those are verified externally and
// changing them mid-subscription needs an admin action anyway.
export type AgentEditable = Partial<Pick<Agent,
  | 'first_name' | 'last_name'
  | 'agency_name' | 'country_of_operation'
  | 'years_experience' | 'specialisation'
>>;

export async function updateAgent(agentId: string, patch: AgentEditable) {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    // Empty strings → null so the DB clears the field cleanly.
    cleaned[k] = v === '' ? null : v;
  }
  return supabase
    .from('mate_pro_agents')
    .update(cleaned)
    .eq('id', agentId)
    .select()
    .single();
}

// ─── Subscription lifecycle via edge functions ──────────────────────────
export interface CreateCheckoutResponse {
  url: string;
  session_id: string;
  plan: SubscriptionPlan;
  price_eur: 149 | 299;
  trial_days: number;
}

export async function createCheckout(): Promise<CreateCheckoutResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE.URL}/functions/v1/mate-pro-create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE.ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`create-checkout ${res.status}: ${text}`);
  }
  return res.json();
}

export async function cancelSubscription(): Promise<{ ok: true; cancel_at: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE.URL}/functions/v1/mate-pro-cancel-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE.ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`cancel-subscription ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Full GDPR erasure. Wipes storage frames + all mate_pro_* rows (via auth.users
 * cascade) + auth.users row itself. Founding slot stays consumed.
 * Client MUST sign out after this call — the session's user is gone.
 */
export async function deleteAgentAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE.URL}/functions/v1/mate-pro-delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE.ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`delete-account ${res.status}: ${text}`);
  }
}
