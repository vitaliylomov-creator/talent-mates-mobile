import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../src/lib/theme';
import { getLang } from '../../../src/lib/lang';

// D4 replaces with full roster: fetchClients + list + Add client + [clientId].
export default function ProClientsStub() {
  const lang = getLang();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{lang === 'ua' ? 'Клієнти' : 'Clients'}</Text>
        <Text style={styles.body}>
          {lang === 'ua'
            ? 'Ростер лендиться завтра.'
            : 'Roster lands tomorrow.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  title: {
    fontFamily: theme.fonts.display, fontSize: 36, color: theme.colors.t1,
    letterSpacing: -0.5, marginBottom: theme.spacing.md,
  },
  body: {
    fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.t2,
    textAlign: 'center', lineHeight: 24,
  },
});
