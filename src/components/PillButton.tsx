import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';

type Variant = 'primary' | 'ghost';

interface Props {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function PillButton({
  label, onPress, loading, disabled, variant = 'primary', style, accessibilityLabel,
}: Props) {
  const isGhost = variant === 'ghost';

  const handle = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(e);
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? theme.colors.t1 : theme.colors.purple} />
      ) : (
        <Text style={[styles.label, isGhost ? styles.ghostLabel : styles.primaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  primary: { backgroundColor: theme.colors.white },
  ghost: {
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
  },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  primaryLabel: { color: theme.colors.purple },
  ghostLabel: { color: theme.colors.t1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
