import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MateRole } from './agent';

// Persisted "which flow did the user choose?" — set by role.tsx, read by the
// root auth-gate to decide onboarding destination when session exists but
// neither product row (players / mate_pro_agents) has been created yet.

const KEY = 'mate_intent';

export async function setIntent(role: MateRole): Promise<void> {
  await AsyncStorage.setItem(KEY, role);
}

export async function getIntent(): Promise<MateRole | null> {
  const v = await AsyncStorage.getItem(KEY);
  if (v === 'player' || v === 'agent') return v;
  return null;
}

export async function clearIntent(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
