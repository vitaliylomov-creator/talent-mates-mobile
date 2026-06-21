import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AGENTS } from '../constants/agents';
import type { AgentId } from '../lib/types';
import { theme } from '../lib/theme';

interface Props {
  value: AgentId;
  onChange: (id: AgentId) => void;
}

export function AgentPillRow({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.wrap}
    >
      {AGENTS.map((a) => {
        const active = a.id === value;
        return (
          <Pressable
            key={a.id}
            onPress={() => {
              if (a.id !== value) {
                Haptics.selectionAsync().catch(() => {});
                onChange(a.id);
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${a.label} · ${a.desc}`}
            style={({ pressed }) => [
              styles.pill,
              active ? styles.pillActive : styles.pillIdle,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.emoji}>{a.emoji}</Text>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
              {a.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={{ width: theme.spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 0 },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    borderWidth: 0.5,
  },
  pillIdle: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
  },
  pillActive: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
  },
  emoji: { fontSize: 13 },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  labelIdle:   { color: theme.colors.t1 },
  labelActive: { color: theme.colors.purple },
});
