import { supabase } from './supabase';

// Column names match what mate-chat reads in tool_player_training_log.
// Don't rename without updating the Mate edge function in lockstep.
export type SessionType = 'technical' | 'strength' | 'speed' | 'endurance' | 'match' | 'recovery';

export interface TrainingLogInput {
  session_date: string;        // YYYY-MM-DD
  session_type: SessionType;
  duration_minutes?: number | null;
  intensity?: number | null;       // RPE 1-10
  fatigue_level?: number | null;   // 1-10
  recovery_status?: string | null;
  exercises?: string | null;
  top_speed_kmh?: number | null;
  sleep_hours?: number | null;
  injury_area?: string | null;
  injury_severity?: number | null; // 1-10
  personal_notes?: string | null;
  coach_feedback?: string | null;
}

export interface TrainingLogRow extends TrainingLogInput {
  id: string;
  player_id: string;
  created_at: string;
}

export async function saveTrainingLog(playerId: string, log: TrainingLogInput) {
  const cleaned: Record<string, unknown> = { player_id: playerId };
  for (const [k, v] of Object.entries(log)) {
    if (v !== '' && v !== null && v !== undefined) cleaned[k] = v;
  }
  return supabase.from('training_logs').insert(cleaned).select().single();
}

export async function fetchTrainingLogs(playerId: string, limit = 30): Promise<TrainingLogRow[]> {
  const { data, error } = await supabase
    .from('training_logs')
    .select('*')
    .eq('player_id', playerId)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TrainingLogRow[];
}
