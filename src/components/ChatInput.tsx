import { useState } from 'react';
import {
  View, TextInput, Pressable, StyleSheet, Keyboard, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { t } from '../constants/strings';
import { getLang } from '../lib/lang';
import { VoiceRecorder } from './VoiceRecorder';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  showVoice?: boolean;
}

export function ChatInput({
  onSend, disabled, value, onChangeText,
  placeholder, showVoice = true,
}: Props) {
  const lang = getLang();
  const [internal, setInternal] = useState('');
  const [recording, setRecording] = useState(false);
  const text = value ?? internal;
  const setText = onChangeText ?? setInternal;

  const canSend = text.trim().length > 0 && !disabled;
  const showMic = showVoice && text.trim().length === 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSend(trimmed);
    setText('');
    Keyboard.dismiss();
  };

  const handleMic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Keyboard.dismiss();
    setRecording(true);
  };

  return (
    <>
      <View style={styles.wrap}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? t('chatPlaceholder', lang)}
          placeholderTextColor={theme.colors.t3}
          multiline
          maxLength={4000}
          editable={!disabled}
          returnKeyType="default"
          textAlignVertical={Platform.OS === 'android' ? 'top' : undefined}
        />
        {showMic ? (
          <Pressable
            onPress={handleMic}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('voiceTapToTalk', lang)}
            style={({ pressed }) => [
              styles.iconBtn,
              styles.iconGhost,
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
              disabled && { opacity: 0.4 },
            ]}
          >
            <Feather name="mic" size={20} color={theme.colors.t1} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [
              styles.iconBtn,
              styles.iconSend,
              !canSend && { opacity: 0.4 },
              pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Feather name="arrow-up" size={20} color={theme.colors.purple} />
          </Pressable>
        )}
      </View>

      <VoiceRecorder
        visible={recording}
        onCancel={() => setRecording(false)}
        onResult={(transcribed) => {
          setRecording(false);
          setText((text ? text + ' ' : '') + transcribed);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: theme.colors.purple,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
    borderRadius: 22,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t1,
  },
  iconBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  iconSend: { backgroundColor: theme.colors.white },
  iconGhost: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
  },
});
