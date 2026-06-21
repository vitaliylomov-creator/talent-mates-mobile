import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay,
} from 'react-native-reanimated';
import { theme } from '../lib/theme';

// Three pulsing dots — the calm "MATE is thinking" state, Inside Shell.
// Replaces a spinner. Used while we wait for mate-chat to respond.
function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

export function LoadingMate() {
  return (
    <View style={styles.wrap}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.t2,
  },
});
