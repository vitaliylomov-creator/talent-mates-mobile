import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/lib/theme';
import { t } from '../../src/constants/strings';

// D1 placeholder: shows the brand splash so we can verify Inside Shell purple,
// DM Serif Display, italic accent, and pill button geometry render on device.
// D2 replaces this with the full auth flow (email/password + Google OAuth).
export default function SignIn() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.brand}>
        <Text style={styles.wordmark}>MATE</Text>
        <Text style={styles.tagline}>
          The race engineer{'\n'}<Text style={styles.italic}>for football.</Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={() => { /* wired in D2 */ }}
        >
          <Text style={styles.primaryLabel}>{t('authSignIn').toUpperCase()}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
          onPress={() => { /* wired in D2 */ }}
        >
          <Text style={styles.ghostLabel}>{t('authSignUp').toUpperCase()}</Text>
        </Pressable>

        <Text style={styles.brandline}>{t('brandLine')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.purple,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl * 2,
    paddingBottom: theme.spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  wordmark: {
    fontFamily: theme.fonts.display,
    fontSize: Platform.select({ ios: 96, android: 88 }),
    color: theme.colors.t1,
    letterSpacing: -2,
    lineHeight: Platform.select({ ios: 104, android: 96 }),
  },
  tagline: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t2,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 30,
  },
  italic: {
    fontFamily: theme.fonts.displayItalic,
    color: theme.colors.t3,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  primary: {
    height: 56,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2.5,
    color: theme.colors.purple,
  },
  ghost: {
    height: 56,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2.5,
    color: theme.colors.t1,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  brandline: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t4,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    letterSpacing: 0.3,
  },
});
