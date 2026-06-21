import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export function ProBadge() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.white,
  },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: theme.colors.purple,
  },
});
