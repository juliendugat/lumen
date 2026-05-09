import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { Chip } from '@/ui/components/Chip';
import { useTheme } from '@/ui/ThemeProvider';
import {
  deleteMedication,
  getMedication,
  listMedications,
  upsertMedication,
  type MedKind,
  type MedSchedule,
} from '@/db/repo';
import { rescheduleMedReminders } from '@/lib/notifications';

const KINDS: Array<{ value: MedKind; label: string }> = [
  { value: 'pill', label: 'Pill' },
  { value: 'patch', label: 'Patch' },
  { value: 'iud', label: 'IUD' },
  { value: 'implant', label: 'Implant' },
  { value: 'other', label: 'Other' },
];

const SCHEDULE_KINDS: Array<{
  value: MedSchedule['kind'];
  label: string;
}> = [
  { value: 'daily', label: 'Daily' },
  { value: 'cycle', label: 'Cycle (e.g. 21/7)' },
  { value: 'asNeeded', label: 'As needed' },
];

export default function EditMedication() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editing = !!params.id;

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [kind, setKind] = useState<MedKind>('pill');
  const [scheduleKind, setScheduleKind] = useState<MedSchedule['kind']>('daily');
  const [time, setTime] = useState('09:00');
  const [activeDays, setActiveDays] = useState('21');
  const [breakDays, setBreakDays] = useState('7');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      const m = await getMedication(params.id!);
      if (!m) return;
      setName(m.name);
      setDose(m.dose ?? '');
      setKind(m.kind);
      setStartedAt(m.startedAt);
      if (m.schedule?.kind === 'daily') {
        setScheduleKind('daily');
        setTime(m.schedule.times[0] ?? '09:00');
      } else if (m.schedule?.kind === 'cycle') {
        setScheduleKind('cycle');
        setTime(m.schedule.times[0] ?? '09:00');
        setActiveDays(String(m.schedule.activeDays));
        setBreakDays(String(m.schedule.breakDays));
      } else {
        setScheduleKind('asNeeded');
      }
    })();
  }, [params.id]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this medication.');
      return;
    }
    setBusy(true);
    try {
      const schedule: MedSchedule | null =
        scheduleKind === 'daily'
          ? { kind: 'daily', times: [time] }
          : scheduleKind === 'cycle'
          ? {
              kind: 'cycle',
              times: [time],
              activeDays: parseInt(activeDays, 10) || 21,
              breakDays: parseInt(breakDays, 10) || 7,
            }
          : { kind: 'asNeeded' };

      await upsertMedication({
        id: params.id ?? undefined,
        name: name.trim(),
        dose: dose.trim() || null,
        kind,
        schedule,
        startedAt: startedAt ?? new Date().toISOString().slice(0, 10),
        stoppedAt: null,
        notes: null,
      });
      const meds = await listMedications();
      await rescheduleMedReminders(meds);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    Alert.alert('Stop this medication?', 'Reminders will turn off. History stays.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          if (!params.id) return;
          await upsertMedication({
            id: params.id,
            name,
            dose: dose || null,
            kind,
            schedule: null,
            startedAt,
            stoppedAt: new Date().toISOString().slice(0, 10),
            notes: null,
          });
          const meds = await listMedications();
          await rescheduleMedReminders(meds);
          router.back();
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Delete this medication?', 'This wipes its history too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!params.id) return;
          await deleteMedication(params.id);
          const meds = await listMedications();
          await rescheduleMedReminders(meds);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cancel and go back">
          <Text variant="bodyStrong">Cancel</Text>
        </Pressable>
        <Text variant="bodyStrong">{editing ? 'Edit' : 'New medication'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: t.spacing.lg }}
        contentContainerStyle={{ paddingBottom: t.spacing.xxxl, gap: t.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <VStack gap="sm">
          <Text variant="micro" color={t.palette.inkMuted}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Microgynon"
            placeholderTextColor={t.palette.inkFaint}
            accessibilityLabel="Medication name"
            style={inputStyle(t)}
          />
        </VStack>

        <VStack gap="sm">
          <Text variant="micro" color={t.palette.inkMuted}>DOSE (OPTIONAL)</Text>
          <TextInput
            value={dose}
            onChangeText={setDose}
            placeholder="e.g. 30 µg"
            placeholderTextColor={t.palette.inkFaint}
            accessibilityLabel="Dose"
            style={inputStyle(t)}
          />
        </VStack>

        <VStack gap="sm">
          <Text variant="micro" color={t.palette.inkMuted}>KIND</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {KINDS.map((k) => (
              <Chip
                key={k.value}
                label={k.label}
                selected={kind === k.value}
                onPress={() => setKind(k.value)}
              />
            ))}
          </View>
        </VStack>

        <VStack gap="sm">
          <Text variant="micro" color={t.palette.inkMuted}>SCHEDULE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {SCHEDULE_KINDS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={scheduleKind === s.value}
                onPress={() => setScheduleKind(s.value)}
              />
            ))}
          </View>
          {scheduleKind !== 'asNeeded' && (
            <View style={{ flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={t.palette.inkMuted}>Time (HH:MM)</Text>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="09:00"
                  maxLength={5}
                  placeholderTextColor={t.palette.inkFaint}
                  style={inputStyle(t)}
                  accessibilityLabel="Reminder time"
                />
              </View>
            </View>
          )}
          {scheduleKind === 'cycle' && (
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={t.palette.inkMuted}>Active days</Text>
                <TextInput
                  value={activeDays}
                  onChangeText={setActiveDays}
                  keyboardType="number-pad"
                  placeholder="21"
                  placeholderTextColor={t.palette.inkFaint}
                  style={inputStyle(t)}
                  accessibilityLabel="Active days"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={t.palette.inkMuted}>Break days</Text>
                <TextInput
                  value={breakDays}
                  onChangeText={setBreakDays}
                  keyboardType="number-pad"
                  placeholder="7"
                  placeholderTextColor={t.palette.inkFaint}
                  style={inputStyle(t)}
                  accessibilityLabel="Break days"
                />
              </View>
            </View>
          )}
        </VStack>

        <Button label={busy ? 'Saving…' : 'Save'} fullWidth onPress={save} disabled={busy} />

        {editing && (
          <>
            <Button label="Stop tracking" tone="ghost" fullWidth onPress={stop} />
            <Button label="Delete" tone="danger" fullWidth onPress={remove} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function inputStyle(t: ReturnType<typeof useTheme>) {
  return {
    backgroundColor: t.palette.paperDeep,
    borderRadius: t.radii.lg,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
    color: t.palette.ink,
    fontSize: 16,
    marginTop: 4,
  } as const;
}
