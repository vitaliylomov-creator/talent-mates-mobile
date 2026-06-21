import { Stack } from 'expo-router';
import { theme } from '../../src/lib/theme';

// D1 stub — D3 replaces with bottom tabs (Chat / Training / Profile).
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.purple },
      }}
    />
  );
}
