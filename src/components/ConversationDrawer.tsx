import { useEffect, useMemo } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, SectionList, RefreshControl, Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../lib/theme';
import { t } from '../constants/strings';
import { getLang } from '../lib/lang';
import { bucketFor, relativeTime } from '../lib/time';
import { AGENTS } from '../constants/agents';
import type { ConversationSummary } from '../lib/types';
import { useConversationList } from '../hooks/useConversationList';

interface Props {
  visible: boolean;
  onClose: () => void;
  playerId: string | null;
  currentSessionId: string;
  onPickSession: (sessionId: string) => void;
  onNewChat: () => void;
}

const DRAWER_WIDTH_PCT = 0.86;
const SLIDE_DURATION = 220;

export function ConversationDrawer({
  visible, onClose, playerId, currentSessionId, onPickSession, onNewChat,
}: Props) {
  const lang = getLang();
  const { items, loading, error, reload, remove } = useConversationList(playerId);

  const translateX = useSharedValue(-500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: SLIDE_DURATION });
      backdropOpacity.value = withTiming(1, { duration: SLIDE_DURATION });
      void reload();
    } else {
      translateX.value = withTiming(-500, { duration: SLIDE_DURATION });
      backdropOpacity.value = withTiming(0, { duration: SLIDE_DURATION });
    }
  }, [visible, reload]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Group items into Today / Yesterday / This week / Older sections.
  const sections = useMemo(() => {
    const buckets = new Map<string, { title: string; data: ConversationSummary[] }>();
    const order = ['today', 'yesterday', 'this_week', 'older'];
    for (const item of items) {
      const b = bucketFor(item.last_message_at, lang);
      const cur = buckets.get(b.key);
      if (cur) cur.data.push(item);
      else buckets.set(b.key, { title: b.label, data: [item] });
    }
    return order
      .map(k => buckets.get(k))
      .filter((v): v is { title: string; data: ConversationSummary[] } => !!v);
  }, [items, lang]);

  const handlePick = (sessionId: string) => {
    Haptics.selectionAsync().catch(() => {});
    onPickSession(sessionId);
    // Close drawer after small delay so user sees the active state flick.
    setTimeout(() => onClose(), 80);
  };

  const handleDelete = (item: ConversationSummary) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      lang === 'ua' ? 'Видалити чат?' : 'Delete chat?',
      item.title,
      [
        { text: lang === 'ua' ? 'Скасувати' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ua' ? 'Видалити' : 'Delete',
          style: 'destructive',
          onPress: () => { void remove(item.session_id); },
        },
      ],
    );
  };

  const handleNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNewChat();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close drawer" />
        </Animated.View>

        <Animated.View style={[styles.drawer, drawerStyle]}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <Text style={styles.brand}>MATE</Text>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close"
                hitSlop={12}
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              >
                <Feather name="x" size={22} color={theme.colors.t1} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleNew}
              style={({ pressed }) => [styles.newChat, pressed && { opacity: 0.85 }]}
            >
              <Feather name="edit" size={16} color={theme.colors.purple} />
              <Text style={styles.newChatLabel}>
                {lang === 'ua' ? 'Новий чат' : 'New chat'}
              </Text>
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {items.length === 0 && !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('emptyHistory', lang)}</Text>
              </View>
            ) : (
              <SectionList
                sections={sections}
                keyExtractor={(item) => item.session_id}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={reload}
                    tintColor={theme.colors.t2}
                  />
                }
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={styles.sectionLabel}>{title}</Text>
                )}
                renderItem={({ item }) => (
                  <ConversationItem
                    item={item}
                    active={item.session_id === currentSessionId}
                    relativeLabel={relativeTime(item.last_message_at, lang)}
                    onPress={() => handlePick(item.session_id)}
                    onLongPress={() => handleDelete(item)}
                  />
                )}
                ListFooterComponent={loading && items.length > 0 ? (
                  <ActivityIndicator color={theme.colors.t2} style={{ marginTop: 12 }} />
                ) : null}
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface ItemProps {
  item: ConversationSummary;
  active: boolean;
  relativeLabel: string;
  onPress: () => void;
  onLongPress: () => void;
}

function ConversationItem({ item, active, relativeLabel, onPress, onLongPress }: ItemProps) {
  const agent = AGENTS.find(a => a.id === item.agent_type) ?? AGENTS[0];
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.itemEmoji}>{agent.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, active && styles.itemTitleActive]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemMeta}>{relativeLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13,6,23,0.55)',
  },
  drawer: {
    width: `${DRAWER_WIDTH_PCT * 100}%`,
    height: '100%',
    backgroundColor: theme.colors.purpleDeep,
    borderRightWidth: 0.5,
    borderRightColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  brand: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.t1,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
  },
  newChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
  },
  newChatLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    letterSpacing: 0.3,
    color: theme.colors.purple,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t4,
    textTransform: 'uppercase',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  itemActive: {
    backgroundColor: theme.colors.glassHover,
  },
  itemEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  itemTitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.t2,
  },
  itemTitleActive: {
    color: theme.colors.t1,
    fontFamily: theme.fonts.bodyMedium,
  },
  itemMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.t4,
    marginTop: 2,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t3,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    marginVertical: 8,
  },
});
