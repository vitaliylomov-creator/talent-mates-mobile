import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { theme } from '../../src/lib/theme';
import { t } from '../../src/constants/strings';
import { getLang } from '../../src/lib/lang';
import { signUpWithEmail, signInWithGoogle } from '../../src/lib/auth';
import { BrandMark } from '../../src/components/BrandMark';
import { FormField } from '../../src/components/FormField';
import { PillButton } from '../../src/components/PillButton';
import { GoogleButton } from '../../src/components/GoogleButton';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const router = useRouter();
  const lang = getLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const emailOk = EMAIL_RE.test(email.trim());
  const passwordOk = password.length >= 6;
  const canSubmit = emailOk && passwordOk && !loading;

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    const { data, error: authErr } = await signUpWithEmail(email, password);
    setLoading(false);
    if (authErr) {
      setError(humanise(authErr.message, lang));
      return;
    }
    // If Supabase has email confirmation ON, session is null and we surface
    // the "check your inbox" line. If confirmation is OFF, session is created
    // immediately and the root layout redirects.
    if (!data.session) {
      setConfirmationSent(true);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? t('errorGeneric', lang));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.confirmWrap}>
          <Text style={styles.confirmIcon}>·</Text>
          <Text style={styles.confirmTitle}>{lang === 'ua' ? 'Майже все.' : 'Almost there.'}</Text>
          <Text style={styles.confirmBody}>{t('authCheckEmail', lang)}</Text>
          <Text style={styles.confirmEmail}>{email.trim().toLowerCase()}</Text>

          <View style={{ width: '100%', marginTop: theme.spacing.xxl }}>
            <PillButton
              label={t('authSignIn', lang)}
              variant="ghost"
              onPress={() => router.replace('/(auth)/sign-in')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              error={email.length > 0 && !emailOk ? t('authInvalidEmail', lang) : undefined}
            />
            <FormField
              label={t('authPassword', lang)}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={() => canSubmit && handleSignUp()}
              editable={!loading}
              error={password.length > 0 && !passwordOk ? t('authMinChars', lang) : undefined}
            />

            {error ? <Text style={styles.errorBox}>{error}</Text> : null}

            <PillButton
              label={t('authSignUp', lang)}
              onPress={handleSignUp}
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
              onPress={() => router.replace('/(auth)/sign-in')}
              accessibilityRole="button"
            >
              <Text style={styles.footerText}>
                {t('authHaveAccount', lang)} <Text style={styles.footerAccent}>{t('authSignIn', lang)}</Text>
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
  if (m.includes('already') || m.includes('exists')) {
    return lang === 'ua' ? 'Цей email вже в системі. Спробуй увійти.' : 'That email is already in. Try signing in.';
  }
  if (m.includes('password')) {
    return t('authMinChars', lang);
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
  footer: { alignItems: 'center', marginTop: theme.spacing.xl },
  footerText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t3,
  },
  footerAccent: {
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.t1,
  },
  confirmWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  confirmIcon: {
    fontFamily: theme.fonts.display,
    fontSize: 56,
    color: theme.colors.accentGreen,
    marginBottom: theme.spacing.lg,
  },
  confirmTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.t1,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
  },
  confirmBody: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t2,
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmEmail: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.t1,
    marginTop: theme.spacing.md,
    letterSpacing: 0.3,
  },
});
