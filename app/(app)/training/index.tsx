import { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '../../../src/lib/theme';
import { t } from '../../../src/constants/strings';
import { usePlayerLang } from '../../../src/hooks/usePlayerLang';
import { relativeTime } from '../../../src/lib/time';
import { usePlayer } from '../../../src/hooks/usePlayer';
import { useTrainingLogs } from '../../../src/hooks/useTrainingLogs';
import type { TrainingLogRow } from '../../../src/lib/training';

const TYPE_LABEL: Record<string, { en: string; ua: string }> = {
  technical: { en: 'Pitch',     ua: 'Поле' },
  strength:  { en: 'Gym',       ua: 'Зал' },
  speed:     { en: 'Sprint',    ua: 'Спринт' },
  endurance: { en: 'Endurance', ua: 'Витривалість' },
  match:     { en: 'Match',     ua: 'Матч' },
  recovery:  { en: 'Recovery',  ua: 'Відновлення' },
};

export default function TrainingHistory() {
  const router = useRouter();
  const lang = usePlayerLang();
  const { player } = usePlayer();
  const { items, loading, reload } = useTrainingLogs(player?.id ?? null);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const handleNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(app)/training/new');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabTraining', lang)}</Text>
        <Pressable onPress={handleNew}
          accessibilityLabel="Log new session"
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
          <Feather name="plus" size={18} color={theme.colors.purple} />
          <Text style={styles.addLabel}>
            {lang === 'ua' ? 'Нова' : 'Log'}
          </Text>
        </Pressable>
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('emptyTraining', lang)}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.t2} />
          }
          renderItem={({ item }) => <TrainingItem item={item} lang={lang} />}
        />
      )}
    </SafeAreaView>
  );
}

function TrainingItem({ item, lang }: { item: TrainingLogRow; lang: 'en' | 'ua' }) {
  const typeLabel = TYPE_LABEL[item.session_type]?.[lang] ?? item.session_type;
  const chips: string[] = [];
  if (item.duration_minutes) chips.push(`${item.duration_minutes} ${lang === 'ua' ? 'хв' : 'min'}`);
  if (item.intensity) chips.push(`RPE ${item.intensity}`);
  if (item.fatigue_level) chips.push(`${lang === 'ua' ? 'Втома' : 'Fatigue'} ${item.fatigue_level}`);
  if (item.sleep_hours) chips.push(`${item.sleep_hours}h ${lang === 'ua' ? 'сну' : 'sleep'}`);
  if (item.top_speed_kmh) chips.push(`${item.top_speed_kmh} km/h`);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardType}>{typeLabel}</Text>
        <Text style={styles.cardDate}>{item.session_date}</Text>
      </View>
      {chips.length > 0 && (
        <View style={styles.chips}>
          {chips.map((c) => (
            <Text key={c} style={styles.chip}>{c}</Text>
          ))}
        </View>
      )}
      {item.injury_area && item.injury_area !== 'none' && (
        <Text style={styles.injury}>
          {lang === 'ua' ? 'Травма' : 'Injury'}: {item.injury_area}
          {item.injury_severity ? ` · ${item.injury_severity}/10` : ''}
        </Text>
      )}
      {item.personal_notes && <Text style={styles.notes}>{item.personal_notes}</Text>}
      <Text style={styles.meta}>{relativeTime(item.created_at, lang)}</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.t1,
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
  },
  addLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    color: theme.colors.purple,
    textTransform: 'uppercase',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: {
    fontFamily: theme.fonts.body, fontSize: 15,
    color: theme.colors.t3, textAlign: 'center', lineHeight: 22,
  },
  list: { padding: theme.spacing.md, gap: 10 },
  card: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  cardType: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 16, color: theme.colors.t1,
  },
  cardDate: {
    fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.t3,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    fontFamily: theme.fonts.body, fontSize: 12,
    color: theme.colors.t2,
    backgroundColor: theme.colors.glassHover,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    overflow: 'hidden',
  },
  injury: {
    fontFamily: theme.fonts.body, fontSize: 13,
    color: theme.colors.warning, marginTop: 6,
  },
  notes: {
    fontFamily: theme.fonts.body, fontSize: 14,
    color: theme.colors.t2, marginTop: 8, lineHeight: 20,
  },
  meta: {
    fontFamily: theme.fonts.body, fontSize: 11,
    color: theme.colors.t4, marginTop: 8,
  },
});
