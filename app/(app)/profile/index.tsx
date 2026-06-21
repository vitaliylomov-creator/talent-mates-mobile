import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../src/lib/theme';
import { t } from '../../../src/constants/strings';
import { getLang } from '../../../src/lib/lang';
import { signOut } from '../../../src/lib/auth';
import { usePlayer } from '../../../src/hooks/usePlayer';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { ProBadge } from '../../../src/components/ProBadge';

// D6 expands this with profile edit, Pro upgrade flow, etc.
// For D3 we surface the bare minimum so the user can actually sign out.
export default function ProfileScreen() {
  const lang = getLang();
  const { player } = usePlayer();
  const { isPro } = useSubscription();

  const handleSignOut = () => {
    Alert.alert(
      lang === 'ua' ? 'Вийти?' : 'Sign out?',
      lang === 'ua' ? 'Зможеш увійти знов в будь-який час.' : 'You can come back any time.',
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

  const initial = (player?.full_name ?? player?.email ?? '?').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{player?.full_name ?? '—'}</Text>
          {isPro && <ProBadge />}
        </View>
        <Text style={styles.email}>{player?.email ?? ''}</Text>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.signOutLabel}>
            {lang === 'ua' ? 'Вийти' : 'Sign out'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarText: {
    fontFamily: theme.fonts.display,
    fontSize: 44,
    color: theme.colors.purple,
    letterSpacing: -1,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.t1,
    letterSpacing: -0.4,
  },
  email: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t3,
    marginBottom: theme.spacing.xxl,
  },
  signOut: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
    borderRadius: theme.radii.pill,
  },
  signOutLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2,
    color: theme.colors.t1,
    textTransform: 'uppercase',
  },
});
