import { useMemo, useState } from 'react';
import {
  Modal, View, Text, Pressable, TextInput, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { FIFA_COUNTRIES } from '../constants/fifa-countries';

interface Props {
  visible: boolean;
  value: string | null;
  onClose: () => void;
  onPick: (country: string) => void;
  title?: string;
  searchPlaceholder?: string;
}

// Modal FIFA-countries picker with search. Deliberately shows every entry —
// 211 rows are cheap on FlatList, no windowing headaches, no need for
// SectionList. Search filters case-insensitive on prefix + substring.
export function CountryPicker({
  visible, value, onClose, onPick, title = 'Country', searchPlaceholder = 'Search',
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FIFA_COUNTRIES;
    // Rank prefix matches above substring matches so 'ir' surfaces
    // 'Iran' and 'Ireland' before 'Kiribati'.
    const prefixes: string[] = [];
    const substrings: string[] = [];
    for (const c of FIFA_COUNTRIES) {
      const cl = c.toLowerCase();
      if (cl.startsWith(q)) prefixes.push(c);
      else if (cl.includes(q)) substrings.push(c);
    }
    return [...prefixes, ...substrings];
  }, [query]);

  const handlePick = (country: string) => {
    Haptics.selectionAsync().catch(() => {});
    onPick(country);
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
            <Feather name="x" size={22} color={theme.colors.t1} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color={theme.colors.t3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.t3}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.searchInput}
            selectionColor={theme.colors.t1}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x-circle" size={18} color={theme.colors.t3} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active = item === value;
            return (
              <Pressable
                onPress={() => handlePick(item)}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                  {item}
                </Text>
                {active && <Feather name="check" size={18} color={theme.colors.t1} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No match.</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.t1,
    letterSpacing: -0.3,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t1,
  },
  list: { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    marginBottom: 2,
    borderRadius: theme.radii.md,
  },
  rowActive: { backgroundColor: theme.colors.glassHover },
  rowLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t2,
  },
  rowLabelActive: { color: theme.colors.t1, fontFamily: theme.fonts.bodyMedium },
  empty: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t3,
    textAlign: 'center',
    paddingVertical: theme.spacing.xxl,
  },
});
