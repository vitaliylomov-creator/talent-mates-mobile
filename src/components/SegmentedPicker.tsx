import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label?: string;
  value: T | null;
  options: ReadonlyArray<Option<T>>;
  onChange: (v: T) => void;
  scrollable?: boolean;
}

export function SegmentedPicker<T extends string>({ label, value, options, onChange, scrollable }: Props<T>) {
  const inner = options.map((opt) => {
    const active = opt.value === value;
    return (
      <Pressable
        key={opt.value}
        onPress={() => {
          if (opt.value !== value) {
            Haptics.selectionAsync().catch(() => {});
            onChange(opt.value);
          }
        }}
        style={({ pressed }) => [
          styles.pill,
          active ? styles.pillActive : styles.pillIdle,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={[styles.pillLabel, active ? styles.pillLabelActive : styles.pillLabelIdle]}>
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.row}>{inner}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.md },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    borderWidth: 0.5,
  },
  pillIdle: { backgroundColor: theme.colors.glass, borderColor: theme.colors.borderMid },
  pillActive: { backgroundColor: theme.colors.white, borderColor: theme.colors.white },
  pillLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  pillLabelIdle:   { color: theme.colors.t1 },
  pillLabelActive: { color: theme.colors.purple },
});
