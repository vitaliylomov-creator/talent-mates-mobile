import { useEffect } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';

import { PostHogProvider } from 'posthog-react-native';

import { theme } from '../src/lib/theme';
import { useAuth } from '../src/hooks/useAuth';
import { usePlayer } from '../src/hooks/usePlayer';
import { useAgent } from '../src/hooks/useAgent';
import { useDeepLink } from '../src/hooks/useDeepLink';
import { AnalyticsBridge } from '../src/components/AnalyticsBridge';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading: authLoading } = useAuth();
  const { player, loading: playerLoading } = usePlayer();
  const { agent, loading: agentLoading } = useAgent();
  useDeepLink();

  const [fontsLoaded] = useFonts({
    'DMSerifDisplay-Regular': DMSerifDisplay_400Regular,
    'DMSerifDisplay-Italic':  DMSerifDisplay_400Regular_Italic,
    'DMSans-Light':           DMSans_300Light,
    'DMSans-Regular':         DMSans_400Regular,
    'DMSans-Medium':          DMSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authLoading]);

  // Three-way auth gate — see MATE_PRO_MOBILE_BRIEFING.md §5, §6.
  // Order matters: agent wins over player when both rows somehow exist
  // (shouldn't happen; defensive default).
  useEffect(() => {
    if (authLoading || !fontsLoaded) return;
    const first = segments[0];
    const inAuth = first === '(auth)';
    const inOnboarding = first === '(onboarding)';
    const inApp = first === '(app)';
    const inPro = (first as string) === '(pro)';

    // Not signed in → auth stack (role picker is the entry).
    if (!session) {
      if (!inAuth) router.replace('/(auth)/role' as Href);
      return;
    }

    // Signed in — wait for both product-row lookups to resolve.
    if (playerLoading || agentLoading) return;

    // Signed in + agent row → MATE Pro tabs.
    if (agent) {
      if (!inPro) router.replace('/(pro)/chat' as Href);
      return;
    }

    // Signed in + player row → existing Player app.
    if (player) {
      if (!inApp) router.replace('/(app)/chat');
      return;
    }

    // Signed in, no product row yet — user is mid-flow. Route based on
    // stored intent from the role picker. Default falls back to Player
    // onboarding (existing behaviour before Sprint 2).
    // NOTE: intent-based routing to agent-sign-up-step-2 lands in Sprint 2
    // Day 2 alongside the agent registration screens.
    if (!inOnboarding && !inAuth) {
      router.replace('/(onboarding)/step-1-personal');
    }
  }, [
    session, authLoading, player, playerLoading, agent, agentLoading,
    fontsLoaded, segments, router,
  ]);

  if (!fontsLoaded || authLoading) return null;

  const innerTree = (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.purple }}>
      <KeyboardProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: theme.colors.purple },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(pro)" />
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );

  if (!POSTHOG_KEY) return innerTree;
  return (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{ host: POSTHOG_HOST, captureAppLifecycleEvents: true }}
    >
      <AnalyticsBridge />
      {innerTree}
    </PostHogProvider>
  );
}
