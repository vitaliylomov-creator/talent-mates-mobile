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

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading: authLoading } = useAuth();

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
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/chat');
    }
  }, [session, authLoading, fontsLoaded, segments, router]);

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
          <Stack.Screen name="(app)" />
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
