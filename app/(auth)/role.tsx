import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '../../src/lib/theme';
import { getLang } from '../../src/lib/lang';
import { setIntent } from '../../src/lib/intent';
import type { MateRole } from '../../src/lib/agent';

// First-run role picker. Sets AsyncStorage `mate_intent` so the auth gate
// knows which onboarding to route the user to after sign-up completes.
export default function RolePicker() {
  const router = useRouter();
  const lang = getLang();
  const [chosen, setChosen] = useState<MateRole | null>(null);

  const pick = async (role: MateRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setChosen(role);
    await setIntent(role);
    // For MVP both roles funnel through the same sign-in screen. sign-in
    // reads intent + resolved product-row to decide the destination.
    // Sprint 2 Day 2 will replace this with role-specific sign-up screens.
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Text style={styles.wordmark}>MATE</Text>
          <Text style={styles.tagline}>
            {lang === 'ua' ? 'Хто на зв\'язку?' : (
              <>Who is <Text style={styles.italic}>on the line?</Text></>
            )}
          </Text>
        </View>

        <View style={styles.cards}>
          <RoleCard
            role="player"
            active={chosen === 'player'}
            title={lang === 'ua' ? 'Я гравець' : "I'm a player"}
            subtitle={lang === 'ua'
              ? 'Race engineer для твого сезону, контракту й тренувань.'
              : 'Race engineer for your season, contract, and training.'}
            icon="user"
            onPress={() => pick('player')}
          />
          <RoleCard
            role="agent"
            active={chosen === 'agent'}
            title={lang === 'ua' ? 'Я ліцензований агент' : "I'm a licensed agent"}
            subtitle={lang === 'ua'
              ? 'MATE Pro — race engineer для твого ростера.'
              : 'MATE Pro — race engineer for your roster.'}
            icon="briefcase"
            onPress={() => pick('agent')}
          />
        </View>

        <Text style={styles.footer}>
          {lang === 'ua'
            ? 'MATE не грає. MATE готує тих, хто грає.'
            : "MATE doesn't play. MATE prepares the ones who do."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface CardProps {
  role: MateRole;
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
}

function RoleCard({ active, title, subtitle, icon, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        active && styles.cardActive,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.cardIconWrap}>
        <Feather name={icon} size={22} color={theme.colors.t1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={22} color={theme.colors.t3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl * 1.5,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  brand: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  wordmark: {
    fontFamily: theme.fonts.display,
    fontSize: 72,
    color: theme.colors.t1,
    letterSpacing: -1.5,
    lineHeight: 78,
  },
  tagline: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t2,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 30,
  },
  italic: {
    fontFamily: theme.fonts.displayItalic,
    color: theme.colors.t3,
  },
  cards: {
    gap: theme.spacing.md,
    marginVertical: theme.spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  cardActive: {
    borderColor: theme.colors.white,
    backgroundColor: theme.colors.glassHover,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.glassHover,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 17,
    color: theme.colors.t1,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t3,
    marginTop: 2,
    lineHeight: 19,
  },
  footer: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t4,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: theme.spacing.xl,
  },
});
