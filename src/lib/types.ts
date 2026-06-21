export type AgentId = 'auto' | 'legal' | 'coach' | 'analyst' | 'concierge';
export type ResolvedAgent = Exclude<AgentId, 'auto'>;

// Column names match the existing production `players` table on Supabase
// project zlkzjeaojpxzccpovygk. Verified against mate-chat edge function
// in the Mate repo (player.X field accesses).
export interface Player {
  id: string;
  email: string;
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  current_country: string | null;
  current_club: string | null;
  current_league: string | null;
  position_primary: string | null;
  dominant_foot: 'left' | 'right' | 'both' | null;
  height_cm: number | null;
  weight_kg: number | null;
  contract_expires: string | null;
  agent_name: string | null;
  language_preference: 'en' | 'uk' | 'ru' | null;
  languages: string[] | null;
  career_history: string | null;
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
