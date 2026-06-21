export type AgentId = 'auto' | 'legal' | 'coach' | 'analyst' | 'concierge';
export type ResolvedAgent = Exclude<AgentId, 'auto'>;

export interface Player {
  id: string;
  email: string;
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  current_club: string | null;
  league: string | null;
  position: string | null;
  preferred_foot: 'left' | 'right' | 'both' | null;
  height_cm: number | null;
  weight_kg: number | null;
  contract_expiry: string | null;
  agent_name: string | null;
  language: 'en' | 'uk' | 'ru' | null;
  bio: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  liveData?: boolean;
  agentType?: ResolvedAgent;
  createdAt: string;
}

export interface ConversationSummary {
  session_id: string;
  title: string;
  last_message_at: string;
  agent_type: ResolvedAgent | null;
}

export interface Subscription {
  player_id: string;
  status: 'free' | 'pro';
  period_end: string | null;
}

export interface TrainingLog {
  id: string;
  player_id: string;
  session_date: string;
  rpe: number;
  sleep_hours: number | null;
  notes: string | null;
}
