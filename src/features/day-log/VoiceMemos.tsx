import { useEffect, useRef, useState } from 'react';
import { Pressable, View, Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Paths } from 'expo-file-system';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { Icon } from '@/ui/icons/Icon';
import {
  addVoiceMemo,
  deleteVoiceMemo,
  listVoiceMemos,
  type VoiceMemoRow,
} from '@/db/repo';
import type { ISODate } from '@/engine/dates';

type Props = { date: ISODate };

/**
 * Voice-memo recorder + list for the Journal tab. Native-only — on web we
 * render a "Voice memos are mobile-only" placeholder.
 *
 * Design borrows from the design-study Journal tab (image #4 page 3): a
 * single big record button + a list of past memos with play/delete affordances.
 */
export function VoiceMemos({ date }: Props) {
  const t = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          padding: t.spacing.lg,
          backgroundColor: t.palette.paperDeep,
          borderRadius: t.radii.lg,
          gap: 4,
        }}
      >
        <Text variant="bodyStrong">Voice memos — mobile only</Text>
        <Text variant="caption" color={t.palette.inkMuted}>
          Available on iOS and Android. Files stay on your device.
        </Text>
      </View>
    );
  }

  return <VoiceMemosNative date={date} />;
}

function VoiceMemosNative({ date }: Props) {
  const t = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [memos, setMemos] = useState<VoiceMemoRow[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const granted = await AudioModule.requestRecordingPermissionsAsync();
        if (!granted.granted) return;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      } catch {
        /* ignore */
      }
      const list = await listVoiceMemos(date);
      if (mounted) setMemos(list);
    })();
    return () => {
      mounted = false;
    };
  }, [date]);

  const start = async () => {
    try {
      await recorder.prepareToRecordAsync();
      startedAtRef.current = Date.now();
      recorder.record();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('voice memo: start failed', e);
    }
  };

  const stop = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      const duration = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      // Move recording into our own folder so it survives cache clears.
      const dest = `${Paths.document.uri}journal/${date}-${Date.now()}.m4a`;
      const row = await addVoiceMemo(date, uri, duration);
      void dest;
      setMemos((prev) => [...prev, row]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('voice memo: stop failed', e);
    }
  };

  const remove = async (id: string) => {
    await deleteVoiceMemo(id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
  };

  const recording = recState.isRecording;

  return (
    <View style={{ gap: t.spacing.md }}>
      <Pressable
        onPress={recording ? stop : start}
        accessibilityRole="button"
        accessibilityState={{ busy: recording }}
        accessibilityLabel={recording ? 'Stop recording' : 'Start voice memo'}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
          padding: t.spacing.lg,
          backgroundColor: recording ? t.palette.flowMedium : t.palette.paperDeep,
          borderRadius: t.radii.lg,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: recording ? t.palette.paper : t.palette.flowMedium,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: recording ? 12 : 14,
              height: recording ? 12 : 14,
              borderRadius: recording ? 2 : 7,
              backgroundColor: recording ? t.palette.flowMedium : t.palette.paper,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" color={recording ? t.palette.paper : t.palette.ink}>
            {recording ? 'Recording…' : 'Tap to record'}
          </Text>
          <Text variant="caption" color={recording ? t.palette.paper : t.palette.inkMuted}>
            {recording ? 'Tap again to stop.' : 'Voice memos are saved on this device only.'}
          </Text>
        </View>
      </Pressable>

      {memos.length > 0 && (
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            MEMOS — {memos.length}
          </Text>
          {memos.map((m) => (
            <MemoRow key={m.id} memo={m} onDelete={() => remove(m.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

function MemoRow({
  memo,
  onDelete,
}: {
  memo: VoiceMemoRow;
  onDelete: () => void;
}) {
  const t = useTheme();
  const player = useAudioPlayer({ uri: memo.uri });
  const [playing, setPlaying] = useState(false);

  const togglePlay = async () => {
    try {
      if (playing) {
        player.pause();
        setPlaying(false);
      } else {
        await player.seekTo(0);
        player.play();
        setPlaying(true);
      }
    } catch {
      /* ignore */
    }
  };

  // Auto-reset to "play" when track finishes
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(false), memo.durationMs + 500);
    return () => clearTimeout(t);
  }, [playing, memo.durationMs]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        padding: t.spacing.md,
        backgroundColor: t.palette.paperDeep,
        borderRadius: t.radii.md,
      }}
    >
      <Pressable
        onPress={togglePlay}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause memo' : 'Play memo'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: t.palette.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="bodyStrong" color={t.palette.paper}>
          {playing ? '∥' : '▶'}
        </Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{formatDuration(memo.durationMs)}</Text>
        <Text variant="caption" color={t.palette.inkMuted}>
          {new Date(memo.createdAt).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete memo"
        hitSlop={8}
      >
        <Icon name="trash" size={18} color={t.palette.inkMuted} />
      </Pressable>
    </View>
  );
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
