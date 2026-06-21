import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
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

import { theme } from '../src/lib/theme';
import { useAuth } from '../src/hooks/useAuth';
import { usePlayer } from '../src/hooks/usePlayer';
import { useDeepLink } from '../src/hooks/useDeepLink';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading: authLoading } = useAuth();
  const { player, loading: playerLoading } = usePlayer();
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

  useEffect(() => {
    if (authLoading || !fontsLoaded) return;
    const first = segments[0];
    const inAuth = first === '(auth)';
    const inOnboarding = first === '(onboarding)';
    const inApp = first === '(app)';

    // Not signed in → must be on auth screens.
    if (!session) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    // Signed in but the player row hasn't loaded yet — wait for it before
    // deciding between onboarding and the main app.
    if (playerLoading) return;

    // Signed in + no profile → onboarding.
    if (!player) {
      if (!inOnboarding) router.replace('/(onboarding)/step-1-personal');
      return;
    }

    // Signed in + profile → main app.
    if (inAuth || inOnboarding) {
      router.replace('/(app)/chat');
    }
  }, [session, authLoading, player, playerLoading, fontsLoaded, segments, router]);

  if (!fontsLoaded || authLoading) return null;

  return (
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
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
