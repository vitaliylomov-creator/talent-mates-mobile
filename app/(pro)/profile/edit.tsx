import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';
import { updateAgent, type AgentEditable } from '../../../src/lib/agent';
import { FormField } from '../../../src/components/FormField';
import { PillButton } from '../../../src/components/PillButton';

export default function EditAgentProfile() {
  const router = useRouter();
  const { agent, refetch } = useAgent();
  const [draft, setDraft] = useState<AgentEditable>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setDraft({
      first_name: agent.first_name ?? '',
      last_name: agent.last_name ?? '',
      agency_name: agent.agency_name ?? '',
      country_of_operation: agent.country_of_operation ?? '',
      years_experience: agent.years_experience ?? null,
      specialisation: agent.specialisation ?? '',
    });
  }, [agent?.id]);

  const set = <K extends keyof AgentEditable>(k: K, v: AgentEditable[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const intOrNull = (v: string): number | null => {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };

  const canSubmit =
    (draft.first_name?.trim().length ?? 0) >= 2 &&
    (draft.last_name?.trim().length ?? 0) >= 2 &&
    !saving;

  const handleSave = async () => {
    if (!agent || !canSubmit) return;
    setSaving(true);
    try {
      const { error } = await updateAgent(agent.id, draft);
      if (error) {
        Alert.alert('Save failed', error.message);
        return;
      }
      await refetch();
      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (!agent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Profile not loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={24} color={theme.colors.t1} />
        </Pressable>
        <Text style={styles.topTitle}>Edit profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Section title="Identity">
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <FormField label="First name" value={draft.first_name ?? ''}
                  onChangeText={(v) => set('first_name', v)}
                  autoCapitalize="words" autoComplete="given-name" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Last name" value={draft.last_name ?? ''}
                  onChangeText={(v) => set('last_name', v)}
                  autoCapitalize="words" autoComplete="family-name" />
              </View>
            </View>
          </Section>

          <Section title="Licence" subtitle="Read-only. Contact support to change.">
            <ReadOnlyRow label="FFAR licence" value={agent.ffar_licence} />
            <ReadOnlyRow label="Country of issue" value={agent.ffar_country} />
          </Section>

          <Section title="Practice">
            <FormField label="Agency name" value={draft.agency_name ?? ''}
              onChangeText={(v) => set('agency_name', v)}
              placeholder="Talent Mates" autoCapitalize="words" />
            <FormField label="Country of operation" value={draft.country_of_operation ?? ''}
              onChangeText={(v) => set('country_of_operation', v)}
              placeholder="United Kingdom" autoCapitalize="words" />
            <FormField label="Years in the game"
              value={draft.years_experience != null ? String(draft.years_experience) : ''}
              onChangeText={(v) => set('years_experience', intOrNull(v))}
              placeholder="6" keyboardType="number-pad" maxLength={2} />
            <FormField label="Specialisation" value={draft.specialisation ?? ''}
              onChangeText={(v) => set('specialisation', v)}
              placeholder="Youth players, cross-border deals, contract disputes."
              multiline numberOfLines={3} />
          </Section>

          <View style={{ height: theme.spacing.md }} />
          <PillButton label="Save" onPress={handleSave}
            loading={saving} disabled={!canSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.roWrap}>
      <Text style={styles.roLabel}>{label}</Text>
      <Text style={styles.roValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: theme.fonts.body, fontSize: 15, color: theme.colors.t3 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.t1,
    letterSpacing: -0.3,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.t3,
    marginBottom: theme.spacing.md,
  },
  pair: { flexDirection: 'row', gap: 10 },
  roWrap: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
  },
  roLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  roValue: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t2,
  },
});
