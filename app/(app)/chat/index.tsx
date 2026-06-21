import { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../../src/lib/theme';
import { getLang } from '../../../src/lib/lang';
import type { AgentId, ChatMessage } from '../../../src/lib/types';
import { usePlayer } from '../../../src/hooks/usePlayer';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { useConversation } from '../../../src/hooks/useConversation';

import { BrandHeader } from '../../../src/components/BrandHeader';
import { AgentPillRow } from '../../../src/components/AgentPillRow';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { ChatInput } from '../../../src/components/ChatInput';
import { LoadingMate } from '../../../src/components/LoadingMate';
import { EmptyChat } from '../../../src/components/EmptyChat';
import { ConversationDrawer } from '../../../src/components/ConversationDrawer';

export default function ChatScreen() {
  const lang = getLang();
  const { player } = usePlayer();
  const { isPro } = useSubscription();
  const { sessionId, messages, sending, error, send, startNew, loadSession } = useConversation(player?.id ?? null);

  const [agent, setAgent] = useState<AgentId>('auto');
  const [draft, setDraft] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Auto-scroll on new messages or while typing animation completes.
  useEffect(() => {
    if (messages.length === 0) return;
    const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages.length, sending]);

  const handleSend = (text: string) => {
    void send(text, agent);
  };

  const handleSuggestion = (text: string) => {
    setDraft(text);
  };

  // mate-chat returns the resolved agent inside each response; we surface
  // the user's *selected* agent on user bubbles via colour but keep the
  // selector controlled by the manual pill choice.

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandHeader
        isPro={isPro}
        onPressHistory={() => setDrawerOpen(true)}
        onPressNewChat={startNew}
      />
      <AgentPillRow value={agent} onChange={setAgent} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <EmptyChat
            lang={lang}
            playerName={firstName(player?.full_name)}
            onSuggestion={handleSuggestion}
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ChatBubble role={item.role} content={item.content} liveData={item.liveData} />
            )}
            ListFooterComponent={sending ? <LoadingMate /> : null}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardDismissMode="interactive"
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ChatInput
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          disabled={sending || !player}
        />
      </KeyboardAvoidingView>

      <ConversationDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        playerId={player?.id ?? null}
        currentSessionId={sessionId}
        onPickSession={(id) => { void loadSession(id); }}
        onNewChat={startNew}
      />
    </SafeAreaView>
  );
}

function firstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: 2,
  },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 6,
  },
});
