import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';

import { theme } from '../../src/lib/theme';
import { t } from '../../src/constants/strings';
import { getLang } from '../../src/lib/lang';
import { signInWithEmail, signInWithGoogle } from '../../src/lib/auth';
import { track, EVT } from '../../src/lib/analytics';
import { BrandMark } from '../../src/components/BrandMark';
import { FormField } from '../../src/components/FormField';
import { PillButton } from '../../src/components/PillButton';
import { GoogleButton } from '../../src/components/GoogleButton';

export default function SignIn() {
  const router = useRouter();
  const lang = getLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error: authErr } = await signInWithEmail(email, password);
    setLoading(false);
    if (authErr) {
      setError(humanise(authErr.message, lang));
      track(EVT.signInFailed, { reason: authErr.message });
      return;
    }
    track(EVT.signIn, { method: 'email' });
    // Root layout sees the new session via useAuth and redirects.
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    track(EVT.googleStart);
    try {
      await signInWithGoogle();
      track(EVT.signIn, { method: 'google' });
    } catch (e: any) {
      setError(e?.message ?? t('errorGeneric', lang));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <BrandMark size="md" />
          </View>

          <View style={styles.form}>
            <FormField
              label={t('authEmail', lang)}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!loading}
            />
            <FormField
              label={t('authPassword', lang)}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => canSubmit && handleSignIn()}
              editable={!loading}
            />

            {error ? <Text style={styles.errorBox}>{error}</Text> : null}

            <PillButton
              label={t('authSignIn', lang)}
              onPress={handleSignIn}
              loading={loading}
              disabled={!canSubmit}
              style={{ marginTop: theme.spacing.sm }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('authOr', lang)}</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleButton
              label={t('authGoogle', lang)}
              onPress={handleGoogle}
              loading={googleLoading}
              disabled={loading}
            />
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              accessibilityRole="button"
            >
              <Text style={styles.footerText}>
                {t('authNoAccount', lang)} <Text style={styles.footerAccent}>{t('authSignUp', lang)}</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function humanise(supabaseMsg: string, lang: 'en' | 'ua'): string {
  const m = supabaseMsg.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return lang === 'ua' ? 'Email або пароль не той.' : 'Email or password is off.';
  }
  if (m.includes('email not confirmed')) {
    return t('authCheckEmail', lang);
  }
  if (m.includes('network')) return t('errorNetwork', lang);
  return supabaseMsg;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  brand: { alignItems: 'center', marginTop: theme.spacing.xxl, marginBottom: theme.spacing.xxl },
  form: { gap: 0 },
  errorBox: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    backgroundColor: 'rgba(255,93,108,0.10)',
    borderColor: theme.colors.danger,
    borderWidth: 0.5,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: theme.spacing.lg,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: theme.colors.border },
  dividerText: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    letterSpacing: 1.5,
    color: theme.colors.t4,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t3,
  },
  footerAccent: {
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.t1,
  },
});
