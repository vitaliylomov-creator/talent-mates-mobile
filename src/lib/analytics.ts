// Thin wrapper over posthog-react-native so callers don't have to know
// whether analytics is configured or not. If the API key isn't set, every
// call is a no-op — pilot users without a PostHog project still get a
// working app.

let posthogInstance: any = null;

export function setAnalytics(instance: any) {
  posthogInstance = instance;
}

type Props = Record<string, string | number | boolean | null | undefined>;

export const track = (event: string, props?: Props) => {
  try { posthogInstance?.capture?.(event, props); } catch {}
};

export const identify = (id: string, props?: Props) => {
  try { posthogInstance?.identify?.(id, props); } catch {}
};

export const reset = () => {
  try { posthogInstance?.reset?.(); } catch {}
};

// Event name constants — keep in one place so we don't typo across files.
export const EVT = {
  signIn:         'sign_in_succeeded',
  signInFailed:   'sign_in_failed',
  signUp:         'sign_up_started',
  signUpConfirm:  'sign_up_email_sent',
  googleStart:    'google_oauth_started',
  onboardingDone: 'onboarding_completed',
  chatSent:       'chat_message_sent',
  chatError:      'chat_message_failed',
  voiceUsed:      'voice_input_transcribed',
  agentSwitched:  'agent_switched',
  trainingLogged: 'training_logged',
  sessionLoaded:  'history_session_loaded',
  sessionDeleted: 'history_session_deleted',
  proClicked:     'pro_clicked',
  proActivated:   'pro_activated',
  signOut:        'signed_out',

  // Agent flow (MATE Pro).
  agentRegistered:    'agent_registered',
  agentStep2Failed:   'agent_step2_failed',
  proChatSent:        'pro_chat_message_sent',
  proChatFailed:      'pro_chat_message_failed',
  proSubAgentSwitch:  'pro_sub_agent_switched',
  proSubscribeStart:  'pro_subscribe_started',
  proSubscribeDone:   'pro_subscribe_completed',
  proCancelStart:     'pro_cancel_initiated',
  proClientCreated:   'pro_client_created',
} as const;
