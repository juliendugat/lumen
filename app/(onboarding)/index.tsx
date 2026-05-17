import { useMemo, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { NumberStepper } from '@/ui/components/NumberStepper';
import { DatePickerInline } from '@/ui/components/DatePickerInline';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { useCycle } from '@/store/cycle';
import { ensurePermission } from '@/lib/notifications';
import { addDaysISO, todayISO, toISO, type ISODate } from '@/engine/dates';

/**
 * Onboarding redesign (UX Review redesign 03):
 *
 * One progressive screen, not four. No "Welcome" upsell — there's no account
 * to convert. The first thing the user sees IS the setup.
 *
 *   - Last-period as chip-row ("Today / 3 days ago / A week / Pick a date /
 *     Don't know yet"). 3 chip choices cover ~70% of users in seconds.
 *   - Period-length removed entirely (not load-bearing for first prediction).
 *   - Reminders default ON; OS permission asks at first toast.
 *   - Privacy story in a footer caption, not a card.
 */

type LastPeriodChoice =
  | { kind: 'today' }
  | { kind: 'days-ago'; days: number }
  | { kind: 'date'; date: ISODate }
  | { kind: 'unknown' };

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const cycle = useCycle();
  const [choice, setChoice] = useState<LastPeriodChoice>({ kind: 'days-ago', days: 3 });
  const [cycleLen, setCycleLen] = useState(28);
  const [reminders, setReminders] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const lastPeriodIso = useMemo<ISODate | null>(() => {
    switch (choice.kind) {
      case 'today':
        return todayISO();
      case 'days-ago':
        return addDaysISO(todayISO(), -choice.days);
      case 'date':
        return choice.date;
      case 'unknown':
        return null;
    }
  }, [choice]);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await cycle.patchSettings({
        defaultCycleLength: cycleLen,
        // Period length stays at default 5; user edits later from settings.
        notifPeriodSoonDays: reminders ? 2 : null,
        notifLateDays: reminders ? 2 : null,
      });
      if (lastPeriodIso) {
        await cycle.setFlow(lastPeriodIso, 'medium');
      }
      // Don't ask for OS notification permission up-front — the first time
      // a reminder is actually scheduled, the OS prompt will fire then. The
      // user's already said "yes" to the concept.
      if (reminders) {
        // No-op on web; on native we silently call ensurePermission to align
        // OS state with the user's intent. They'll get the OS dialog when a
        // reminder is first scheduled (in cycle store refresh).
        void ensurePermission();
      }
      await cycle.finishOnboarding();
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ marginTop: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: t.palette.paperDeep,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="moon" size={18} color={t.palette.flowMedium} />
          </View>
          <Text variant="bodyStrong">Lumen</Text>
        </View>

        <Text variant="h1" style={{ marginTop: t.spacing.xl }}>
          Set up your first cycle.
        </Text>
        <Text variant="body" color={t.palette.inkMuted} style={{ marginTop: t.spacing.sm }}>
          Local-only. No accounts. Skip anything you're not sure about.
        </Text>

        {/* ─── Last period started ─── */}
        <View style={{ marginTop: t.spacing.xl, gap: t.spacing.sm }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            LAST PERIOD STARTED
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            <ChipChoice
              label="Today"
              selected={choice.kind === 'today'}
              onPress={() => {
                setDatePickerOpen(false);
                setChoice({ kind: 'today' });
              }}
            />
            <ChipChoice
              label="3 days ago"
              selected={choice.kind === 'days-ago' && choice.days === 3}
              onPress={() => {
                setDatePickerOpen(false);
                setChoice({ kind: 'days-ago', days: 3 });
              }}
            />
            <ChipChoice
              label="A week ago"
              selected={choice.kind === 'days-ago' && choice.days === 7}
              onPress={() => {
                setDatePickerOpen(false);
                setChoice({ kind: 'days-ago', days: 7 });
              }}
            />
            <ChipChoice
              label="Pick a date"
              selected={choice.kind === 'date'}
              onPress={() => {
                setDatePickerOpen(true);
                if (choice.kind !== 'date') {
                  setChoice({ kind: 'date', date: addDaysISO(todayISO(), -3) });
                }
              }}
            />
            <ChipChoice
              muted
              label="Don't know yet"
              selected={choice.kind === 'unknown'}
              onPress={() => {
                setDatePickerOpen(false);
                setChoice({ kind: 'unknown' });
              }}
            />
          </View>

          {datePickerOpen && choice.kind === 'date' && (
            <View
              style={{
                backgroundColor: t.palette.paperDeep,
                borderRadius: t.radii.lg,
                padding: t.spacing.md,
                marginTop: t.spacing.sm,
              }}
            >
              <DatePickerInline
                value={new Date(choice.date)}
                onChange={(d) => setChoice({ kind: 'date', date: toISO(d) })}
              />
            </View>
          )}
        </View>

        {/* ─── Cycle length ─── */}
        <View style={{ marginTop: t.spacing.xl, gap: t.spacing.sm }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            YOUR TYPICAL CYCLE LENGTH
          </Text>
          <NumberStepper
            value={cycleLen}
            onChange={setCycleLen}
            min={20}
            max={45}
            unit="days"
          />
          <Text variant="caption" color={t.palette.inkFaint}>
            Lumen will refine this as you log.
          </Text>
        </View>

        {/* ─── Reminders (default ON) ─── */}
        <View
          style={{
            marginTop: t.spacing.xl,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.palette.paperDeep,
            borderRadius: t.radii.lg,
            padding: t.spacing.lg,
            gap: t.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Quiet reminders</Text>
            <Text variant="caption" color={t.palette.inkMuted}>
              Local notifications. You can turn this off later.
            </Text>
          </View>
          <Switch value={reminders} onValueChange={setReminders} />
        </View>
      </View>

      <View style={{ marginTop: t.spacing.xxl, gap: t.spacing.sm }}>
        <Button
          label={busy ? 'Setting up…' : 'Open Lumen'}
          fullWidth
          onPress={finish}
          disabled={busy}
        />
        <Text variant="caption" color={t.palette.inkFaint} align="center">
          Your data stays on this device. Nothing is sent.
        </Text>
      </View>
    </Screen>
  );
}

function ChipChoice({
  label,
  selected,
  onPress,
  muted,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  muted?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: t.spacing.md,
        borderRadius: t.radii.pill,
        backgroundColor: selected ? t.palette.ink : t.palette.paperDeep,
        borderWidth: 1,
        borderColor: selected ? t.palette.ink : t.palette.paperEdge,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        variant="caption"
        color={
          selected
            ? t.palette.paper
            : muted
            ? t.palette.inkFaint
            : t.palette.inkSoft
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
