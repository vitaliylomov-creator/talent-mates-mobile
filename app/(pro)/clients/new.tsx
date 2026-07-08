import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';
import {
  createClient,
  type Client, type ClientPosition, type ClientFoot, type ClientStatus,
} from '../../../src/lib/agent';
import { track, EVT } from '../../../src/lib/analytics';

import { FormField } from '../../../src/components/FormField';
import { SegmentedPicker } from '../../../src/components/SegmentedPicker';
import { PillButton } from '../../../src/components/PillButton';

const POSITIONS: ReadonlyArray<{ value: ClientPosition; label: string }> = [
  { value: 'Goalkeeper',            label: 'GK' },
  { value: 'Right Back',            label: 'RB' },
  { value: 'Left Back',             label: 'LB' },
  { value: 'Centre Back',           label: 'CB' },
  { value: 'Defensive Midfielder',  label: 'DM' },
  { value: 'Central Midfielder',    label: 'CM' },
  { value: 'Attacking Midfielder',  label: 'AM' },
  { value: 'Right Winger',          label: 'RW' },
  { value: 'Left Winger',           label: 'LW' },
  { value: 'Second Striker',        label: 'SS' },
  { value: 'Centre Forward',        label: 'CF' },
];

const FEET: ReadonlyArray<{ value: ClientFoot; label: string }> = [
  { value: 'Right', label: 'Right' },
  { value: 'Left',  label: 'Left' },
  { value: 'Both',  label: 'Both' },
];

const STATUSES: ReadonlyArray<{ value: ClientStatus; label: string }> = [
  { value: 'active',   label: 'Active' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'dormant',  label: 'Dormant' },
];

type Draft = Omit<Client, 'id' | 'agent_id' | 'created_at' | 'updated_at'>;

export default function NewClient() {
  const router = useRouter();
  const { agent } = useAgent();

  const [draft, setDraft] = useState<Draft>({
    first_name: '',
    last_name: '',
    date_of_birth: null,
    nationality: null,
    position_primary: null,
    dominant_foot: null,
    current_club: null,
    current_league: null,
    height_cm: null,
    weight_kg: null,
    contract_expires: null,
    status: 'active',
    representation_notes: null,
    commission_pct: null,
    career_history: null,
    notes_for_mate: null,
  });
  const [saving, setSaving] = useState(false);

  const canSubmit =
    draft.first_name.trim().length >= 2 &&
    draft.last_name.trim().length >= 2 &&
    !saving;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const intOrNull = (v: string): number | null => {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };
  const floatOrNull = (v: string): number | null => {
    const n = parseFloat(v.replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const handleSave = async () => {
    if (!agent || !canSubmit) return;
    setSaving(true);
    try {
      const cleaned: Draft = {
        ...draft,
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim(),
      };
      const { data, error } = await createClient(agent.id, cleaned);
      if (error) {
        Alert.alert('Save failed', error.message);
        return;
      }
      if (data) {
        track(EVT.proClientCreated, {
          status: cleaned.status,
          position: cleaned.position_primary ?? null,
          has_contract: !!cleaned.contract_expires,
        });
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={24} color={theme.colors.t1} />
        </Pressable>
        <Text style={styles.topTitle}>New client</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section title="Identity">
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <FormField label="First name" value={draft.first_name}
                  onChangeText={(v) => set('first_name', v)}
                  autoCapitalize="words" autoComplete="given-name" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Last name" value={draft.last_name}
                  onChangeText={(v) => set('last_name', v)}
                  autoCapitalize="words" autoComplete="family-name" />
              </View>
            </View>
            <FormField label="Date of birth" value={draft.date_of_birth ?? ''}
              onChangeText={(v) => set('date_of_birth', v || null)}
              placeholder="2006-03-15" autoCapitalize="none"
              keyboardType="numbers-and-punctuation" />
            <FormField label="Nationality" value={draft.nationality ?? ''}
              onChangeText={(v) => set('nationality', v || null)}
              placeholder="Ukraine" autoCapitalize="words" />
          </Section>

          <Section title="Playing">
            <SegmentedPicker
              label="Position"
              value={draft.position_primary}
              options={POSITIONS}
              onChange={(v) => set('position_primary', v)}
              scrollable
            />
            <SegmentedPicker
              label="Dominant foot"
              value={draft.dominant_foot}
              options={FEET}
              onChange={(v) => set('dominant_foot', v)}
            />
            <FormField label="Current club" value={draft.current_club ?? ''}
              onChangeText={(v) => set('current_club', v || null)}
              placeholder="Slough Town FC" autoCapitalize="words" />
            <FormField label="Current league" value={draft.current_league ?? ''}
              onChangeText={(v) => set('current_league', v || null)}
              placeholder="U19 National League" autoCapitalize="words" />
          </Section>

          <Section title="Physical">
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <FormField label="Height (cm)"
                  value={draft.height_cm != null ? String(draft.height_cm) : ''}
                  onChangeText={(v) => set('height_cm', intOrNull(v))}
                  placeholder="175" keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Weight (kg)"
                  value={draft.weight_kg != null ? String(draft.weight_kg) : ''}
                  onChangeText={(v) => set('weight_kg', intOrNull(v))}
                  placeholder="70" keyboardType="number-pad" maxLength={3} />
              </View>
            </View>
          </Section>

          <Section title="Representation">
            <SegmentedPicker
              label="Status"
              value={draft.status}
              options={STATUSES}
              onChange={(v) => set('status', v)}
            />
            <FormField label="Contract expires" value={draft.contract_expires ?? ''}
              onChangeText={(v) => set('contract_expires', v || null)}
              placeholder="2027-06-30" autoCapitalize="none" />
            <FormField label="Commission %"
              value={draft.commission_pct != null ? String(draft.commission_pct) : ''}
              onChangeText={(v) => set('commission_pct', floatOrNull(v))}
              placeholder="5.0" keyboardType="decimal-pad" maxLength={5} />
            <FormField label="Representation notes"
              value={draft.representation_notes ?? ''}
              onChangeText={(v) => set('representation_notes', v || null)}
              placeholder="Exclusive, renewable annually."
              multiline numberOfLines={3} />
          </Section>

          <Section title="For MATE">
            <FormField label="Career history"
              value={draft.career_history ?? ''}
              onChangeText={(v) => set('career_history', v || null)}
              placeholder="Started at academy X, on loan at Y…"
              multiline numberOfLines={3} />
            <FormField label="Private notes"
              value={draft.notes_for_mate ?? ''}
              onChangeText={(v) => set('notes_for_mate', v || null)}
              placeholder="Anything MATE should know that stays between us."
              multiline numberOfLines={3} />
          </Section>

          <View style={{ height: theme.spacing.md }} />
          <PillButton
            label="Save client"
            onPress={handleSave}
            loading={saving}
            disabled={!canSubmit}
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
  pair: { flexDirection: 'row', gap: 10 },
});
