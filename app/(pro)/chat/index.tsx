import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { theme } from '../../../src/lib/theme';
import { getLang } from '../../../src/lib/lang';
import type { ProSubAgent } from '../../../src/lib/agent';
import type { AgentId } from '../../../src/lib/types';
import type { ProMessage } from '../../../src/lib/conversations-pro';

import { useAgent } from '../../../src/hooks/useAgent';
import { useProConversation } from '../../../src/hooks/useProConversation';
import { track, EVT } from '../../../src/lib/analytics';

import { ProBrandHeader } from '../../../src/components/ProBrandHeader';
import { AgentPillRow } from '../../../src/components/AgentPillRow';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { ChatInput } from '../../../src/components/ChatInput';
import { LoadingMate } from '../../../src/components/LoadingMate';

// AgentId (Player) and ProSubAgent (Pro) share identical string values —
// safe to cast between them at the picker boundary.
type _Compat = AgentId extends ProSubAgent ? true : false;

const SUB_AGENT_LABEL: Record<Exclude<ProSubAgent, 'auto'>, string> = {
  legal:     'Legal',
  coach:     'Coach',
  analyst:   'Analyst',
  concierge: 'Concierge',
};

export default function ProChat() {
  const lang = getLang();
  const params = useLocalSearchParams<{ client_id?: string; client_name?: string }>();
  const { agent } = useAgent();
  const {
    messages, sending, error, send, startNew, setClient, clientId,
  } = useProConversation({ initialClientId: params.client_id ?? null });

  const [subAgent, setSubAgent] = useState<ProSubAgent>('auto');
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ProMessage>>(null);

  // If the deep-link params change after mount (e.g. tapping "Ask MATE about
  // another client" while already on chat), reflect that in state.
  useEffect(() => {
    if (params.client_id && params.client_id !== clientId) {
      setClient(params.client_id);
    }
  }, [params.client_id, clientId, setClient]);

  const handleClearClient = () => {
    setClient(null);
    startNew();
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages.length, sending]);

  const handleSwitchAgent = (id: AgentId) => {
    const next = id as ProSubAgent;
    if (next === subAgent) return;
    setSubAgent(next);
    track(EVT.proSubAgentSwitch, { sub_agent: next });
  };

  const handleSend = (text: string) => {
    void send(text, subAgent);
  };

  const displayName = agent?.first_name ?? 'Agent';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ProBrandHeader
        isFounding={agent?.is_founding}
        foundingNumber={agent?.founding_number}
        ffarVerified={agent?.ffar_verified}
        onPressHistory={() => { /* D4 opens drawer */ }}
        onPressNewChat={startNew}
      />
      {clientId && params.client_name ? (
        <View style={styles.clientChip}>
          <Feather name="user" size={13} color={theme.colors.accentGreen} />
          <Text style={styles.clientChipText}>About {params.client_name}</Text>
          <Pressable onPress={handleClearClient} hitSlop={8}
            accessibilityLabel="Unscope conversation">
            <Feather name="x" size={14} color={theme.colors.t2} />
          </Pressable>
        </View>
      ) : null}
      <AgentPillRow value={subAgent as AgentId} onChange={handleSwitchAgent} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <ProEmpty lang={lang} displayName={displayName} onSuggestion={setDraft} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ChatBubble
                role={item.role === 'system' ? 'assistant' : item.role}
                content={item.content}
                agentLabel={item.subAgent ? SUB_AGENT_LABEL[item.subAgent] : undefined}
              />
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
          disabled={sending || !agent}
          placeholder={lang === 'ua' ? 'Питай MATE Pro…' : 'Ask MATE Pro…'}
          showVoice={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface EmptyProps {
  lang: 'en' | 'ua';
  displayName: string;
  onSuggestion: (text: string) => void;
}

function ProEmpty({ lang, displayName, onSuggestion }: EmptyProps) {
  const suggestions = lang === 'ua' ? [
    'Комісія FFAR для U18 в Прем\'єр-лізі — верхня межа?',
    'Скласти план розмови з клубом про подовження контракту.',
    'Ринкова вартість CM 22 років у Championship.',
    'Найкращі напрямки для першого зарубіжного трансферу.',
  ] : [
    'FFAR commission cap for a U18 in the Premier League?',
    'Draft a talking-points brief for a contract renewal call.',
    'Market value for a 22 y/o CM in the Championship.',
    'Best first-move destinations for a young UK player.',
  ];

  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyHello}>{displayName}.</Text>
      <Text style={styles.emptyBody}>
        {lang === 'ua'
          ? 'На зв\'язку.\nПитай.'
          : 'On the line.\nAsk anything.'}
      </Text>
      <View style={styles.chips}>
        {suggestions.map((s) => (
          <Text
            key={s}
            style={styles.chip}
            onPress={() => onSuggestion(s)}
          >
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
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
  clientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.glassHover,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
  },
  clientChipText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.t1,
    letterSpacing: 0.3,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyHello: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.t1,
    letterSpacing: -0.5,
  },
  emptyBody: {
    fontFamily: theme.fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.t2,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  chips: {
    gap: 10,
    width: '100%',
    alignItems: 'stretch',
  },
  chip: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.md,
  },
});
