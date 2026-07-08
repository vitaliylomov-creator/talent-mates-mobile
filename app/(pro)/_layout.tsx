import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../src/lib/theme';
import { getLang } from '../../src/lib/lang';

export default function ProLayout() {
  const lang = getLang();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.t1,
        tabBarInactiveTintColor: theme.colors.t4,
        sceneStyle: { backgroundColor: theme.colors.purple },
        tabBarStyle: {
          backgroundColor: theme.colors.purpleDk,
          borderTopWidth: 0.5,
          borderTopColor: theme.colors.border,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bodyMedium,
          fontSize: 11,
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => { Haptics.selectionAsync().catch(() => {}); },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: lang === 'ua' ? 'Чат' : 'Chat',
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: lang === 'ua' ? 'Клієнти' : 'Clients',
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          title: lang === 'ua' ? 'Відео' : 'Video',
          tabBarIcon: ({ color, size }) => <Feather name="video" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: lang === 'ua' ? 'Профіль' : 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
