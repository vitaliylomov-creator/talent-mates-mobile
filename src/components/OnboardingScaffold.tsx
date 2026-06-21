import { ReactNode } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { t } from '../constants/strings';
import { getLang } from '../lib/lang';
import { PillButton } from './PillButton';

interface Props {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void | Promise<void>;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
  onSkip?: () => void;
}

const TOTAL = 5;

export function OnboardingScaffold({
  step, title, subtitle, children, onNext, nextDisabled, nextLoading, nextLabel, showSkip = true, onSkip,
}: Props) {
  const router = useRouter();
  const lang = getLang();
  const isFirst = step === 1;
  const isLast = step === 5;

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  };

  const handleSkip = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onSkip) return onSkip();
    void onNext();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        {isFirst ? <View style={styles.iconBtn} /> : (
          <Pressable onPress={handleBack} accessibilityLabel="Back" hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
            <Feather name="chevron-left" size={24} color={theme.colors.t1} />
          </Pressable>
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL) * 100}%` }]} />
        </View>
        {!isLast && showSkip ? (
          <Pressable onPress={handleSkip} accessibilityLabel="Skip" hitSlop={10}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.skipLabel}>{t('onboardingSkip', lang)}</Text>
          </Pressable>
        ) : <View style={styles.iconBtn} />}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepLabel}>
            {lang === 'ua' ? `${step} з ${TOTAL}` : `Step ${step} of ${TOTAL}`}
          </Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.form}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          <PillButton
            label={nextLabel ?? (isLast ? (lang === 'ua' ? 'Готово' : 'Done') : t('onboardingNext', lang))}
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
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  skipBtn: {
    height: 40,
    paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.t3,
    letterSpacing: 0.3,
  },
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
  stepLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.t1,
    letterSpacing: -0.7,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t2,
    marginTop: 10,
    lineHeight: 22,
  },
  form: { marginTop: theme.spacing.xl },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
});
