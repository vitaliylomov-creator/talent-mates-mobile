import { Stack } from 'expo-router';
import { theme } from '../../src/lib/theme';
import { OnboardingProvider } from '../../src/hooks/useOnboarding';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.purple },
        }}
      />
    </OnboardingProvider>
  );
}
