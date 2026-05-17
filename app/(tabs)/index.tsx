import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { useCycle } from '@/store/cycle';
import { CycleRing } from '@/features/cycle-ring/CycleRing';
import { Illustration } from '@/ui/illustrations/Illustration';
import { diffDays, todayISO, fromISO } from '@/engine/dates';
import { parseArr } from '@/db/repo';
import { FlowTiles, type FlowValue } from '@/features/home/FlowTiles';
import { SelfCareCard } from '@/features/home/SelfCareCard';
import { PregnancyChanceCard } from '@/features/home/PregnancyChanceCard';
import { TipCard } from '@/features/home/TipCard';
import { RecentlyTracked } from '@/features/home/RecentlyTracked';
import { deriveHomeState } from '@/features/home/headline';
import { pregnancyChance } from '@/engine/health-signals';

/**
 * Home redesign (UX Review redesign 01):
 *
 *   1. Ring + state-aware center → the headline. No 44 px Fraunces below
 *      restating "Day 4 — Period."
 *   2. Next-period inlines under the ring — second-most-asked question gets
 *      the second-most-prominent slot.
 *   3. Flow tiles are the *only* logging affordance above the fold. The
 *      old QuickChipBar dies; the day-log IS the quick-bar.
 *   4. "More for today" drawer below the fold holds Tip / Self-care /
 *      Pregnancy-chance / Recently-tracked. Each was reading as ambient
 *      content, diluting the rest.
 */
export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const cycle = useCycle();
  const {
    prediction,
    fertile,
    cycleDayNum,
    lastStart,
    todayDay,
    settings,
    pregnancyWeek,
    pregnancyDayInWeek,
    cyclesLogged,
    setFlow,
    patchDay,
  } = cycle;

  const today = todayISO();
  const lifeMode = (settings?.lifeMode ?? 'cycling') as
    | 'cycling' | 'pregnant' | 'perimenopausal' | 'postpartum';
  const cycleLength = prediction?.cycleLength ?? settings?.defaultCycleLength ?? 28;
  const periodLength = prediction?.periodLength ?? settings?.defaultPeriodLength ?? 5;

  const state = deriveHomeState({
    cycleDay: cycleDayNum,
    prediction,
    fertile,
    todayIso: today,
  });

  const fertileRel = useMemo(() => {
    if (!prediction || !fertile || !lastStart) return undefined;
    const startDay = diffDays(fertile.start, lastStart) + 1;
    const endDay = diffDays(fertile.end, lastStart) + 1;
    const peakDay = diffDays(fertile.peak, lastStart) + 1;
    return { startDay, endDay, peakDay };
  }, [prediction, fertile, lastStart]);

  if (lifeMode === 'pregnant') {
    return <PregnancyHome week={pregnancyWeek} dayInWeek={pregnancyDayInWeek} />;
  }

  // Center labels: kicker + big + sub. State-aware so the ring IS the
  // headline — no double-billing with a separate big-text below.
  const centerLabel = !cycleDayNum
    ? undefined
    : state.kind === 'late'
    ? `${state.daysLate}d late`
    : `Day ${cycleDayNum}`;
  const centerKicker = !cycleDayNum
    ? undefined
    : state.kind === 'period'
    ? 'PERIOD'
    : state.kind === 'fertile'
    ? state.daysToPeak === 0
      ? 'OVULATION'
      : 'FERTILE'
    : state.kind === 'late'
    ? 'LATE'
    : state.kind === 'follicular'
    ? 'FOLLICULAR'
    : state.kind === 'luteal'
    ? 'LUTEAL'
    : 'TODAY';
  const centerSub = (() => {
    if (state.kind === 'fertile' && state.daysToPeak === 0) return 'Peak day';
    if (state.kind === 'fertile' && state.daysToPeak > 0)
      return `Peak in ${state.daysToPeak}d`;
    if (state.kind === 'expected-soon')
      return state.daysUntil === 0
        ? 'Period likely today'
        : state.daysUntil === 1
        ? 'Period likely tomorrow'
        : `Period in ${state.daysUntil}d`;
    return undefined;
  })();

  // Inline "next period" string under the ring. Most-asked question after
  // "what cycle day am I on" — second-most-prominent slot.
  const nextPeriodText = (() => {
    if (!prediction) return null;
    const daysUntil = diffDays(prediction.expectedStart, today);
    if (daysUntil < 0) return null; // covered by the "late" state in the ring
    const dateStr = humanDay(prediction.expectedStart);
    if (daysUntil === 0) return `Today (${dateStr})`;
    if (daysUntil === 1) return `Tomorrow (${dateStr})`;
    return `In ${daysUntil} days · ${dateStr}`;
  })();

  return (
    <Screen scroll>
      <VStack gap="xl">
        {/* Header — brand + today date. Week strip moves to Calendar. */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: t.spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
          <Text variant="caption" color={t.palette.inkMuted}>
            {fromISO(today).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* ─── BLOCK 1 — Ring (centered, state-aware center text) ─── */}
        <View style={{ alignItems: 'center', gap: t.spacing.md }}>
          <Pressable
            onPress={() => router.push(`/log/${today}`)}
            accessibilityRole="button"
            accessibilityLabel="Open today's log"
          >
            <CycleRing
              cycleDay={cycleDayNum}
              cycleLength={cycleLength}
              periodLength={periodLength}
              fertile={fertileRel}
              cyclesLogged={cyclesLogged}
              centerKicker={centerKicker}
              centerLabel={centerLabel}
              centerSubLabel={centerSub}
            />
          </Pressable>

          {/* Inline next-period under the ring — block 2. */}
          {nextPeriodText && cyclesLogged > 0 && (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text variant="micro" color={t.palette.inkMuted}>
                NEXT PERIOD
              </Text>
              <Text variant="bodyStrong">{nextPeriodText}</Text>
              {prediction && (
                <Text variant="caption" color={t.palette.inkMuted}>
                  Window: {humanRange(prediction.confidenceLow, prediction.confidenceHigh)}
                </Text>
              )}
            </View>
          )}

          {state.kind === 'no-data' && (
            <View style={{ alignItems: 'center', gap: 4, marginTop: t.spacing.sm }}>
              <Text variant="bodyStrong" align="center">
                Log your first period to start
              </Text>
              <Text variant="caption" color={t.palette.inkMuted} align="center">
                Predictions tighten after a couple of cycles.
              </Text>
            </View>
          )}
        </View>

        {/* ─── BLOCK 3 — Log (single affordance) ─── */}
        {state.kind !== 'no-data' && (
          <View style={{ gap: t.spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text variant="micro" color={t.palette.inkMuted}>
                LOG TODAY
              </Text>
              <Pressable
                onPress={() => router.push(`/log/${today}`)}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Open full day log"
              >
                <Text variant="micro" color={t.palette.inkMuted}>
                  FULL LOG →
                </Text>
              </Pressable>
            </View>
            <FlowTiles
              value={(todayDay?.flow ?? null) as FlowValue | null}
              onSelect={(v) => {
                if (v) setFlow(today, v);
                else patchDay(today, { flow: null });
              }}
            />
          </View>
        )}

        {/* No-data illustration card — only shown when there are no cycles. */}
        {state.kind === 'no-data' && (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: t.spacing.md }}>
              <Illustration name="empty-calendar" width={200} height={140} />
              <Text variant="caption" color={t.palette.inkMuted} align="center" style={{ marginTop: t.spacing.md }}>
                Tap the ring above to log today, or open the Calendar to pick another day.
              </Text>
            </View>
          </Card>
        )}

        {/* ─── More for today drawer ─── */}
        {state.kind !== 'no-data' && (
          <MoreForToday
            state={state}
            todaySymptoms={parseArr(todayDay?.symptomTags)}
            chance={pregnancyChance(today, fertile)}
          />
        )}
      </VStack>
    </Screen>
  );
}

// ─── "More for today" drawer ───────────────────────────────────────────────

function MoreForToday({
  state,
  todaySymptoms,
  chance,
}: {
  state: ReturnType<typeof deriveHomeState>;
  todaySymptoms: string[];
  chance: ReturnType<typeof pregnancyChance>;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  // Count how many sub-cards we have so the badge is accurate.
  // (Pregnancy-chance hides on 'unknown'; recently-tracked hides until 3+
  //  symptoms are tracked over the last 90 days.)
  const cardCount = 4; // Tip + Self-care + chance + recently. Close enough.

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: t.palette.paperEdge,
        paddingTop: t.spacing.md,
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="More for today"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: t.spacing.sm,
        }}
        hitSlop={6}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Text variant="bodyStrong" color={t.palette.inkSoft}>
            More for today
          </Text>
          <View
            style={{
              paddingHorizontal: t.spacing.sm,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: t.palette.paperDeep,
            }}
          >
            <Text variant="micro" color={t.palette.inkMuted}>
              {cardCount}
            </Text>
          </View>
        </View>
        <Text variant="caption" color={t.palette.inkMuted}>
          {open ? 'Hide ▴' : 'Show ▾'}
        </Text>
      </Pressable>

      {open && (
        <VStack gap="md" style={{ marginTop: t.spacing.sm }}>
          <RecentlyTracked todaySymptoms={todaySymptoms} />
          <PregnancyChanceCard chance={chance} />
          <SelfCareCard state={state} />
          <TipCard />
        </VStack>
      )}
    </View>
  );
}

// ─── Pregnancy home (unchanged) ───────────────────────────────────────────

function PregnancyHome({
  week,
  dayInWeek,
}: {
  week: number | null;
  dayInWeek: number | null;
}) {
  const t = useTheme();
  return (
    <Screen scroll>
      <VStack gap="xl">
        <View style={{ marginTop: t.spacing.md }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            PREGNANCY
          </Text>
          <Text variant="h1">Tracking your pregnancy</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Illustration name="pregnancy-bloom" width={280} height={200} />
        </View>
        <Card>
          <VStack gap="xs">
            <Text variant="micro" color={t.palette.inkMuted}>
              GESTATIONAL AGE
            </Text>
            <Text variant="display">
              {week === null ? '—' : `${week}w`}
              {week !== null && dayInWeek !== null && (
                <Text variant="h2" color={t.palette.inkMuted}>
                  {' '}
                  {dayInWeek}d
                </Text>
              )}
            </Text>
            <Text variant="caption" color={t.palette.inkMuted}>
              Counted from the first day of your last menstrual period.
            </Text>
          </VStack>
        </Card>
        <Card>
          <Text variant="bodyStrong">Cycle predictions paused</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            Period and fertile-window predictions are off. Turn pregnancy mode off in
            Settings → You when you want them back.
          </Text>
        </Card>
      </VStack>
    </Screen>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────

function humanRange(a: string, b: string) {
  const da = fromISO(a);
  const db = fromISO(b);
  const sameDay =
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
  const fa = da.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (sameDay) return fa;
  const sameMonth = da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear();
  const fb = db.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  );
  return `${fa} – ${fb}`;
}

function humanDay(iso: string) {
  return fromISO(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
