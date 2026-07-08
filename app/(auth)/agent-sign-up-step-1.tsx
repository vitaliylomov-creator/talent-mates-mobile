import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking as RNLinking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AgentAuthScaffold } from '../../src/components/AgentAuthScaffold';
import { FormField } from '../../src/components/FormField';
import { signUpWithEmail } from '../../src/lib/auth';
import { setIntent } from '../../src/lib/intent';
import { theme } from '../../src/lib/theme';
import { getLang } from '../../src/lib/lang';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Step 1 of agent registration: create the auth.users row. Step 2 collects
// FFAR profile after Supabase returns the session.
export default function AgentSignUpStep1() {
  const router = useRouter();
  const lang = getLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = EMAIL_RE.test(email.trim());
  const passwordOk = password.length >= 8;
  const canSubmit = emailOk && passwordOk && terms && !loading;

  const handleSubmit = async () => {
    setError(null);
    // Persist intent so the auth gate sends the new user to step-2, not to
    // the player onboarding flow.
    await setIntent('agent');
    setLoading(true);
    const { data, error: err } = await signUpWithEmail(email, password);
    setLoading(false);

    if (err) {
      setError(humanise(err.message, lang));
      return;
    }
    // Session should exist immediately (this project has email confirm off).
    // Auth gate picks up the new session and routes to step-2 based on intent.
    if (data.session) {
      router.replace('/(auth)/agent-sign-up-step-2' as never);
    } else {
      // Fallback: confirmation email was sent — surface guidance.
      setError(lang === 'ua'
        ? 'Перевір пошту — я скинув лінк для активації.'
        : 'Check your inbox — I sent an activation link.');
    }
  };

  return (
    <AgentAuthScaffold
      step={1}
      eyebrow="MATE PRO"
      title={lang === 'ua' ? 'Створи акаунт агента.' : 'Create your agent account.'}
      subtitle={lang === 'ua'
        ? 'Пошта, пароль, згода з умовами. Далі — FFAR ліцензія.'
        : 'Email, password, terms. Then FFAR licence.'}
      onNext={handleSubmit}
      nextLabel={lang === 'ua' ? 'Далі' : 'Continue'}
      nextDisabled={!canSubmit}
      nextLoading={loading}
    >
      <FormField
        label={lang === 'ua' ? 'Email' : 'Email'}
        value={email}
        onChangeText={setEmail}
        placeholder="you@agency.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        editable={!loading}
        error={email.length > 0 && !emailOk
          ? (lang === 'ua' ? 'Email щось не той.' : 'That email looks off.')
          : undefined}
      />
      <FormField
        label={lang === 'ua' ? 'Пароль' : 'Password'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        error={password.length > 0 && !passwordOk
          ? (lang === 'ua' ? 'Мінімум 8 символів.' : 'At least 8 characters.')
          : undefined}
      />

      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setTerms((v) => !v);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: terms }}
        style={({ pressed }) => [styles.termsRow, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.checkbox, terms && styles.checkboxActive]}>
          {terms && <Feather name="check" size={14} color={theme.colors.purple} />}
        </View>
        <Text style={styles.termsText}>
          {lang === 'ua' ? (
            <>Погоджуюсь з <Text style={styles.termsLink}
              onPress={() => RNLinking.openURL('https://talent-mates.com/terms')}>умовами</Text>
              {' '}та{' '}
              <Text style={styles.termsLink}
                onPress={() => RNLinking.openURL('https://talent-mates.com/privacy')}>політикою конфіденційності</Text>.</>
          ) : (
            <>I agree to the <Text style={styles.termsLink}
              onPress={() => RNLinking.openURL('https://talent-mates.com/terms')}>Terms</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}
                onPress={() => RNLinking.openURL('https://talent-mates.com/privacy')}>Privacy Policy</Text>.</>
          )}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <Text style={styles.footerLine}>
          {lang === 'ua' ? 'Вже є акаунт?' : 'Have an account?'}{' '}
          <Text style={styles.footerLink} onPress={() => router.replace('/(auth)/sign-in')}>
            {lang === 'ua' ? 'Увійти' : 'Sign in'}
          </Text>
        </Text>
      </View>
    </AgentAuthScaffold>
  );
}

function humanise(supabaseMsg: string, lang: 'en' | 'ua'): string {
  const m = supabaseMsg.toLowerCase();
  if (m.includes('already') || m.includes('exists')) {
    return lang === 'ua'
      ? 'Цей email вже в системі. Спробуй увійти.'
      : 'That email is already in. Try signing in.';
  }
  if (m.includes('password')) {
    return lang === 'ua' ? 'Мінімум 8 символів.' : 'At least 8 characters.';
  }
  if (m.includes('network')) {
    return lang === 'ua' ? 'Сигнал зник. Як з’явиться — продовжимо.' : 'No signal. Reconnect and we’re back.';
  }
  return supabaseMsg;
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: theme.spacing.md,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 0.5, borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.glass,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
  },
  termsText: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.t2,
  },
  termsLink: {
    color: theme.colors.t1,
    fontFamily: theme.fonts.bodyMedium,
    textDecorationLine: 'underline',
  },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    marginTop: theme.spacing.md,
    lineHeight: 18,
  },
  footer: { marginTop: theme.spacing.xl, alignItems: 'center' },
  footerLine: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t3,
  },
  footerLink: {
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.t1,
  },
});
