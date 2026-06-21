import type { AgentId } from '../lib/types';

export interface AgentMeta {
  id: AgentId;
  label: string;
  emoji: string;
  desc: string;
}

// Pills are the only place emojis appear in the product (Hard Rule #9
// in sprint brief — matches web parity).
export const AGENTS: ReadonlyArray<AgentMeta> = [
  { id: 'auto',      label: 'Auto',      emoji: '◎',   desc: 'MATE decides' },
  { id: 'legal',     label: 'Legal',     emoji: '⚖️', desc: 'FIFA · contracts' },
  { id: 'coach',     label: 'Coach',     emoji: '🏋️', desc: 'Training · recovery' },
  { id: 'analyst',   label: 'Analyst',   emoji: '📊', desc: 'Market · transfers' },
  { id: 'concierge', label: 'Concierge', emoji: '🏠', desc: 'UK life · logistics' },
];
