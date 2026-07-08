import { Stack } from 'expo-router';
import { theme } from '../../src/lib/theme';

// Sprint 2 Day 3 replaces this with a bottom-tabs layout (Chat / Clients /
// Video / Profile). Day 1 keeps it a plain Stack so the auth gate can route
// signed-in agents somewhere valid.
export default function ProLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.purple },
      }}
    />
  );
}
