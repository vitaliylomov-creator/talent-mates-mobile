import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';
import { useAuth } from '../../../src/hooks/useAuth';
import { signOut } from '../../../src/lib/auth';
import { deleteAgentAccount } from '../../../src/lib/agent';

export default function ProProfile() {
  const router = useRouter();
  const { session } = useAuth();
  const { agent } = useAgent();
  const [deleting, setDeleting] = useState(false);

  const email = session?.user.email ?? '';
  const name = [agent?.first_name, agent?.last_name].filter(Boolean).join(' ') || '—';
  const initial = (name === '—' ? email : name).trim().charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You can come back any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => { void signOut(); } },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, clients, conversations, and video analyses. Founding number cannot be reissued. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'One more check.',
              'Type nothing — just confirm. Ready?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAgentAccount();
                      // Session is void server-side; local sign-out clears storage.
                      await signOut();
                    } catch (e: any) {
                      setDeleting(false);
                      Alert.alert('Delete failed', e?.message ?? 'Unknown error');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.badgeRow}>
            {agent?.is_founding && agent.founding_number != null ? (
              <View style={styles.foundingBadge}>
                <Text style={styles.foundingText}>Founding Agent #{agent.founding_number}</Text>
              </View>
            ) : null}
            {agent?.ffar_verified ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={12} color={theme.colors.purple} />
                <Text style={styles.verifiedText}>FFAR VERIFIED</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingText}>FFAR PENDING</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.navGroup}>
          <NavRow
            icon="edit-3" label="Edit profile"
            onPress={() => router.push('/(pro)/profile/edit' as never)}
          />
          <NavRow
            icon="credit-card" label="Billing"
            onPress={() => router.push('/(pro)/profile/billing' as never)}
          />
        </View>

        <View style={styles.section}>
          <Row label="Licence" value={agent?.ffar_licence ?? '—'} />
          <Row label="Country" value={agent?.ffar_country ?? '—'} />
          {agent?.agency_name ? <Row label="Agency" value={agent.agency_name} /> : null}
          {agent?.country_of_operation ? <Row label="Operates in" value={agent.country_of_operation} /> : null}
          {agent?.years_experience ? <Row label="Experience" value={`${agent.years_experience} years`} /> : null}
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger zone</Text>
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.dangerBtn,
              pressed && { opacity: 0.85 },
              deleting && { opacity: 0.5 },
            ]}
          >
            {deleting
              ? <ActivityIndicator color={theme.colors.danger} />
              : <Text style={styles.dangerLabel}>Delete account permanently</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface NavRowProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}

function NavRow({ icon, label, onPress }: NavRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navRow, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.navIconWrap}>
        <Feather name={icon} size={18} color={theme.colors.t1} />
      </View>
      <Text style={styles.navLabel}>{label}</Text>
      <Feather name="chevron-right" size={20} color={theme.colors.t3} />
    </Pressable>
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
  name: {
    fontFamily: theme.fonts.display, fontSize: 26,
    color: theme.colors.t1, letterSpacing: -0.3, maxWidth: 260,
    textAlign: 'center',
  },
  email: {
    fontFamily: theme.fonts.body, fontSize: 14,
    color: theme.colors.t3, marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center', marginTop: theme.spacing.md,
  },
  foundingBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accentGreen,
  },
  foundingText: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 11,
    letterSpacing: 1.4, color: theme.colors.purple,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.white,
  },
  verifiedText: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 10,
    letterSpacing: 1.4, color: theme.colors.purple,
  },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: theme.radii.pill,
    borderWidth: 0.5, borderColor: theme.colors.warning,
  },
  pendingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.colors.warning,
  },
  pendingText: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 10,
    letterSpacing: 1.4, color: theme.colors.warning,
  },
  navGroup: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  navIconWrap: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.glassHover,
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
    color: theme.colors.t1,
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  rowLabel: {
    fontFamily: theme.fonts.body, fontSize: 13,
    color: theme.colors.t3,
  },
  rowValue: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 14,
    color: theme.colors.t1, flexShrink: 1, textAlign: 'right',
  },
  signOut: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    marginBottom: theme.spacing.xl,
  },
  signOutLabel: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 13,
    color: theme.colors.t3, letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dangerZone: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 0.5,
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(255,93,108,0.05)',
  },
  dangerTitle: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.danger,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dangerBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  dangerLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.danger,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
