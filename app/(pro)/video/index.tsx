import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';

import { theme } from '../../../src/lib/theme';
import { useAgent } from '../../../src/hooks/useAgent';
import {
  callVideoAnalyse, newVideoAnalysisId, uploadFrame, type VideoFocus,
} from '../../../src/lib/video-analyse';

import { PillButton } from '../../../src/components/PillButton';
import { SegmentedPicker } from '../../../src/components/SegmentedPicker';
import { FormField } from '../../../src/components/FormField';
import { LoadingMate } from '../../../src/components/LoadingMate';

// Path A: agent picks a raw video from their library, we extract N frames
// client-side via expo-video-thumbnails at evenly-spaced timestamps. Falls
// through to the same upload → mate-pro-video-analyse pipeline that the
// photo-still path uses. Photos-only remains as a secondary option for
// agents who already have the moments extracted.
type PickedFrame = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'extracting'; target: number }
  | { kind: 'previewing'; frames: PickedFrame[]; source: 'video' | 'photos' }
  | { kind: 'uploading'; total: number; done: number }
  | { kind: 'analysing' }
  | { kind: 'complete'; result: string; framesUsed: number }
  | { kind: 'error'; message: string };

const FOCUSES: ReadonlyArray<{ value: VideoFocus; label: string }> = [
  { value: 'positioning', label: 'Positioning' },
  { value: 'technical',   label: 'Technical' },
  { value: 'decisions',   label: 'Decisions' },
  { value: 'physical',    label: 'Physical' },
];

const FRAMES_FROM_VIDEO = 8;
const MIN_FRAMES = 4;
const MAX_FRAMES = 12;

/**
 * Even-spaced timestamps across the clip, with a small margin at start/end
 * so we don't grab pitch-black transition frames from a compilation reel.
 */
function planFrameTimestamps(durationMs: number, count: number): number[] {
  const margin = Math.min(500, durationMs * 0.03);
  const start = margin;
  const end = Math.max(margin + 1, durationMs - margin);
  if (count === 1) return [Math.floor((start + end) / 2)];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.floor(start + i * step));
}

export default function VideoAnalyse() {
  const { agent } = useAgent();
  const [focus, setFocus] = useState<VideoFocus>('positioning');
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const busy = phase.kind === 'uploading' || phase.kind === 'analysing' || phase.kind === 'extracting';

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Photo access needed', 'Open Settings to let MATE Pro read from your library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    const video = result.assets[0];
    const durationMs = video.duration ?? 0;
    if (!durationMs || durationMs < 2000) {
      Alert.alert(
        'Clip too short',
        'Pick a video that runs at least 2 seconds so the vision agent has enough to work with.',
      );
      return;
    }

    setPhase({ kind: 'extracting', target: FRAMES_FROM_VIDEO });

    try {
      const timestamps = planFrameTimestamps(durationMs, FRAMES_FROM_VIDEO);
      const thumbs = [];
      for (const time of timestamps) {
        const t = await VideoThumbnails.getThumbnailAsync(video.uri, {
          time,
          quality: 0.85,
        });
        thumbs.push({
          uri: t.uri,
          mimeType: 'image/jpeg',
          fileName: `frame-${thumbs.length + 1}.jpg`,
        });
      }
      setPhase({ kind: 'previewing', frames: thumbs, source: 'video' });
    } catch (e: any) {
      setPhase({ kind: 'error', message: `Frame extraction failed: ${e?.message ?? String(e)}` });
    }
  };

  const handlePickPhotos = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Photo access needed', 'Open Settings to let MATE Pro read from your library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: MAX_FRAMES,
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;

    if (result.assets.length < MIN_FRAMES) {
      Alert.alert('Too few frames', `Pick at least ${MIN_FRAMES} stills.`);
      return;
    }

    setPhase({
      kind: 'previewing',
      source: 'photos',
      frames: result.assets.map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType,
        fileName: a.fileName,
      })),
    });
  };

  const handleReset = () => {
    setPhase({ kind: 'idle' });
    setQuestion('');
  };

  const handleRun = async () => {
    if (phase.kind !== 'previewing' || !agent) return;
    const vaId = newVideoAnalysisId();
    const frames = phase.frames;

    setPhase({ kind: 'uploading', total: frames.length, done: 0 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    let paths: string[] = [];
    try {
      for (let i = 0; i < frames.length; i++) {
        const path = await uploadFrame(agent.id, vaId, i + 1, frames[i]);
        paths.push(path);
        setPhase({ kind: 'uploading', total: frames.length, done: i + 1 });
      }
    } catch (e: any) {
      setPhase({ kind: 'error', message: e?.message ?? 'Upload failed' });
      return;
    }

    setPhase({ kind: 'analysing' });

    try {
      const res = await callVideoAnalyse({
        conversation_id: null,
        client_id: null,
        frame_paths: paths,
        focus,
        question: question.trim() || undefined,
        filename: `gallery-${frames.length}-frames.jpg`,
        duration_sec: 0,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPhase({
        kind: 'complete',
        result: res.result_text,
        framesUsed: res.frames_used,
      });
    } catch (e: any) {
      setPhase({ kind: 'error', message: e?.message ?? 'Analysis failed' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Video read</Text>
        {phase.kind === 'complete' || phase.kind === 'error' || phase.kind === 'previewing' ? (
          <Pressable onPress={handleReset}
            style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}>
            <Feather name="refresh-ccw" size={14} color={theme.colors.purple} />
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {phase.kind === 'idle' || phase.kind === 'previewing' ? (
          <>
            <SegmentedPicker
              label="Focus"
              value={focus}
              options={FOCUSES}
              onChange={(v) => setFocus(v)}
              scrollable
            />

            <FormField
              label="Question (optional)"
              value={question}
              onChangeText={setQuestion}
              placeholder="Is he holding the line or drifting inside?"
              multiline
              numberOfLines={3}
            />

            {phase.kind === 'idle' ? (
              <View style={styles.dropZone}>
                <Feather name="video" size={32} color={theme.colors.t2} />
                <Text style={styles.dropTitle}>
                  Pick a video from your library
                </Text>
                <Text style={styles.dropBody}>
                  The full clip your scout sent — MATE Pro pulls {FRAMES_FROM_VIDEO} evenly-spaced
                  stills and reads them.
                </Text>
                <PillButton
                  label="Pick video"
                  onPress={handlePickVideo}
                  disabled={!agent}
                  style={{ marginTop: theme.spacing.md }}
                />
                <Pressable onPress={handlePickPhotos} disabled={!agent}
                  style={({ pressed }) => [styles.altLink, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.altLinkText}>
                    Or pick {MIN_FRAMES}–{MAX_FRAMES} stills yourself
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>
                  {phase.frames.length} FRAME{phase.frames.length === 1 ? '' : 'S'}
                  {phase.source === 'video' ? ' PULLED FROM VIDEO' : ' PICKED'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbs}
                >
                  {phase.frames.map((f, i) => (
                    <View key={f.uri + i} style={styles.thumbWrap}>
                      <Image source={{ uri: f.uri }} style={styles.thumb} />
                      <View style={styles.thumbIndex}>
                        <Text style={styles.thumbIndexText}>{i + 1}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={phase.source === 'video' ? handlePickVideo : handlePickPhotos}
                    style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
                    <Feather name="refresh-cw" size={14} color={theme.colors.t1} />
                    <Text style={styles.secondaryLabel}>Reselect</Text>
                  </Pressable>
                </View>
                <PillButton
                  label={`Run ${FOCUSES.find((f) => f.value === focus)?.label ?? focus} read`}
                  onPress={handleRun}
                  disabled={busy}
                />
              </>
            )}
          </>
        ) : null}

        {phase.kind === 'extracting' ? (
          <View style={styles.busy}>
            <Text style={styles.busyTitle}>Reading your clip…</Text>
            <Text style={styles.busyBody}>
              Pulling {phase.target} evenly-spaced frames.
            </Text>
            <View style={{ marginTop: theme.spacing.lg, alignSelf: 'center' }}>
              <LoadingMate />
            </View>
          </View>
        ) : null}

        {phase.kind === 'uploading' ? (
          <View style={styles.busy}>
            <Text style={styles.busyTitle}>Uploading frames…</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${Math.round((phase.done / phase.total) * 100)}%`,
              }]} />
            </View>
            <Text style={styles.busyMeta}>{phase.done} / {phase.total}</Text>
          </View>
        ) : null}

        {phase.kind === 'analysing' ? (
          <View style={styles.busy}>
            <Text style={styles.busyTitle}>MATE Pro is watching.</Text>
            <Text style={styles.busyBody}>Vision reads take 30–45 seconds.</Text>
            <View style={{ marginTop: theme.spacing.lg, alignSelf: 'center' }}>
              <LoadingMate />
            </View>
          </View>
        ) : null}

        {phase.kind === 'complete' ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHead}>
              <View style={styles.livePulse} />
              <Text style={styles.resultTag}>SCOUT READ</Text>
              <Text style={styles.resultMeta}>· {phase.framesUsed} frames</Text>
            </View>
            <Markdown style={markdownStyles}>{phase.result}</Markdown>
          </View>
        ) : null}

        {phase.kind === 'error' ? (
          <View style={styles.errorCard}>
            <Feather name="alert-circle" size={22} color={theme.colors.danger} />
            <Text style={styles.errorTitle}>Something snapped.</Text>
            <Text style={styles.errorBody}>{phase.message}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.purple },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 30,
    color: theme.colors.t1,
    letterSpacing: -0.5,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
  },
  resetLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    color: theme.colors.purple,
    textTransform: 'uppercase',
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  dropZone: {
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
    borderStyle: Platform.OS === 'ios' ? 'solid' : 'dashed',
    backgroundColor: theme.colors.glass,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  dropTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.t1,
    letterSpacing: -0.3,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  dropBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t2,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  altLink: {
    marginTop: theme.spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  altLinkText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.t3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
    textDecorationColor: theme.colors.t4,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    textTransform: 'uppercase',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  thumbs: {
    gap: 8,
    paddingRight: theme.spacing.xl,
  },
  thumbWrap: {
    width: 88, height: 88,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
  },
  thumb: { width: '100%', height: '100%' },
  thumbIndex: {
    position: 'absolute',
    top: 4, left: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbIndexText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    color: theme.colors.purple,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.glass,
    borderWidth: 0.5,
    borderColor: theme.colors.borderMid,
  },
  secondaryLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: theme.colors.t1,
    textTransform: 'uppercase',
  },
  busy: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
  },
  busyTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
    marginBottom: theme.spacing.sm,
  },
  busyBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.t2,
  },
  busyMeta: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.t3,
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.glassHover,
    marginTop: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 2,
  },
  resultCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.lg,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  livePulse: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: theme.colors.accentGreen,
  },
  resultTag: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: theme.colors.accentGreen,
  },
  resultMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.t4,
    letterSpacing: 0.3,
  },
  errorCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderRadius: theme.radii.lg,
    borderWidth: 0.5,
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(255,93,108,0.08)',
  },
  errorTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.t1,
    letterSpacing: -0.3,
    marginTop: theme.spacing.sm,
  },
  errorBody: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.t2,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});

const markdownStyles = {
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.t1,
  },
  strong: { fontFamily: theme.fonts.bodyMedium, color: theme.colors.t1 },
  em: { fontStyle: 'italic' as const, color: theme.colors.t2 },
  heading1: {
    fontFamily: theme.fonts.display,
    fontSize: 20, color: theme.colors.t1,
    marginTop: 12, marginBottom: 6,
  },
  heading2: {
    fontFamily: theme.fonts.display,
    fontSize: 17, color: theme.colors.t1,
    marginTop: 10, marginBottom: 4,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  bullet_list_icon: { color: theme.colors.t3 },
  code_inline: {
    fontFamily: 'Menlo',
    backgroundColor: theme.colors.glassHover,
    color: theme.colors.accentGreen,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
} as const;
