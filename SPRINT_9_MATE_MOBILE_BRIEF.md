# SPRINT 9 — MATE AI Mobile (Expo + React Native)
## Claude Code Deployment Brief — Production-Ready Build Specification

**Owner:** Vitalii Lomov · Talent Mates Limited
**Target:** iOS + Android · App Store + Google Play
**Sprint goal:** Ship MATE AI as a native-feeling mobile app with full feature parity to `mate-dashboard-v6.html`
**Estimated build time (Claude Code):** 3 working sessions (~9 hours) to MVP testable on Yegor's iPhone

---

## 0. HARD RULES — DO NOT VIOLATE

1. **Reuse existing Supabase backend.** Zero new Edge Functions in this sprint. The mobile app talks to `mate-chat`, `create-checkout`, `stripe-webhook` exactly as the web does.
2. **Inside Shell design only.** Saturated purple `#794DC6` as ground, white-on-purple glass cards. No film grain (grain belongs to brand storytelling, not product).
3. **TypeScript strict mode.** `"strict": true` in tsconfig. No `any` types unless explicitly justified in a comment.
4. **No Apple In-App Purchase.** All subscription flows open external browser to existing Stripe Checkout. Reason: keeps 100% of €10/month margin instead of 70%.
5. **Protected lines — never rephrase:**
   - *MATE doesn't play. MATE prepares the ones who do.*
   - *MATE AI — the race engineer for football.*
6. **Banned vocabulary** in any user-facing string: "AI assistant", "AI tool", "platform", "solution", "smart", "powered by AI", "next-gen", "revolutionary", "disruptive".
7. **Language auto-detection.** The Edge Function already handles this — the app must pass the raw user message untouched.
8. **Fonts: DM Serif Display + DM Sans only.** Loaded via `expo-font` from local assets, never web fonts.
9. **No emojis in copy.** Use `@expo/vector-icons` (Lucide set) for all iconography. Agent pills are the only exception (they keep ⚖️ 🏋️ 📊 🏠 to match web).
10. **One repo, separate from web.** New repo: `talent-mates-mobile`. Local path: `/Users/vitalijlomov/Documents/AI agents/MateMobile/`.

---

## 1. SCOPE

### v1.0 (this sprint — ship to TestFlight + Internal Testing)
- [x] Auth: email/password + Google OAuth
- [x] Onboarding: 5-step player profile (parity with web)
- [x] Chat: 4 agents (Legal / Coach / Analyst / Concierge) + auto-detect
- [x] Conversation history (sidebar → drawer on mobile)
- [x] Training Log: full 20+ metric form + history list
- [x] Profile edit (name, club, position, bio, language)
- [x] Pro upgrade button → opens Stripe Checkout in `expo-web-browser`
- [x] Pro badge in header when subscription active
- [x] Pull-to-refresh on chat and history
- [x] Markdown rendering for MATE responses

### v1.1 (next sprint — after pilot feedback)
- PDF contract upload (`expo-document-picker`)
- Push notifications (`expo-notifications` + Supabase webhook)
- Biometric login (Face ID / Touch ID)
- Native share sheet for conversations

### Out of v1.x
- Offline mode (defer to v2.0)
- Apple Watch companion
- Voice input

---

## 2. TECH STACK

| Layer | Technology | Pinned version |
|---|---|---|
| Runtime | Expo SDK | `~51.0.0` (latest stable) |
| Framework | React Native | `0.74.x` |
| Language | TypeScript | `~5.3.0` strict |
| Routing | expo-router | `~3.5.0` (file-based) |
| Backend client | @supabase/supabase-js | `^2.39.0` |
| Secure storage | expo-secure-store | latest |
| OAuth | expo-auth-session + expo-crypto + expo-web-browser | latest |
| Fonts | expo-font | latest |
| Icons | @expo/vector-icons (Lucide) | latest |
| Markdown | react-native-markdown-display | `^7.0.0` |
| Keyboard | react-native-keyboard-controller | `^1.12.0` |
| Animations | react-native-reanimated | `~3.10.0` |
| Build/Deploy | EAS Build + EAS Submit | latest CLI |

---

## 3. PROJECT STRUCTURE

```
talent-mates-mobile/
├── app/                              ← expo-router file-based routing
│   ├── _layout.tsx                   ← root layout: fonts, auth gate, providers
│   ├── index.tsx                     ← entry redirect (auth → app, no-auth → auth)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx               ← progress bar + back/skip
│   │   ├── step-1-personal.tsx
│   │   ├── step-2-career.tsx
│   │   ├── step-3-physical.tsx
│   │   ├── step-4-contract.tsx
│   │   └── step-5-preferences.tsx
│   └── (app)/
│       ├── _layout.tsx               ← bottom tabs (Chat / Training / Profile)
│       ├── chat/
│       │   ├── index.tsx             ← chat screen (the heart of the product)
│       │   └── history.tsx           ← sessions list (drawer)
│       ├── training/
│       │   ├── index.tsx             ← logs list
│       │   └── new.tsx               ← new log form
│       ├── profile/
│       │   ├── index.tsx             ← profile + settings
│       │   └── upgrade.tsx           ← Pro upgrade screen
│       └── modal-conversation-menu.tsx ← rename/delete chat
├── src/
│   ├── components/
│   │   ├── GlassCard.tsx
│   │   ├── PillButton.tsx
│   │   ├── GhostButton.tsx
│   │   ├── AgentPillRow.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── PulseDot.tsx
│   │   ├── BrandHeader.tsx
│   │   ├── ProBadge.tsx
│   │   ├── FormField.tsx
│   │   └── LoadingMate.tsx           ← MATE typing animation
│   ├── lib/
│   │   ├── supabase.ts               ← client + secure-store storage adapter
│   │   ├── mate-chat.ts              ← Edge Function caller
│   │   ├── auth.ts                   ← signIn / signUp / signOut / Google OAuth
│   │   ├── theme.ts                  ← design tokens
│   │   └── types.ts                  ← shared TS types
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePlayer.ts
│   │   ├── useConversation.ts
│   │   ├── useSubscription.ts
│   │   └── useFonts.ts
│   └── constants/
│       ├── agents.ts                 ← agent metadata (id, label, emoji, color)
│       └── strings.ts                ← all user-facing copy (i18n-ready)
├── assets/
│   ├── fonts/
│   │   ├── DMSerifDisplay-Regular.ttf
│   │   ├── DMSerifDisplay-Italic.ttf
│   │   ├── DMSans-Regular.ttf
│   │   ├── DMSans-Medium.ttf
│   │   └── DMSans-Light.ttf
│   ├── icon.png                      ← 1024x1024, purple bg, white M wordmark
│   ├── adaptive-icon.png             ← 1024x1024 Android adaptive
│   ├── splash.png                    ← 1284x2778, purple bg, MATE wordmark center
│   └── favicon.png                   ← 48x48 (for web export, if needed)
├── app.json
├── eas.json
├── tsconfig.json
├── package.json
├── babel.config.js
├── .env.example
└── README.md
```

---

## 4. SETUP COMMANDS (execute in order)

```bash
# 0. Pre-flight: Node 20+, Xcode 15+, Android Studio Hedgehog+
node --version    # must be >= 20
xcodebuild -version
# Install EAS CLI globally if missing
npm install -g eas-cli

# 1. Bootstrap project
cd "/Users/vitalijlomov/Documents/AI agents/"
npx create-expo-app@latest MateMobile --template tabs
cd MateMobile

# 2. Core dependencies
npx expo install @supabase/supabase-js \
  expo-secure-store \
  expo-auth-session \
  expo-crypto \
  expo-web-browser \
  expo-font \
  expo-linking \
  expo-splash-screen \
  expo-status-bar \
  expo-router \
  expo-constants

# 3. UI dependencies
npx expo install react-native-markdown-display \
  @expo/vector-icons \
  react-native-keyboard-controller \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-safe-area-context \
  react-native-screens

# 4. Dev tools
npm install -D @types/react @types/react-native typescript

# 5. Initialize git + first commit
git init
git add .
git commit -m "Sprint 9 day 1: Expo project bootstrap"

# 6. Create remote (after creating empty repo `talent-mates-mobile` on GitHub)
git remote add origin git@github.com:vitaliylomov-creator/talent-mates-mobile.git
git branch -M main
git push -u origin main
```

---

## 5. EXPO CONFIGURATION (`app.json`)

```json
{
  "expo": {
    "name": "MATE AI",
    "slug": "mate-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "matemobile",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#794DC6"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.talentmates.mate",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "UIStatusBarStyle": "UIStatusBarStyleLightContent"
      },
      "associatedDomains": [
        "applinks:vitaliylomov-creator.github.io"
      ]
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#794DC6"
      },
      "package": "com.talentmates.mate",
      "versionCode": 1,
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "matemobile" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/DMSerifDisplay-Regular.ttf",
            "./assets/fonts/DMSerifDisplay-Italic.ttf",
            "./assets/fonts/DMSans-Regular.ttf",
            "./assets/fonts/DMSans-Medium.ttf",
            "./assets/fonts/DMSans-Light.ttf"
          ]
        }
      ]
    ],
    "extra": {
      "router": { "origin": false },
      "eas": { "projectId": "TO_BE_FILLED_BY_EAS_INIT" }
    },
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 6. CRITICAL FILES — FULL CODE

### 6.1 `src/lib/theme.ts` — Design tokens (Inside Shell)

```typescript
export const theme = {
  colors: {
    // Purple ground — Inside Shell signature
    purple:      '#794DC6',
    purpleDark:  '#5d3aa5',
    purpleLight: '#9d6ee8',
    purpleDeep:  '#3d2566',
    
    // Glass surfaces (white over purple)
    glass:       'rgba(255,255,255,0.05)',
    glassHover:  'rgba(255,255,255,0.10)',
    glassActive: 'rgba(255,255,255,0.15)',
    
    // Text
    white: '#ffffff',
    t1:    '#ffffff',
    t2:    'rgba(255,255,255,0.82)',
    t3:    'rgba(255,255,255,0.55)',
    t4:    'rgba(255,255,255,0.35)',
    
    // Borders
    border:        'rgba(255,255,255,0.10)',
    borderMid:     'rgba(255,255,255,0.20)',
    borderStrong:  'rgba(255,255,255,0.35)',
    
    // Live / success
    accentGreen: '#6dffb3',
    
    // Status
    danger:  '#ff5d6c',
    warning: '#ffb84d',
  },
  fonts: {
    display:       'DMSerifDisplay-Regular',
    displayItalic: 'DMSerifDisplay-Italic',
    bodyLight:     'DMSans-Light',
    body:          'DMSans-Regular',
    bodyMedium:    'DMSans-Medium',
  },
  radii: {
    sm:   8,
    md:   14,
    lg:   24,
    pill: 100,
  },
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    xxl: 48,
  },
  shadows: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
```

### 6.2 `src/lib/supabase.ts` — Supabase client with SecureStore

```typescript
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL = 'https://zlkzjeaojpxzccpovygk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3E7wboJ9pXRrMxCfDzxxaA_iauXsILn';

// SecureStore-backed storage for auth tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

> **Note:** also run `npx expo install react-native-url-polyfill` — required by Supabase SDK.

### 6.3 `src/lib/mate-chat.ts` — Edge Function caller (mirrors web exactly)

```typescript
import { supabase } from './supabase';

export type AgentType = 'auto' | 'legal' | 'coach' | 'analyst' | 'concierge';

export interface MateChatRequest {
  message: string;
  player_id: string;
  session_id: string;
  agent_type: AgentType;
  pdf_base64?: string;
  pdf_name?: string;
}

export interface MateChatResponse {
  response: string;
  agent_type: Exclude<AgentType, 'auto'>;
  had_real_time_data: boolean;
  had_pdf: boolean;
}

export async function callMateChat(
  req: MateChatRequest
): Promise<MateChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    'https://zlkzjeaojpxzccpovygk.supabase.co/functions/v1/mate-chat',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(req),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mate-chat ${res.status}: ${text}`);
  }

  return res.json();
}
```

### 6.4 `src/components/GlassCard.tsx`

```typescript
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

interface Props extends ViewProps {
  variant?: 'default' | 'elevated';
}

export function GlassCard({ children, style, variant = 'default', ...rest }: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.radii.lg,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  elevated: {
    backgroundColor: theme.colors.glassHover,
    ...theme.shadows.glass,
  },
});
```

### 6.5 `src/components/PillButton.tsx`

```typescript
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { theme } from '../lib/theme';

interface Props {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function PillButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: Props) {
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? theme.colors.t1 : theme.colors.purple} />
      ) : (
        <Text style={[styles.label, isGhost ? styles.labelGhost : styles.labelPrimary]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  primary: {
    backgroundColor: theme.colors.white,
  },
  ghost: {
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
  },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    letterSpacing: 2.5, // 0.18em equivalent
    textTransform: 'uppercase',
  },
  labelPrimary: { color: theme.colors.purple },
  labelGhost:   { color: theme.colors.t1 },
});
```

### 6.6 `src/components/ChatBubble.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { theme } from '../lib/theme';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  liveData?: boolean;
}

export function ChatBubble({ role, content, liveData }: Props) {
  const isUser = role === 'user';

  return (
    <View
      style={[
        styles.wrap,
        isUser ? styles.wrapUser : styles.wrapAssistant,
      ]}
    >
      {!isUser && liveData && (
        <View style={styles.liveBadge}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>LIVE DATA</Text>
        </View>
      )}
      {isUser ? (
        <Text style={styles.userText}>{content}</Text>
      ) : (
        <Markdown style={markdownStyles}>{content}</Markdown>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '85%',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  wrapUser: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.white,
  },
  wrapAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  userText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.purple,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accentGreen,
  },
  liveText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: theme.colors.accentGreen,
  },
});

const markdownStyles = {
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.t1,
  },
  strong: { fontFamily: theme.fonts.bodyMedium },
  em: { fontStyle: 'italic' as const },
  heading1: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.t1,
    marginTop: 10,
    marginBottom: 6,
  },
  bullet_list: { marginVertical: 6 },
  code_inline: {
    fontFamily: 'Menlo',
    backgroundColor: theme.colors.glassHover,
    color: theme.colors.accentGreen,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
};
```

### 6.7 `src/components/ChatInput.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = 'Message MATE...' }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.t3}
        multiline
        maxLength={2000}
        editable={!disabled}
        returnKeyType="send"
      />
      <Pressable
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        style={({ pressed }) => [
          styles.sendBtn,
          (!text.trim() || disabled) && styles.sendBtnDisabled,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Ionicons name="arrow-up" size={20} color={theme.colors.purple} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.glass,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.glassHover,
    borderRadius: theme.radii.md,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t1,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
```

### 6.8 `src/constants/agents.ts`

```typescript
export const AGENTS = [
  { id: 'auto',      label: 'Auto',      emoji: '◎',  desc: 'MATE decides' },
  { id: 'legal',     label: 'Legal',     emoji: '⚖️', desc: 'FIFA · contracts' },
  { id: 'coach',     label: 'Coach',     emoji: '🏋️', desc: 'Training · recovery' },
  { id: 'analyst',   label: 'Analyst',   emoji: '📊', desc: 'Market · transfers' },
  { id: 'concierge', label: 'Concierge', emoji: '🏠', desc: 'UK life · logistics' },
] as const;

export type AgentId = typeof AGENTS[number]['id'];
```

### 6.9 `app/_layout.tsx` — Root layout with font loading + auth gate

```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading } = useAuth();

  const [fontsLoaded] = useFonts({
    'DMSerifDisplay-Regular': require('../assets/fonts/DMSerifDisplay-Regular.ttf'),
    'DMSerifDisplay-Italic':  require('../assets/fonts/DMSerifDisplay-Italic.ttf'),
    'DMSans-Light':           require('../assets/fonts/DMSans-Light.ttf'),
    'DMSans-Regular':         require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium':          require('../assets/fonts/DMSans-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded && !loading) SplashScreen.hideAsync();
  }, [fontsLoaded, loading]);

  // Auth gate
  useEffect(() => {
    if (loading) return;
    const inAuthGroup    = segments[0] === '(auth)';
    const inOnboarding   = segments[0] === '(onboarding)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/chat');
    }
  }, [session, loading, segments]);

  if (!fontsLoaded || loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
```

### 6.10 `src/hooks/useAuth.ts`

```typescript
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
```

### 6.11 `app/(auth)/sign-in.tsx` — Reference screen (full)

```typescript
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { PillButton } from '../../src/components/PillButton';
import { theme } from '../../src/lib/theme';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    router.replace('/(app)/chat');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.wordmark}>MATE</Text>
            <Text style={styles.tagline}>
              The race engineer{'\n'}<Text style={styles.italic}>for football.</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholderTextColor={theme.colors.t3}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <View style={{ marginTop: 32 }}>
              <PillButton label="Sign in" onPress={handleSignIn} loading={loading} />
            </View>

            <Link href="/(auth)/sign-up" style={styles.link}>
              <Text style={styles.linkText}>
                No account? <Text style={styles.linkAccent}>Create one</Text>
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl },
  brand: { marginBottom: theme.spacing.xxl, alignItems: 'center' },
  wordmark: {
    fontFamily: theme.fonts.display,
    fontSize: 56,
    color: theme.colors.t1,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.t2,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 26,
  },
  italic: { fontFamily: theme.fonts.displayItalic },
  form: {},
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.colors.t3,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t1,
  },
  link: { marginTop: theme.spacing.lg, alignSelf: 'center' },
  linkText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t3,
  },
  linkAccent: { color: theme.colors.t1, fontFamily: theme.fonts.bodyMedium },
});
```

### 6.12 `app/(app)/chat/index.tsx` — Chat screen skeleton (the heart)

```typescript
import { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { ChatInput } from '../../../src/components/ChatInput';
import { AgentPillRow } from '../../../src/components/AgentPillRow';
import { BrandHeader } from '../../../src/components/BrandHeader';
import { theme } from '../../../src/lib/theme';
import { callMateChat, AgentType } from '../../../src/lib/mate-chat';
import { usePlayer } from '../../../src/hooks/usePlayer';
import { useConversation } from '../../../src/hooks/useConversation';

export default function ChatScreen() {
  const { player } = usePlayer();
  const { messages, sessionId, addMessage } = useConversation();
  const [agent, setAgent] = useState<AgentType>('auto');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = async (text: string) => {
    if (!player) return;
    addMessage({ role: 'user', content: text });
    setSending(true);
    try {
      const res = await callMateChat({
        message: text,
        player_id: player.id,
        session_id: sessionId,
        agent_type: agent,
      });
      addMessage({
        role: 'assistant',
        content: res.response,
        liveData: res.had_real_time_data,
      });
    } catch (err: any) {
      addMessage({
        role: 'assistant',
        content: `Error: ${err.message}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader player={player} />
      <AgentPillRow value={agent} onChange={setAgent} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ChatBubble
              role={item.role}
              content={item.content}
              liveData={item.liveData}
            />
          )}
        />
        <ChatInput onSend={handleSend} disabled={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  list: { padding: theme.spacing.md, gap: theme.spacing.xs },
});
```

---

## 7. SCREENS TO REPLICATE FROM WEB (parity reference)

For each, mirror the data shape from `mate-dashboard-v6.html` exactly. Components reuse the design tokens above.

| Web file | Mobile screen | Notes |
|---|---|---|
| `mate-onboarding.html` step 1 | `app/(onboarding)/step-1-personal.tsx` | Full name, DOB picker, nationality |
| `mate-onboarding.html` step 2 | `step-2-career.tsx` | Current club, league, position, foot |
| `mate-onboarding.html` step 3 | `step-3-physical.tsx` | Height, weight (number inputs) |
| `mate-onboarding.html` step 4 | `step-4-contract.tsx` | Contract expiry (date), agent name |
| `mate-onboarding.html` step 5 | `step-5-preferences.tsx` | Language, bio (multiline) |
| Training Log modal | `app/(app)/training/new.tsx` | All 20+ metrics; use sliders for 1-10 scales |
| Training History tab | `app/(app)/training/index.tsx` | FlatList of past sessions |
| Profile edit modal | `app/(app)/profile/index.tsx` | Same fields as onboarding, prefilled |
| Pro upgrade paywall | `app/(app)/profile/upgrade.tsx` | Opens external Stripe via `expo-web-browser` |

---

## 8. STRIPE UPGRADE FLOW — CRITICAL IMPLEMENTATION

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export async function openUpgradeFlow() {
  const returnUrl = Linking.createURL('upgrade-complete');
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { return_url: returnUrl }
  });
  if (error || !data?.url) throw new Error('Checkout failed');

  const result = await WebBrowser.openAuthSessionAsync(data.url, returnUrl);
  // After user returns, refetch subscription status
  if (result.type === 'success') {
    // trigger subscription refetch in calling component
  }
}
```

**Compliance note (App Store):**
- Button label: `"Manage subscription"` or `"Go Pro"` — **NOT** `"Subscribe €10/month"`
- Do not display price inside the app — let Stripe Checkout show it
- This pattern is what Spotify, Netflix, and Audible use post-EU DMA. Apple cannot reject for it, but they can reject for displaying prices in-app while linking out.

---

## 9. GOOGLE OAUTH SETUP (uses existing Google Cloud project)

Existing project: **Talent Mates MATE AI** (per memory). Add two new OAuth client IDs:

1. **iOS client**
   - Bundle ID: `com.talentmates.mate`
   - URL Scheme: `com.googleusercontent.apps.<reversed-client-id>`

2. **Android client**
   - Package: `com.talentmates.mate`
   - SHA-1: from `eas credentials` after first build

Update Supabase Auth redirect URLs to include:
```
matemobile://auth/callback
```

Implementation reference: see `expo-auth-session/providers/google` docs. Token after OAuth is set into Supabase via `supabase.auth.setSession()`.

---

## 10. EAS BUILD CONFIGURATION (`eas.json`)

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "vitaliylomov@gmail.com",
        "ascAppId": "TO_BE_FILLED_AFTER_APP_STORE_CONNECT_SETUP",
        "appleTeamId": "TO_BE_FILLED_AFTER_DUNS"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 11. BUILD & SHIP COMMANDS

```bash
# 1. Initial EAS setup (one time)
eas login
eas init    # creates project ID, writes to app.json

# 2. Configure credentials (one time per platform)
eas credentials

# 3. Development build (install on Yegor's iPhone via TestFlight or Expo Go)
eas build --profile development --platform ios
eas build --profile development --platform android

# 4. Preview build (internal testing, no App Store review)
eas build --profile preview --platform all

# 5. Production build (App Store + Play Store)
eas build --profile production --platform all

# 6. Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 12. PREREQUISITES — VITALII'S TODO BEFORE CLAUDE CODE STARTS

| # | Task | Owner | Critical path |
|---|---|---|---|
| 1 | Apply for D-U-N-S Number (Dun & Bradstreet, free, 5 days) | Vitalii | Yes — blocks Apple Developer Program enrollment under Talent Mates Ltd |
| 2 | Enroll in Apple Developer Program ($99/year) | Vitalii | After D-U-N-S arrives |
| 3 | Create Google Play Developer account ($25 one-time) | Vitalii | Can do in parallel |
| 4 | Create empty GitHub repo `talent-mates-mobile` | Vitalii | Day 1 |
| 5 | Download DM Serif Display + DM Sans .ttf files from Google Fonts | Claude Code | Day 1 |
| 6 | Add two new OAuth client IDs in Google Cloud (iOS + Android) | Vitalii | After first EAS build (need SHA-1) |
| 7 | Add Supabase Auth redirect: `matemobile://auth/callback` | Vitalii | Day 1 |

---

## 13. QUALITY CHECKLIST (Inside Shell + Mobile)

Before any commit ships:

- [ ] All screens use `backgroundColor: theme.colors.purple` as ground
- [ ] All cards use `GlassCard` component or `theme.colors.glass` background
- [ ] Primary CTAs use `PillButton` with `variant="primary"` (white pill, purple text, uppercase, letter-spacing 2.5)
- [ ] All headings use `fontFamily: theme.fonts.display` (DM Serif Display)
- [ ] All body text uses `fontFamily: theme.fonts.body` (DM Sans)
- [ ] At least one `<Text style={{ fontFamily: theme.fonts.displayItalic }}>` per major heading (italic-accent rule)
- [ ] No emojis in body copy (agent pills are the only exception)
- [ ] No exclamation marks in any CTA
- [ ] No banned vocabulary present (Edge OS list)
- [ ] Protected lines used verbatim where present
- [ ] StatusBar set to `light` (white icons on purple)
- [ ] All forms wrap in `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"`
- [ ] All async operations show loading state (never silent freeze)
- [ ] All async operations handle error with `Alert.alert` or inline error
- [ ] No `console.log` in shipped code
- [ ] All TypeScript strict — no `any` without justification comment
- [ ] iOS: tested on iPhone SE (small) + iPhone 15 Pro Max (large)
- [ ] Android: tested on Pixel 6 emulator min
- [ ] Cold start to first screen < 2 seconds
- [ ] Chat: first AI response renders < 4 seconds (matches web)
- [ ] App icon: 1024x1024, purple bg, white M, no transparency
- [ ] Splash: brand wordmark center, purple bg, no animation needed at first
- [ ] App Store screenshots prepared for iPhone 6.7" (1290x2796)

---

## 14. DEFINITION OF DONE — v1.0

This sprint is done when:

1. Yegor can install MATE AI on his iPhone (via TestFlight)
2. Yegor signs in with the same Google account he uses on web
3. His existing player profile loads (same Supabase row)
4. He sends a Ukrainian message → MATE responds in Ukrainian (proves backend reuse)
5. He logs a training session on mobile → appears in web dashboard history
6. He taps "Go Pro" → Stripe Checkout opens in browser → returns to app → Pro badge appears
7. Three Slough Town U19 teammates can install via TestFlight invite
8. Cold start < 2s on iPhone 12 or newer
9. Production build passes Apple App Store validation (not yet submitted)
10. Production build passes Google Play internal testing track

---

## 15. WHAT THIS BRIEF IS NOT

- **Not a backend spec.** Backend is reused as-is. If Edge Function changes are needed, add them to Sprint 9.5 — out of scope here.
- **Not a copy guide.** All in-product copy follows Edge OS rules; reference `the-edge-os` skill before writing any user-facing string.
- **Not permission to skip the design system.** If a pattern is missing here, default to the Inside Shell rules in `talent-mates-design-system`.
- **Not a research project.** Every dependency listed is production-tested in apps shipping at scale. Do not substitute alternatives without justification.

---

## 16. NEXT 7-DAY EXECUTION PLAN

| Day | Deliverable |
|---|---|
| 1 | Repo bootstrapped, Expo running, fonts loading, theme.ts done, Supabase client connected. Run `npx expo start` → see purple splash on Yegor's phone via Expo Go. |
| 2 | Auth flow complete: sign-in, sign-up, sign-out. Real Supabase session. |
| 3 | Chat screen sending messages to `mate-chat`, rendering responses with markdown. Agent pills working. |
| 4 | Conversation history (drawer), session switching, new chat button. |
| 5 | Onboarding 5 steps for new users (write to `players` table). |
| 6 | Training Log new + history. Profile edit. Pro upgrade external browser flow. |
| 7 | Polish pass: animations, error states, loading states. First TestFlight build. Yegor installs. |

---

**MATE doesn't play. MATE prepares the ones who do.**

End of brief. Hand this file to Claude Code with instruction:
*"Execute SPRINT_9_MATE_MOBILE_BRIEF.md from day 1 step 1. Stop at each day boundary for review."*
