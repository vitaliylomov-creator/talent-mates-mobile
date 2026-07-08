import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { t } from '../constants/strings';
import { getLang } from '../lib/lang';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  liveData?: boolean;
  // Pro-side label ("LEGAL", "COACH", ...) displayed instead of LIVE DATA.
  // When both are passed, agentLabel wins.
  agentLabel?: string;
}

export function ChatBubble({ role, content, liveData, agentLabel }: Props) {
  const isUser = role === 'user';
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 260 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleLongPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await Clipboard.setStringAsync(content);
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        isUser ? styles.wrapUser : styles.wrapAssistant,
        animStyle,
      ]}
    >
      {!isUser && agentLabel ? (
        <View style={styles.liveBadge}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>{agentLabel.toUpperCase()}</Text>
        </View>
      ) : !isUser && liveData ? (
        <View style={styles.liveBadge}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>LIVE DATA</Text>
        </View>
      ) : null}
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={350}
        accessibilityHint={t('copiedMessage', getLang())}
      >
        {isUser ? (
          <Text style={styles.userText} selectable>{content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{content}</Markdown>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '88%',
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    marginVertical: 4,
  },
  wrapUser: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.white,
    borderTopRightRadius: 6,
  },
  wrapAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    borderTopLeftRadius: 6,
  },
  userText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
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
    width: 6, height: 6, borderRadius: 3,
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
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.t1,
  },
  strong: {
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.t1,
  },
  em: { fontStyle: 'italic' as const, color: theme.colors.t2 },
  link: {
    color: theme.colors.accentGreen,
    textDecorationLine: 'underline' as const,
  },
  heading1: {
    fontFamily: theme.fonts.display,
    fontSize: 22, color: theme.colors.t1,
    marginTop: 14, marginBottom: 8,
  },
  heading2: {
    fontFamily: theme.fonts.display,
    fontSize: 18, color: theme.colors.t1,
    marginTop: 12, marginBottom: 6,
  },
  heading3: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16, color: theme.colors.t1,
    marginTop: 10, marginBottom: 4,
  },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  bullet_list_icon: { color: theme.colors.t3 },
  ordered_list_icon: { color: theme.colors.t3 },
  blockquote: {
    backgroundColor: 'transparent',
    borderLeftColor: theme.colors.borderMid,
    borderLeftWidth: 2,
    paddingLeft: 12,
    marginVertical: 8,
  },
  code_inline: {
    fontFamily: 'Menlo',
    backgroundColor: theme.colors.glassHover,
    color: theme.colors.accentGreen,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    fontFamily: 'Menlo',
    backgroundColor: theme.colors.glassHover,
    color: theme.colors.t1,
    padding: 12, borderRadius: 8, marginVertical: 8,
  },
  hr: {
    backgroundColor: theme.colors.border,
    height: 0.5, marginVertical: 12,
  },
} as const;
