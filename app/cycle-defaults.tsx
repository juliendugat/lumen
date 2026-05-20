import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { NumberStepper } from '@/ui/components/NumberStepper';
import { useTheme } from '@/ui/ThemeProvider';
import { useCycle } from '@/store/cycle';
import { useCopy } from '@/copy/useCopy';
import { listCycles } from '@/db/repo';
import { cycleLengthsFromStarts } from '@/engine/predict';

/**
 * Editable cycle defaults — the same two values onboarding asks about, but
 * exposed as a regular setting. Useful when:
 *  - Onboarding was answered hastily / wrong.
 *  - The user has only one cycle logged so the engine is still using defaults.
 *  - The user just wants to see what Lumen is using.
 *
 * When 2+ cycles are logged, Lumen's predictions stop using these defaults
 * and learn from real data instead — we surface the learned value next to
 * the stepper so the relationship is transparent.
 */
export default function CycleDefaults() {
  const t = useTheme();
  const router = useRouter();
  const { settings, patchSettings } = useCycle();
  const { term, Term } = useCopy();
  const [cycle, setCycle] = useState<number>(settings?.defaultCycleLength ?? 28);
  const [period, setPeriod] = useState<number>(settings?.defaultPeriodLength ?? 5);
  const [learnedCycle, setLearnedCycle] = useState<number | null>(null);
  const [learnedPeriod, setLearnedPeriod] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Pull current values once settings hydrate
  useEffect(() => {
    if (!settings) return;
    setCycle(settings.defaultCycleLength);
    setPeriod(settings.defaultPeriodLength);
  }, [settings]);

  // Compute the learned (recency-weighted mean) cycle / period length, so
  // the user can see what the engine is actually using right now.
  useEffect(() => {
    (async () => {
      const cs = await listCycles();
      const lens = cycleLengthsFromStarts(cs.map((c) => c.startDate));
      if (lens.length >= 2) {
        setLearnedCycle(Math.round(lens.reduce((a, b) => a + b, 0) / lens.length));
      }
      // Period length learned from logged flow days — best effort, only show
      // when we have a stable signal.
      const periods = cs
        .map((c) => c.endDate ? Math.max(1, Math.round((Date.parse(c.endDate) - Date.parse(c.startDate)) / 86_400_000) + 1) : null)
        .filter((n): n is number => n !== null);
      if (periods.length >= 2) {
        setLearnedPeriod(Math.round(periods.reduce((a, b) => a + b, 0) / periods.length));
      }
    })();
  }, []);

  const dirty =
    settings != null &&
    (cycle !== settings.defaultCycleLength || period !== settings.defaultPeriodLength);

  const save = async () => {
    if (busy || !dirty) return;
    setBusy(true);
    try {
      await patchSettings({
        defaultCycleLength: cycle,
        defaultPeriodLength: period,
      });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const usingLearned = learnedCycle != null;

  return (
    <Screen scroll>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text variant="bodyStrong" color={t.palette.inkMuted}>
          ‹ Back
        </Text>
      </Pressable>

      <View style={{ marginTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          CYCLE DEFAULTS
        </Text>
        <Text variant="h1">Your typical cycle</Text>
        <Text variant="body" color={t.palette.inkMuted}>
          {usingLearned
            ? "Lumen has learned your real numbers from logged cycles. These defaults are kept as a fallback if you ever wipe history."
            : "These are the starting numbers Lumen uses for predictions until you've logged a couple of cycles."}
        </Text>
      </View>

      <VStack gap="lg">
        <Card>
          <VStack gap="sm">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="bodyStrong">Cycle length</Text>
              {learnedCycle != null && learnedCycle !== cycle && (
                <Text variant="caption" color={t.palette.inkMuted}>
                  Learned: {learnedCycle} days
                </Text>
              )}
            </View>
            <Text variant="caption" color={t.palette.inkMuted}>
              From the first day of one {term} to the first day of the next.
            </Text>
            <View style={{ marginTop: t.spacing.sm }}>
              <NumberStepper
                value={cycle}
                onChange={setCycle}
                min={20}
                max={45}
                unit="days"
              />
            </View>
          </VStack>
        </Card>

        <Card>
          <VStack gap="sm">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="bodyStrong">{Term} length</Text>
              {learnedPeriod != null && learnedPeriod !== period && (
                <Text variant="caption" color={t.palette.inkMuted}>
                  Learned: {learnedPeriod} days
                </Text>
              )}
            </View>
            <Text variant="caption" color={t.palette.inkMuted}>
              How many days you typically bleed.
            </Text>
            <View style={{ marginTop: t.spacing.sm }}>
              <NumberStepper
                value={period}
                onChange={setPeriod}
                min={1}
                max={10}
                unit="days"
              />
            </View>
          </VStack>
        </Card>

        <Text variant="caption" color={t.palette.inkFaint} style={{ paddingHorizontal: t.spacing.sm }}>
          Need to fix a logged {term} day? Open the calendar tab and tap the date.
        </Text>

        <Button
          label={busy ? 'Saving…' : dirty ? 'Save' : 'No changes'}
          fullWidth
          onPress={save}
          disabled={!dirty || busy}
        />
      </VStack>
    </Screen>
  );
}
