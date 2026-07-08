import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';

interface Props {
  isFounding?: boolean;
  foundingNumber?: number | null;
  ffarVerified?: boolean;
  onPressHistory?: () => void;
  onPressNewChat?: () => void;
}

// Pro-side top bar. Reads more executive than the player header: MATE PRO
// wordmark, Founding #N or "PENDING" badge, plus the same drawer/new-chat
// pair on either side.
export function ProBrandHeader({
  isFounding, foundingNumber, ffarVerified,
  onPressHistory, onPressNewChat,
}: Props) {
  const tap = (fn?: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    fn?.();
  };

  const showFounding = !!isFounding && foundingNumber != null;
  const showPending = !ffarVerified && !showFounding;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={tap(onPressHistory)}
        accessibilityRole="button"
        accessibilityLabel="History"
        hitSlop={10}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
      >
        <Feather name="menu" size={20} color={theme.colors.t1} />
      </Pressable>

      <View style={styles.centerWrap}>
        <Text style={styles.title}>MATE</Text>
        <Text style={styles.proTag}>PRO</Text>
        {showFounding && (
          <View style={styles.foundingBadge}>
            <Text style={styles.foundingBadgeText}>#{foundingNumber}</Text>
          </View>
        )}
        {showPending && (
          <View style={styles.pendingBadge}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingText}>PENDING</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={tap(onPressNewChat)}
        accessibilityRole="button"
        accessibilityLabel="New chat"
        hitSlop={10}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
      >
        <Feather name="edit" size={20} color={theme.colors.t1} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
  },
  centerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.4,
  },
  proTag: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    color: theme.colors.accentGreen,
    marginTop: 4,
  },
  foundingBadge: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accentGreen,
  },
  foundingBadgeText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: theme.colors.purple,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    borderWidth: 0.5,
    borderColor: theme.colors.warning,
  },
  pendingDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: theme.colors.warning,
  },
  pendingText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: theme.colors.warning,
  },
});
