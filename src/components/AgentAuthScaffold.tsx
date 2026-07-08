import { ReactNode } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { PillButton } from './PillButton';

// Two-step agent registration shares this scaffold with the existing
// OnboardingScaffold (player 5-step). Simpler because agents have exactly
// two screens and no skip semantics — you can't be a half-registered agent.
interface Props {
  step: 1 | 2;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void | Promise<void>;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
}

const TOTAL = 2;

export function AgentAuthScaffold({
  step, eyebrow, title, subtitle, children,
  onNext, nextLabel, nextDisabled, nextLoading, showBack = true,
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        {showBack ? (
          <Pressable onPress={handleBack} accessibilityLabel="Back" hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
            <Feather name="chevron-left" size={24} color={theme.colors.t1} />
          </Pressable>
        ) : <View style={styles.iconBtn} />}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL) * 100}%` }]} />
        </View>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.form}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          <PillButton
            label={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.glass,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 2,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  eyebrow: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 4,
    color: theme.colors.accentGreen,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 40,
    color: theme.colors.t1,
    letterSpacing: -0.7,
    lineHeight: 46,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t2,
    marginTop: 12,
    lineHeight: 22,
  },
  form: { marginTop: theme.spacing.xl },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
});
