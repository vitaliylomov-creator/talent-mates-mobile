import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { OnboardingDraft } from '../lib/onboarding';

type Action =
  | { type: 'set'; patch: OnboardingDraft }
  | { type: 'reset' };

interface Ctx {
  draft: OnboardingDraft;
  set: (patch: OnboardingDraft) => void;
  reset: () => void;
}

const OnboardingContext = createContext<Ctx | null>(null);

function reducer(state: OnboardingDraft, action: Action): OnboardingDraft {
  switch (action.type) {
    case 'set': return { ...state, ...action.patch };
    case 'reset': return {};
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, {});
  const value = useMemo<Ctx>(() => ({
    draft,
    set: (patch) => dispatch({ type: 'set', patch }),
    reset: () => dispatch({ type: 'reset' }),
  }), [draft]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): Ctx {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
