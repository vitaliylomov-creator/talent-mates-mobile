import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { theme } from '../lib/theme';
import { t } from '../constants/strings';
import { getLang } from '../lib/lang';
import { transcribeRecording } from '../lib/voice';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onResult: (text: string) => void;
}

// Hold-to-talk recorder overlay. Press the mic in ChatInput → this opens
// modally, recording starts immediately. Tap Stop to transcribe, X to cancel.
export function VoiceRecorder({ visible, onCancel, onResult }: Props) {
  const lang = getLang();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<'recording' | 'transcribing' | 'error'>('recording');
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedAtRef = useRef<number>(0);

  // Pulse the mic icon while recording.
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        setPhase('error');
        setErrorMsg(t('errorMicPermission', lang));
        return;
      }
      if (cancelled) return;
      await recorder.prepareToRecordAsync();
      await recorder.record();
      startedAtRef.current = Date.now();
      setPhase('recording');
      setElapsed(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    })();

    return () => { cancelled = true; };
  }, [visible]);

  // Timer.
  useEffect(() => {
    if (!visible || phase !== 'recording') return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [visible, phase]);

  const handleStop = async () => {
    if (phase !== 'recording') return;
    const durationMs = Date.now() - startedAtRef.current;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await recorder.stop();
    } catch { /* recorder may already be stopped */ }

    if (durationMs < 800) {
      setPhase('error');
      setErrorMsg(t('errorVoiceTooShort', lang));
      return;
    }

    const uri = recorder.uri;
    if (!uri) {
      setPhase('error');
      setErrorMsg(t('errorGeneric', lang));
      return;
    }

    setPhase('transcribing');
    try {
      const { text } = await transcribeRecording(uri, lang);
      if (text.trim()) {
        onResult(text.trim());
      } else {
        setPhase('error');
        setErrorMsg(t('errorVoiceTooShort', lang));
      }
    } catch (e: any) {
      setPhase('error');
      setErrorMsg(e?.message ?? t('errorGeneric', lang));
    }
  };

  const handleCancel = async () => {
    try { await recorder.stop(); } catch { /* noop */ }
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable onPress={handleCancel} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={22} color={theme.colors.t2} />
          </Pressable>

          {phase === 'recording' && (
            <>
              <Animated.View style={[styles.micCircle, pulseStyle]}>
                <Feather name="mic" size={48} color={theme.colors.purple} />
              </Animated.View>
              <Text style={styles.timer}>{formatTime(elapsed)}</Text>
              <Text style={styles.hint}>{t('voicePlaceholder', lang)}</Text>

              <Pressable
                onPress={handleStop}
                style={({ pressed }) => [styles.stopBtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Stop recording"
              >
                <View style={styles.stopSquare} />
              </Pressable>
            </>
          )}

          {phase === 'transcribing' && (
            <>
              <View style={styles.micCircle}>
                <ActivityIndicator color={theme.colors.purple} size="large" />
              </View>
              <Text style={styles.hint}>{t('loadingThinking', lang)}</Text>
            </>
          )}

          {phase === 'error' && (
            <>
              <View style={[styles.micCircle, { backgroundColor: 'rgba(255,93,108,0.10)' }]}>
                <Feather name="alert-circle" size={42} color={theme.colors.danger} />
              </View>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.dismissLabel}>OK</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,6,23,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.purple,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
    minHeight: 420,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  micCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  timer: {
    fontFamily: theme.fonts.display,
    fontSize: 42,
    color: theme.colors.t1,
    marginTop: theme.spacing.lg,
    letterSpacing: -1,
  },
  hint: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t2,
    marginTop: theme.spacing.sm,
  },
  stopBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  stopSquare: {
    width: 22, height: 22, borderRadius: 4,
    backgroundColor: theme.colors.purple,
  },
  errorText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t1,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  dismissBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.pill,
    marginTop: theme.spacing.xl,
  },
  dismissLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2.5,
    color: theme.colors.purple,
    textTransform: 'uppercase',
  },
});
