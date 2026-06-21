import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { t } from '../../../src/constants/strings';
import { getLang } from '../../../src/lib/lang';
import { openUpgradeFlow } from '../../../src/lib/stripe';
import { PillButton } from '../../../src/components/PillButton';

export default function Upgrade() {
  const router = useRouter();
  const lang = getLang();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const result = await openUpgradeFlow();
      setLoading(false);
      if (result === 'success') {
        Alert.alert('', t('proActivated', lang), [
          { text: 'OK', onPress: () => router.replace('/(app)/profile') },
        ]);
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert(t('errorGeneric', lang), e?.message ?? '');
    }
  };

  const benefits = lang === 'ua' ? [
    'Без обмежень повідомлень',
    'Live FIFA RSTP, ринок, погода',
    'Аналіз PDF контрактів',
    'Голосове введення',
    'Race-engineer завжди на зв\'язку',
  ] : [
    'No message limits',
    'Live FIFA RSTP, transfer market, weather',
    'Contract PDF analysis',
    'Voice input',
    'Race engineer always on the line',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={24} color={theme.colors.t1} />
        </Pressable>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>PRO</Text>
        <Text style={styles.title}>
          {lang === 'ua' ? (
            <>The race engineer{'\n'}<Text style={styles.italic}>without limits.</Text></>
          ) : (
            <>The race engineer{'\n'}<Text style={styles.italic}>without limits.</Text></>
          )}
        </Text>

        <View style={styles.list}>
          {benefits.map((b) => (
            <View key={b} style={styles.row}>
              <Feather name="check" size={18} color={theme.colors.accentGreen} />
              <Text style={styles.rowText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <PillButton
            label={t('paywallCta', lang)}
            onPress={handleUpgrade}
            loading={loading}
          />
          <Text style={styles.fineprint}>
            {lang === 'ua'
              ? 'Оплата і керування — на сайті через Stripe.\nСкасуй коли захочеш.'
              : 'Payment and management on the web via Stripe.\nCancel any time.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  eyebrow: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 4,
    color: theme.colors.accentGreen,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 44,
    color: theme.colors.t1,
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: theme.spacing.xxl,
  },
  italic: {
    fontFamily: theme.fonts.displayItalic,
    color: theme.colors.t3,
  },
  list: { gap: 14, marginBottom: theme.spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t1,
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: theme.spacing.lg,
  },
  fineprint: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t4,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 18,
  },
});
