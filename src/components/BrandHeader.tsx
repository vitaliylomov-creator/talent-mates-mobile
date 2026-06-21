import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { ProBadge } from './ProBadge';

interface Props {
  isPro?: boolean;
  onPressHistory?: () => void;
  onPressNewChat?: () => void;
  title?: string;
}

export function BrandHeader({ isPro, onPressHistory, onPressNewChat, title = 'MATE' }: Props) {
  const tap = (fn?: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    fn?.();
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={tap(onPressHistory)}
        accessibilityRole="button"
        accessibilityLabel="History"
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        hitSlop={10}
      >
        <Feather name="menu" size={20} color={theme.colors.t1} />
      </Pressable>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {isPro && <ProBadge />}
      </View>

      <Pressable
        onPress={tap(onPressNewChat)}
        accessibilityRole="button"
        accessibilityLabel="New chat"
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        hitSlop={10}
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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.t1,
    letterSpacing: -0.5,
  },
});
