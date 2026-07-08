import { useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';
import { useClients } from '../../../src/hooks/useClients';
import type { Client } from '../../../src/lib/agent';
import { PillButton } from '../../../src/components/PillButton';

const STATUS_COLOR: Record<Client['status'], { bg: string; fg: string; border: string }> = {
  active:   { bg: theme.colors.accentGreen, fg: theme.colors.purple, border: theme.colors.accentGreen },
  prospect: { bg: theme.colors.glassHover,  fg: theme.colors.warning, border: theme.colors.warning },
  dormant:  { bg: theme.colors.glass,       fg: theme.colors.t4,      border: theme.colors.borderMid },
};

export default function ClientDeepView() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { agent } = useAgent();
  const { items, loading, reload } = useClients(agent?.id);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const client = useMemo(
    () => items.find((c) => c.id === clientId) ?? null,
    [items, clientId],
  );

  const handleAskMate = () => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push({
      pathname: '/(pro)/chat' as never,
      params: { client_id: client.id, client_name: `${client.first_name} ${client.last_name}` },
    });
  };

  if (loading && !client) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.t2} />
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
            <Feather name="chevron-left" size={24} color={theme.colors.t1} />
          </Pressable>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Client not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_COLOR[client.status];
  const initial = (client.first_name + client.last_name).trim().charAt(0).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={24} color={theme.colors.t1} />
        </Pressable>
        <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
          <Text style={[styles.statusText, { color: status.fg }]}>{client.status.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {client.first_name} {client.last_name}
          </Text>
          <View style={styles.metaRow}>
            {client.position_primary ? <MetaPill label={client.position_primary} /> : null}
            {client.dominant_foot ? <MetaPill label={`${client.dominant_foot}-footed`} /> : null}
            {client.date_of_birth ? <MetaPill label={`Born ${client.date_of_birth}`} /> : null}
          </View>
        </View>

        <Section title="Club">
          <Row label="Current club"  value={client.current_club ?? '—'} />
          <Row label="League"        value={client.current_league ?? '—'} />
          <Row label="Contract to"   value={client.contract_expires ?? '—'} />
        </Section>

        <Section title="Physical">
          <Row label="Height" value={client.height_cm ? `${client.height_cm} cm` : '—'} />
          <Row label="Weight" value={client.weight_kg ? `${client.weight_kg} kg` : '—'} />
          <Row label="Nationality" value={client.nationality ?? '—'} />
        </Section>

        <Section title="Representation">
          <Row label="Commission"
            value={client.commission_pct != null ? `${client.commission_pct}%` : '—'} />
          {client.representation_notes ? (
            <Text style={styles.paragraph}>{client.representation_notes}</Text>
          ) : null}
        </Section>

        {client.career_history || client.notes_for_mate ? (
          <Section title="Context for MATE">
            {client.career_history ? (
              <>
                <Text style={styles.subLabel}>Career history</Text>
                <Text style={styles.paragraph}>{client.career_history}</Text>
              </>
            ) : null}
            {client.notes_for_mate ? (
              <>
                <Text style={[styles.subLabel, { marginTop: theme.spacing.md }]}>Private notes</Text>
                <Text style={styles.paragraph}>{client.notes_for_mate}</Text>
              </>
            ) : null}
          </Section>
        ) : null}

        <View style={{ height: theme.spacing.md }} />
        <PillButton
          label={`Ask MATE about ${client.first_name}`}
          onPress={handleAskMate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontFamily: theme.fonts.body, fontSize: 15,
    color: theme.colors.t3,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
    borderWidth: 0.5,
  },
  statusText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  head: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontFamily: theme.fonts.display,
    fontSize: 40,
    color: theme.colors.purple,
    letterSpacing: -1,
  },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: 30,
    color: theme.colors.t1,
    letterSpacing: -0.5,
    textAlign: 'center',
    maxWidth: 300,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
  },
  metaPillText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    color: theme.colors.t2,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: theme.colors.t3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  paragraph: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t1,
    lineHeight: 20,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  rowLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.t3,
  },
  rowValue: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.t1,
    flexShrink: 1,
    textAlign: 'right',
  },
});
