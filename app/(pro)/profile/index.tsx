import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { theme } from '../../../src/lib/theme';
import { getLang } from '../../../src/lib/lang';
import { useAgent } from '../../../src/hooks/useAgent';
import { useAuth } from '../../../src/hooks/useAuth';
import { signOut } from '../../../src/lib/auth';

// D5+ replaces with editable profile + billing surface + delete account.
// For D3 we surface: name, email, FFAR status, founding badge, sign-out.
export default function ProProfile() {
  const lang = getLang();
  const { session } = useAuth();
  const { agent } = useAgent();

  const email = session?.user.email ?? '';
  const name = [agent?.first_name, agent?.last_name].filter(Boolean).join(' ') || '—';
  const initial = (name === '—' ? email : name).trim().charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert(
      lang === 'ua' ? 'Вийти?' : 'Sign out?',
      lang === 'ua' ? 'Повернешся будь-коли.' : 'You can come back any time.',
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
                <Text style={styles.foundingText}>
                  {lang === 'ua'
                    ? `Founding Agent #${agent.founding_number}`
                    : `Founding Agent #${agent.founding_number}`}
                </Text>
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
                <Text style={styles.pendingText}>
                  {lang === 'ua' ? 'FFAR НА ПЕРЕВІРЦІ' : 'FFAR PENDING'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Row label={lang === 'ua' ? 'Ліцензія' : 'Licence'} value={agent?.ffar_licence ?? '—'} />
          <Row label={lang === 'ua' ? 'Країна' : 'Country'} value={agent?.ffar_country ?? '—'} />
          {agent?.agency_name ? (
            <Row label={lang === 'ua' ? 'Агенція' : 'Agency'} value={agent.agency_name} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === 'ua' ? 'Підписка' : 'Subscription'}
          </Text>
          <Text style={styles.sectionBody}>
            {lang === 'ua'
              ? 'Керування підпискою — на app.talent-mates.com. Мобільна оплата у наступному релізі.'
              : 'Manage on app.talent-mates.com. Mobile billing ships next release.'}
          </Text>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.signOutLabel}>
            {lang === 'ua' ? 'Вийти' : 'Sign out'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
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
    borderWidth: 0.5,
    borderColor: theme.colors.warning,
  },
  pendingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.colors.warning,
  },
  pendingText: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 10,
    letterSpacing: 1.4, color: theme.colors.warning,
  },
  section: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 11,
    letterSpacing: 2, color: theme.colors.t3,
    marginBottom: 8, textTransform: 'uppercase',
  },
  sectionBody: {
    fontFamily: theme.fonts.body, fontSize: 14,
    color: theme.colors.t2, lineHeight: 20,
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
  },
  signOutLabel: {
    fontFamily: theme.fonts.bodyMedium, fontSize: 13,
    color: theme.colors.t3, letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
