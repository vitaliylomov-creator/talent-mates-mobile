import { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';
import { useClients } from '../../../src/hooks/useClients';
import type { Client, ClientStatus } from '../../../src/lib/agent';

const STATUS_STYLE: Record<ClientStatus, { bg: string; fg: string; border: string }> = {
  active:   { bg: theme.colors.accentGreen, fg: theme.colors.purple, border: theme.colors.accentGreen },
  prospect: { bg: theme.colors.glassHover,  fg: theme.colors.warning, border: theme.colors.warning },
  dormant:  { bg: theme.colors.glass,       fg: theme.colors.t4,      border: theme.colors.borderMid },
};

export default function ClientRoster() {
  const router = useRouter();
  const { agent } = useAgent();
  const { items, loading, reload } = useClients(agent?.id);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(pro)/clients/new' as never);
  };

  const handleOpen = (client: Client) => {
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/(pro)/clients/[clientId]' as never, params: { clientId: client.id } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clients</Text>
          {items.length > 0 && (
            <Text style={styles.count}>
              {items.length} {items.length === 1 ? 'on the roster' : 'on the roster'}
            </Text>
          )}
        </View>
        <Pressable onPress={handleAdd}
          accessibilityLabel="Add client"
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
          <Feather name="plus" size={18} color={theme.colors.purple} />
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyLead}>No one on the roster yet.</Text>
          <Text style={styles.emptyBody}>Add your first client and MATE Pro starts learning the file.</Text>
          <Pressable onPress={handleAdd}
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.emptyBtnLabel}>ADD FIRST CLIENT</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.t2} />}
          renderItem={({ item }) => (
            <ClientCard client={item} onPress={() => handleOpen(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ClientCard({ client, onPress }: { client: Client; onPress: () => void }) {
  const initial = (client.first_name + client.last_name).trim().charAt(0).toUpperCase() || '?';
  const meta = [client.position_primary, client.current_club].filter(Boolean).join(' · ');
  const status = STATUS_STYLE[client.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>
          {client.first_name} {client.last_name}
        </Text>
        {meta ? <Text style={styles.cardMeta} numberOfLines={1}>{meta}</Text> : null}
        {client.contract_expires ? (
          <Text style={styles.contract}>Contract to {client.contract_expires}</Text>
        ) : null}
      </View>
      <View style={[
        styles.statusPill,
        { backgroundColor: status.bg, borderColor: status.border },
      ]}>
        <Text style={[styles.statusText, { color: status.fg }]}>
          {client.status.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 30,
    color: theme.colors.t1,
    letterSpacing: -0.5,
  },
  count: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t3,
    marginTop: 2,
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyLead: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.t1,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t2,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  emptyBtn: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.pill,
  },
  emptyBtnLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2.5,
    color: theme.colors.purple,
  },
  list: { padding: theme.spacing.md, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.glassHover,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
  },
  cardName: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.t1,
    letterSpacing: 0.2,
  },
  cardMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.t3,
    marginTop: 2,
  },
  contract: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t4,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    borderWidth: 0.5,
  },
  statusText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
