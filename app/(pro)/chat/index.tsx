import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';

// Sprint 2 Day 3 replaces this stub with the real Agent chat surface
// (sub-agent picker, message list, mate-pro-chat wiring, markdown render).
// Day 1 just proves the auth gate lands an authenticated agent here.
export default function ProChatStub() {
  const { agent } = useAgent();
  const displayName = agent?.first_name ?? 'Agent';
  const founding = agent?.is_founding && agent.founding_number
    ? `Founding #${agent.founding_number}`
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <Text style={styles.eyebrow}>MATE PRO</Text>
        <Text style={styles.title}>
          On the line, {displayName}.
        </Text>
        {founding ? <Text style={styles.badge}>{founding}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  eyebrow: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 4,
    color: theme.colors.accentGreen,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.t1,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  badge: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: theme.colors.accentGreen,
    marginTop: theme.spacing.md,
    textTransform: 'uppercase',
  },
});
