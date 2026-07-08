import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { t } from '../../../src/constants/strings';
import { usePlayerLang } from '../../../src/hooks/usePlayerLang';
import { useAuth } from '../../../src/hooks/useAuth';
import { usePlayer } from '../../../src/hooks/usePlayer';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { signOut } from '../../../src/lib/auth';
import { savePlayerProfile, type OnboardingDraft } from '../../../src/lib/onboarding';
import type { Player } from '../../../src/lib/types';

import { FormField } from '../../../src/components/FormField';
import { SegmentedPicker } from '../../../src/components/SegmentedPicker';
import { PillButton } from '../../../src/components/PillButton';
import { ProBadge } from '../../../src/components/ProBadge';

export default function Profile() {
  const router = useRouter();
  const lang = usePlayerLang();
  const { session } = useAuth();
  const { player, loading } = usePlayer();
  const { isPro } = useSubscription();
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [saving, setSaving] = useState(false);

  const email = session?.user.email ?? '';

  useEffect(() => {
    if (player) {
      const { id: _id, created_at: _ca, ...rest } = player;
      setDraft(rest);
    }
  }, [player?.id]);

  const set = <K extends keyof OnboardingDraft>(k: K, v: OnboardingDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    if (!player) return;
    setSaving(true);
    const { error } = await savePlayerProfile(player.id, draft);
    setSaving(false);
    if (error) {
      Alert.alert(t('errorGeneric', lang), error.message);
      return;
    }
    Alert.alert('', t('profileSaved', lang));
  };

  const handleSignOut = () => {
    Alert.alert(
      lang === 'ua' ? 'Вийти?' : 'Sign out?',
      lang === 'ua' ? 'Зможеш повернутись.' : 'You can come back any time.',
      [
        { text: lang === 'ua' ? 'Скасувати' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ua' ? 'Вийти' : 'Sign out',
          style: 'destructive',
          onPress: () => { void signOut(); },
        },
      ],
    );
  };

  const initial = (player?.full_name ?? email ?? '?').trim().charAt(0).toUpperCase();
  const intOrNull = (v: string): number | null => {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };

  const positions = lang === 'ua' ? [
    { value: 'goalkeeper',  label: 'Воротар' },
    { value: 'defender',    label: 'Захисник' },
    { value: 'midfielder',  label: 'Півзахисник' },
    { value: 'forward',     label: 'Нападник' },
  ] : [
    { value: 'goalkeeper',  label: 'Goalkeeper' },
    { value: 'defender',    label: 'Defender' },
    { value: 'midfielder',  label: 'Midfielder' },
    { value: 'forward',     label: 'Forward' },
  ];

  const feet: ReadonlyArray<{ value: 'left' | 'right' | 'both'; label: string }> = lang === 'ua'
    ? [
        { value: 'left',  label: 'Ліва' },
        { value: 'right', label: 'Права' },
        { value: 'both',  label: 'Обидві' },
      ]
    : [
        { value: 'left',  label: 'Left' },
        { value: 'right', label: 'Right' },
        { value: 'both',  label: 'Both' },
      ];

  const languages: ReadonlyArray<{ value: NonNullable<Player['language_preference']>; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'uk', label: 'Українська' },
    { value: 'ru', label: 'Русский' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{player?.full_name ?? '—'}</Text>
              {isPro && <ProBadge />}
            </View>
            <Text style={styles.email}>{email ?? ''}</Text>

            {!isPro && (
              <Pressable
                onPress={() => router.push('/(app)/profile/upgrade')}
                style={({ pressed }) => [styles.upgradeCard, pressed && { opacity: 0.9 }]}
              >
                <View>
                  <Text style={styles.upgradeTitle}>{lang === 'ua' ? 'Перейти на Pro' : 'Go Pro'}</Text>
                  <Text style={styles.upgradeBody}>
                    {lang === 'ua' ? 'Без лімітів повідомлень.' : 'No message limits.'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.colors.purple} />
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'ua' ? 'Особисте' : 'Personal'}</Text>
            <FormField label={lang === 'ua' ? "Ім'я" : 'Full name'}
              value={draft.full_name ?? ''} onChangeText={(v) => set('full_name', v)}
              autoCapitalize="words"
            />
            <FormField label={lang === 'ua' ? 'Дата народження' : 'Date of birth'}
              value={draft.date_of_birth ?? ''} onChangeText={(v) => set('date_of_birth', v)}
              placeholder="2006-03-15" autoCapitalize="none"
            />
            <FormField label={lang === 'ua' ? 'Громадянство' : 'Nationality'}
              value={draft.nationality ?? ''} onChangeText={(v) => set('nationality', v)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'ua' ? "Кар'єра" : 'Career'}</Text>
            <FormField label={lang === 'ua' ? 'Клуб' : 'Club'}
              value={draft.current_club ?? ''} onChangeText={(v) => set('current_club', v)}
            />
            <FormField label={lang === 'ua' ? 'Ліга' : 'League'}
              value={draft.current_league ?? ''} onChangeText={(v) => set('current_league', v)}
            />
            <SegmentedPicker label={lang === 'ua' ? 'Позиція' : 'Position'}
              value={draft.position_primary ?? null} options={positions}
              onChange={(v) => set('position_primary', v)}
            />
            <SegmentedPicker label={lang === 'ua' ? 'Робоча нога' : 'Preferred foot'}
              value={draft.dominant_foot ?? null} options={feet}
              onChange={(v) => set('dominant_foot', v)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'ua' ? 'Параметри' : 'Physical'}</Text>
            <FormField label={lang === 'ua' ? 'Зріст (см)' : 'Height (cm)'}
              value={draft.height_cm != null ? String(draft.height_cm) : ''}
              onChangeText={(v) => set('height_cm', intOrNull(v))}
              keyboardType="number-pad" maxLength={3}
            />
            <FormField label={lang === 'ua' ? 'Вага (кг)' : 'Weight (kg)'}
              value={draft.weight_kg != null ? String(draft.weight_kg) : ''}
              onChangeText={(v) => set('weight_kg', intOrNull(v))}
              keyboardType="number-pad" maxLength={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'ua' ? 'Контракт' : 'Contract'}</Text>
            <FormField label={lang === 'ua' ? 'Кінець' : 'Expiry'}
              value={draft.contract_expires ?? ''} onChangeText={(v) => set('contract_expires', v)}
              placeholder="2027-06-30" autoCapitalize="none"
            />
            <FormField label={lang === 'ua' ? 'Агент' : 'Agent'}
              value={draft.agent_name ?? ''} onChangeText={(v) => set('agent_name', v)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'ua' ? 'Налаштування' : 'Preferences'}</Text>
            <SegmentedPicker label={lang === 'ua' ? 'Мова MATE' : 'MATE language'}
              value={draft.language_preference ?? null} options={languages}
              onChange={(v) => set('language_preference', v)}
            />
            <FormField label={lang === 'ua' ? 'Про себе' : 'About you'}
              value={draft.bio ?? ''} onChangeText={(v) => set('bio', v)}
              multiline numberOfLines={5} style={{ minHeight: 120 }}
            />
          </View>

          <PillButton
            label={lang === 'ua' ? 'Зберегти' : 'Save'}
            onPress={handleSave}
            loading={saving}
            disabled={loading || saving}
          />

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.signOutLabel}>
              {lang === 'ua' ? 'Вийти' : 'Sign out'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  scroll: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl },
  head: { alignItems: 'center', marginBottom: theme.spacing.xl },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontFamily: theme.fonts.display, fontSize: 40,
    color: theme.colors.purple, letterSpacing: -1,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: {
    fontFamily: theme.fonts.display, fontSize: 24,
    color: theme.colors.t1, letterSpacing: -0.3, maxWidth: 240,
  },
  email: {
    fontFamily: theme.fonts.body, fontSize: 14,
    color: theme.colors.t3, marginTop: 4,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
  },
  upgradeTitle: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 16, color: theme.colors.purple,
    letterSpacing: 0.2,
  },
  upgradeBody: {
    fontFamily: theme.fonts.body, fontSize: 13,
    color: theme.colors.purpleDk, marginTop: 2,
  },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontFamily: theme.fonts.display, fontSize: 22,
    color: theme.colors.t1, letterSpacing: -0.3,
    marginBottom: theme.spacing.md,
  },
  signOut: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    marginTop: theme.spacing.lg,
  },
  signOutLabel: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 13,
    color: theme.colors.t3, letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
