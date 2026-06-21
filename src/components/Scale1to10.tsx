import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';

interface Props {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  hintLow?: string;
  hintHigh?: string;
}

// Compact 1-10 picker. Pills wrap on narrow screens but on a normal iPhone
// they fit in one row.
export function Scale1to10({ label, value, onChange, hintLow, hintHigh }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = n === value;
          return (
            <Pressable
              key={n}
              onPress={() => {
                if (n !== value) {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(n);
                }
              }}
              style={({ pressed }) => [
                styles.cell,
                active ? styles.cellActive : styles.cellIdle,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.cellLabel, active ? styles.cellLabelActive : styles.cellLabelIdle]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {(hintLow || hintHigh) && (
        <View style={styles.hints}>
          <Text style={styles.hint}>{hintLow}</Text>
          <Text style={styles.hint}>{hintHigh}</Text>
        </View>
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
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  cellIdle: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
  },
  cellActive: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
  },
  cellLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
  },
  cellLabelIdle: { color: theme.colors.t1 },
  cellLabelActive: { color: theme.colors.purple },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  hint: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.t4,
  },
});
