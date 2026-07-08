import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { t } from '../../../src/constants/strings';
import { usePlayerLang } from '../../../src/hooks/usePlayerLang';
import { usePlayer } from '../../../src/hooks/usePlayer';
import { saveTrainingLog, type TrainingLogInput, type SessionType } from '../../../src/lib/training';
import { track, EVT } from '../../../src/lib/analytics';

import { FormField } from '../../../src/components/FormField';
import { SegmentedPicker } from '../../../src/components/SegmentedPicker';
import { Scale1to10 } from '../../../src/components/Scale1to10';
import { PillButton } from '../../../src/components/PillButton';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTrainingLog() {
  const router = useRouter();
  const lang = usePlayerLang();
  const { player } = usePlayer();

  const [draft, setDraft] = useState<TrainingLogInput>({
    session_date: todayISO(),
    session_type: 'technical',
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TrainingLogInput>(key: K, val: TrainingLogInput[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const intOrNull = (v: string): number | null => {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };
  const floatOrNull = (v: string): number | null => {
    const n = parseFloat(v.replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const sessionTypes: ReadonlyArray<{ value: SessionType; label: string }> = lang === 'ua'
    ? [
        { value: 'technical', label: 'Поле' },
        { value: 'strength',  label: 'Зал' },
        { value: 'speed',     label: 'Спринт' },
        { value: 'endurance', label: 'Витривалість' },
        { value: 'match',     label: 'Матч' },
        { value: 'recovery',  label: 'Відновлення' },
      ]
    : [
        { value: 'technical', label: 'Pitch' },
        { value: 'strength',  label: 'Gym' },
        { value: 'speed',     label: 'Sprint' },
        { value: 'endurance', label: 'Endurance' },
        { value: 'match',     label: 'Match' },
        { value: 'recovery',  label: 'Recovery' },
      ];

  const handleSave = async () => {
    if (!player) return;
    setSaving(true);
    const { error } = await saveTrainingLog(player.id, draft);
    setSaving(false);
    if (error) {
      Alert.alert(t('errorGeneric', lang), error.message);
      return;
    }
    track(EVT.trainingLogged, {
      session_type: draft.session_type,
      rpe: draft.intensity ?? null,
      fatigue: draft.fatigue_level ?? null,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={24} color={theme.colors.t1} />
        </Pressable>
        <Text style={styles.title}>{lang === 'ua' ? 'Нова тренування' : 'New session'}</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Session */}
          <Section title={lang === 'ua' ? 'Сесія' : 'Session'}>
            <SegmentedPicker
              label={lang === 'ua' ? 'Тип' : 'Type'}
              value={draft.session_type}
              options={sessionTypes}
              onChange={(v) => set('session_type', v)}
              scrollable
            />
            <FormField
              label={lang === 'ua' ? 'Дата' : 'Date'}
              value={draft.session_date}
              onChangeText={(v) => set('session_date', v)}
              placeholder="2026-06-21"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label={lang === 'ua' ? 'Тривалість (хв)' : 'Duration (min)'}
              value={draft.duration_minutes != null ? String(draft.duration_minutes) : ''}
              onChangeText={(v) => set('duration_minutes', intOrNull(v))}
              placeholder="90"
              keyboardType="number-pad"
              maxLength={3}
            />
          </Section>

          {/* Effort */}
          <Section title={lang === 'ua' ? 'Навантаження' : 'Effort'}>
            <Scale1to10
              label={lang === 'ua' ? 'Інтенсивність (RPE)' : 'Intensity (RPE)'}
              value={draft.intensity ?? null}
              onChange={(v) => set('intensity', v)}
              hintLow={lang === 'ua' ? 'легко' : 'easy'}
              hintHigh={lang === 'ua' ? 'на межі' : 'all-out'}
            />
            <FormField
              label={lang === 'ua' ? 'Топ-швидкість (км/год)' : 'Top speed (km/h)'}
              value={draft.top_speed_kmh != null ? String(draft.top_speed_kmh) : ''}
              onChangeText={(v) => set('top_speed_kmh', floatOrNull(v))}
              placeholder="32.5"
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <FormField
              label={lang === 'ua' ? 'Що робив' : 'Exercises'}
              value={draft.exercises ?? ''}
              onChangeText={(v) => set('exercises', v)}
              placeholder={lang === 'ua' ? '6×40м спринти, 1v1, тактика' : '6×40m sprints, 1v1, tactical'}
              multiline
              numberOfLines={3}
            />
          </Section>

          {/* Recovery & body */}
          <Section title={lang === 'ua' ? 'Відновлення' : 'Recovery'}>
            <FormField
              label={lang === 'ua' ? 'Сон (год)' : 'Sleep (h)'}
              value={draft.sleep_hours != null ? String(draft.sleep_hours) : ''}
              onChangeText={(v) => set('sleep_hours', floatOrNull(v))}
              placeholder="7.5"
              keyboardType="decimal-pad"
              maxLength={4}
            />
            <Scale1to10
              label={lang === 'ua' ? 'Втома' : 'Fatigue'}
              value={draft.fatigue_level ?? null}
              onChange={(v) => set('fatigue_level', v)}
              hintLow={lang === 'ua' ? 'свіжий' : 'fresh'}
              hintHigh={lang === 'ua' ? 'пустий' : 'empty'}
            />
            <FormField
              label={lang === 'ua' ? 'Стан відновлення' : 'Recovery status'}
              value={draft.recovery_status ?? ''}
              onChangeText={(v) => set('recovery_status', v)}
              placeholder={lang === 'ua' ? 'розтяжка + лід' : 'stretch + ice'}
            />
          </Section>

          {/* Injury */}
          <Section title={lang === 'ua' ? 'Травми' : 'Injury'}>
            <FormField
              label={lang === 'ua' ? 'Зона (або none)' : 'Area (or none)'}
              value={draft.injury_area ?? ''}
              onChangeText={(v) => set('injury_area', v)}
              placeholder={lang === 'ua' ? 'праве коліно' : 'right knee'}
              autoCapitalize="none"
            />
            <Scale1to10
              label={lang === 'ua' ? 'Серйозність' : 'Severity'}
              value={draft.injury_severity ?? null}
              onChange={(v) => set('injury_severity', v)}
            />
          </Section>

          {/* Notes */}
          <Section title={lang === 'ua' ? 'Замітки' : 'Notes'}>
            <FormField
              label={lang === 'ua' ? 'Для себе' : 'For yourself'}
              value={draft.personal_notes ?? ''}
              onChangeText={(v) => set('personal_notes', v)}
              placeholder={lang === 'ua' ? 'Що сьогодні було особливо.' : 'Anything notable today.'}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100 }}
            />
            <FormField
              label={lang === 'ua' ? 'Фідбек тренера' : 'Coach feedback'}
              value={draft.coach_feedback ?? ''}
              onChangeText={(v) => set('coach_feedback', v)}
              placeholder={lang === 'ua' ? 'Що сказав тренер.' : 'What the coach told you.'}
              multiline
              numberOfLines={3}
            />
          </Section>

          <View style={{ height: theme.spacing.md }} />
          <PillButton
            label={lang === 'ua' ? 'Записати' : 'Log session'}
            onPress={handleSave}
            loading={saving}
            disabled={!draft.session_date || !draft.session_type || saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.t1,
    letterSpacing: -0.3,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
