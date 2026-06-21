import { Pressable, Text, View, ActivityIndicator, StyleSheet, GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';

interface Props {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
}

// Multi-coloured Google "G" — the canonical mark Google requires when its
// brand sits next to "Continue with Google".
function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 0 1-12-12 12 12 0 0 1 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4a20 20 0 0 0-20 20 20 20 0 0 0 20 20 20 20 0 0 0 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8L6.2 33C9.5 39.5 16.2 44 24 44z"/>
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.1 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </Svg>
  );
}

export function GoogleButton({ label, onPress, loading, disabled }: Props) {
  const handle = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(e);
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.t1} />
      ) : (
        <View style={styles.row}>
          <GoogleG size={20} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.t1,
    letterSpacing: 0.2,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
