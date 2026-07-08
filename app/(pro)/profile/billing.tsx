import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../../src/lib/theme';
import { useAgent, useAgentSubscription } from '../../../src/hooks/useAgent';
import { cancelSubscription } from '../../../src/lib/agent';
import { openProUpgradeFlow, openProManageFlow } from '../../../src/lib/stripe-pro';
import { track, EVT } from '../../../src/lib/analytics';
import { PillButton } from '../../../src/components/PillButton';

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export default function Billing() {
  const router = useRouter();
  const { agent } = useAgent();
  const { subscription, loading, refetch } = useAgentSubscription(agent?.id);
  const [busy, setBusy] = useState<'checkout' | 'cancel' | null>(null);

  const isFoundingEligible =
    !!agent?.ffar_verified &&
    !!agent?.founding_number &&
    !!agent?.founding_window_ends_at &&
    new Date(agent.founding_window_ends_at).getTime() > Date.now();

  const status = subscription?.status ?? 'none';
  const plan = subscription?.plan;
  const trialDaysLeft = daysUntil(subscription?.trial_ends_at ?? null);
  const cancelAt = subscription?.cancel_at ?? null;

  const handleSubscribe = async () => {
    track(EVT.proSubscribeStart);
    setBusy('checkout');
    try {
      const result = await openProUpgradeFlow();
      if (result === 'success') {
        track(EVT.proSubscribeDone);
        await refetch();
      }
    } catch (e: any) {
      Alert.alert('Checkout failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleManage = async () => {
    try {
      await openProManageFlow();
    } catch (e: any) {
      Alert.alert('Open failed', e?.message ?? 'Unknown error');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel subscription?',
      cancelAt
        ? 'Already scheduled to cancel.'
        : 'You keep access until the current period ends.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel plan',
          style: 'destructive',
          onPress: async () => {
            track(EVT.proCancelStart);
            setBusy('cancel');
            try {
              await cancelSubscription();
              await refetch();
            } catch (e: any) {
              Alert.alert('Cancel failed', e?.message ?? 'Unknown error');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={24} color={theme.colors.t1} />
        </Pressable>
        <Text style={styles.topTitle}>Billing</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.t2} />
          </View>
        ) : (
          <>
            <StateCard
              status={status}
              plan={plan ?? null}
              trialDaysLeft={trialDaysLeft}
              cancelAt={cancelAt}
              periodEnd={subscription?.current_period_end ?? null}
            />

            {status === 'none' ? (
              <>
                <PriceBlock
                  eligible={isFoundingEligible}
                  foundingNumber={agent?.founding_number ?? null}
                  ffarVerified={!!agent?.ffar_verified}
                />
                <View style={{ height: theme.spacing.md }} />
                <PillButton
                  label={busy === 'checkout' ? 'Opening…' : 'Start 14-day trial'}
                  onPress={handleSubscribe}
                  loading={busy === 'checkout'}
                />
                {Platform.OS === 'ios' ? (
                  <Text style={styles.iosNote}>
                    iOS routes to the web to complete checkout. Native in-app purchase lands in a later release.
                  </Text>
                ) : null}
              </>
            ) : null}

            {status === 'trialing' || status === 'active' || status === 'past_due' ? (
              <>
                <View style={styles.actionRow}>
                  <View style={{ flex: 1 }}>
                    <PillButton
                      label="Manage on web"
                      onPress={handleManage}
                      variant="ghost"
                    />
                  </View>
                </View>
                {!cancelAt ? (
                  <Pressable
                    onPress={handleCancel}
                    disabled={busy === 'cancel'}
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      pressed && { opacity: 0.85 },
                      busy === 'cancel' && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.cancelLabel}>
                      {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface StateProps {
  status: string;
  plan: string | null;
  trialDaysLeft: number | null;
  cancelAt: string | null;
  periodEnd: string | null;
}

function StateCard({ status, plan, trialDaysLeft, cancelAt, periodEnd }: StateProps) {
  let title = '';
  let body = '';
  let accent: string = theme.colors.t3;

  if (status === 'trialing') {
    title = trialDaysLeft != null && trialDaysLeft > 0
      ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in trial`
      : 'Trial ends today';
    body = cancelAt
      ? `Ends ${cancelAt.slice(0, 10)}. No charge.`
      : `First charge on trial end${plan === 'founding' ? ' — €149/mo' : ' — €299/mo'}.`;
    accent = theme.colors.accentGreen;
  } else if (status === 'active') {
    title = plan === 'founding' ? 'Founding · €149 / mo' : 'Standard · €299 / mo';
    body = cancelAt
      ? `Cancellation scheduled for ${cancelAt.slice(0, 10)}.`
      : periodEnd ? `Renews ${periodEnd.slice(0, 10)}.` : 'Active.';
    accent = theme.colors.accentGreen;
  } else if (status === 'past_due') {
    title = 'Payment past due';
    body = 'Update the card on the web dashboard to keep access.';
    accent = theme.colors.warning;
  } else {
    title = 'No active subscription';
    body = 'Chat and video still work during soft launch. Subscribe to lock the Founding price.';
    accent = theme.colors.t2;
  }

  return (
    <View style={styles.card}>
      <View style={[styles.stateDot, { backgroundColor: accent }]} />
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
    </View>
  );
}

interface PriceProps {
  eligible: boolean;
  foundingNumber: number | null;
  ffarVerified: boolean;
}

function PriceBlock({ eligible, foundingNumber, ffarVerified }: PriceProps) {
  if (eligible && foundingNumber) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.accentGreen, borderColor: theme.colors.accentGreen }]}>
        <Text style={[styles.priceEyebrow, { color: theme.colors.purpleDeep }]}>
          FOUNDING #{foundingNumber}
        </Text>
        <Text style={[styles.priceValue, { color: theme.colors.purple }]}>€149 / month</Text>
        <Text style={[styles.priceBody, { color: theme.colors.purpleDk }]}>
          Locked at checkout. Even if verification lapses later.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.priceEyebrow}>STANDARD</Text>
      <Text style={styles.priceValue}>€299 / month</Text>
      <Text style={styles.priceBody}>
        {!ffarVerified
          ? 'FFAR verification pending. Once verified within your Founding window, checkout locks the €149 price.'
          : 'Founding window has closed or is not applicable.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  stateDot: {
    width: 8, height: 8, borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  stateTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  stateBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t2,
    lineHeight: 20,
  },
  priceEyebrow: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 3,
    color: theme.colors.t3,
    marginBottom: 6,
  },
  priceValue: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.t1,
    letterSpacing: -0.8,
  },
  priceBody: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.t2,
    marginTop: 6,
    lineHeight: 19,
  },
  actionRow: { flexDirection: 'row', marginBottom: theme.spacing.md },
  cancelBtn: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    marginTop: theme.spacing.sm,
  },
  cancelLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: theme.colors.danger,
    textTransform: 'uppercase',
  },
  iosNote: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t4,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 18,
  },
});
