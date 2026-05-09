import { useMemo } from 'react';
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
import { diffDays, todayISO, fromISO, addDaysISO } from '@/engine/dates';
import { findAction, parseQuickBar, type QuickAction } from '@/features/quick-bar/quickBar';
import { parseArr } from '@/db/repo';
import { WeekStrip } from '@/features/home/WeekStrip';
import { FlowTiles, type FlowValue } from '@/features/home/FlowTiles';
import { SelfCareCard } from '@/features/home/SelfCareCard';
import { PregnancyChanceCard } from '@/features/home/PregnancyChanceCard';
import { TipCard } from '@/features/home/TipCard';
import { RecentlyTracked } from '@/features/home/RecentlyTracked';
import { deriveHomeState, headlineFor } from '@/features/home/headline';
import { pregnancyChance } from '@/engine/health-signals';

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
    setFlow,
    patchDay,
  } = cycle;

  const today = todayISO();
  const lifeMode = (settings?.lifeMode ?? 'standard') as
    | 'standard' | 'teen' | 'pregnancy' | 'perimenopause';
  const cycleLength = prediction?.cycleLength ?? settings?.defaultCycleLength ?? 28;
  const periodLength = prediction?.periodLength ?? settings?.defaultPeriodLength ?? 5;

  const state = deriveHomeState({
    cycleDay: cycleDayNum,
    prediction,
    fertile,
    todayIso: today,
  });
  const headline = headlineFor(state);

  const fertileRel = useMemo(() => {
    if (!prediction || !fertile || !lastStart) return undefined;
    const startDay = diffDays(fertile.start, lastStart) + 1;
    const endDay = diffDays(fertile.end, lastStart) + 1;
    const peakDay = diffDays(fertile.peak, lastStart) + 1;
    return { startDay, endDay, peakDay };
  }, [prediction, fertile, lastStart]);

  const quickBarIds = parseQuickBar(settings?.quickBarConfig);
  const quickBar = quickBarIds.map(findAction).filter((a): a is QuickAction => Boolean(a));

  // Build week-strip dot map
  const weekDots = useMemo(() => {
    const m = new Map<string, string | null>();
    if (lastStart && cycleDayNum) {
      // Mark logged period days based on todayDay and a quick scan back
      // (full calendar fetch handled by Calendar tab; here we keep it simple).
      m.set(today, flowToDotColor(todayDay?.flow ?? null, t.palette));
    }
    return m;
  }, [lastStart, cycleDayNum, todayDay, today, t.palette]);

  if (lifeMode === 'pregnancy') {
    return <PregnancyHome week={pregnancyWeek} dayInWeek={pregnancyDayInWeek} />;
  }

  // Period actual-vs-expected card eligibility
  const showActualVsExpected =
    state.kind === 'period' &&
    state.dayInPeriod === 1 &&
    prediction != null &&
    lastStart != null;

  return (
    <Screen scroll>
      <VStack gap="xl">
        {/* Header: brand + week strip */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <Pressable
              onPress={() => router.push('/(tabs)/calendar')}
              accessibilityRole="button"
              accessibilityLabel="Open calendar"
              hitSlop={12}
            >
              <Icon name="flower" size={20} color={t.palette.inkMuted} />
            </Pressable>
          </View>
          <View style={{ marginTop: t.spacing.md }}>
            <WeekStrip
              dots={weekDots}
              onSelect={(iso) => router.push(`/log/${iso}`)}
            />
          </View>
        </View>

        {/* Cycle ring */}
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
              centerKicker={cycleDayNum ? 'today' : undefined}
              centerLabel={cycleDayNum ? `Day ${cycleDayNum}` : undefined}
              centerSubLabel={
                state.kind === 'period'
                  ? 'Period'
                  : state.kind === 'fertile'
                  ? 'Fertile window'
                  : state.kind === 'late'
                  ? 'Late'
                  : state.kind === 'follicular'
                  ? 'Follicular'
                  : state.kind === 'luteal'
                  ? 'Luteal'
                  : undefined
              }
            />
          </Pressable>
        </View>

        {/* State-aware headline */}
        <View style={{ alignItems: 'center', gap: t.spacing.sm, paddingHorizontal: t.spacing.md }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            {headline.kicker}
          </Text>
          <Text variant="display" align="center">
            {headline.big}
          </Text>
          <Text variant="body" color={t.palette.inkMuted} align="center">
            {headline.sub}
          </Text>
          {headline.learn && (
            <Pressable
              onPress={() =>
                router.push(`/(tabs)/learn?article=${headline.learn!.articleId}`)
              }
              accessibilityRole="link"
              accessibilityLabel={headline.learn.label}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
            >
              <Text variant="caption" color={t.palette.flowMedium}>
                {headline.learn.label}
              </Text>
              <Icon name="arrow-right" size={14} color={t.palette.flowMedium} />
            </Pressable>
          )}
        </View>

        {/* Tile flow logger — visible when state isn't 'no-data' or already logged */}
        {state.kind !== 'no-data' && (
          <View style={{ gap: t.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  FULL LOG
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

        {/* Recently-tracked surface (learned from history) */}
        {state.kind !== 'no-data' && (
          <RecentlyTracked todaySymptoms={parseArr(todayDay?.symptomTags)} />
        )}

        {/* Quick chip bar (customisable) */}
        {state.kind !== 'no-data' && (
          <QuickChipBar
            actions={quickBar.filter((a) => !a.id.startsWith('flow.'))}
            today={today}
            symptomsToday={parseArr(todayDay?.symptomTags)}
            moodsToday={parseArr(todayDay?.moodTags)}
            onCustomize={() => router.push('/customize-quickbar')}
          />
        )}

        {/* Pregnancy chance + Self-care + Tip cards */}
        {state.kind !== 'no-data' && (
          <PregnancyChanceCard chance={pregnancyChance(today, fertile)} />
        )}
        <SelfCareCard state={state} />
        <TipCard />

        {/* Actual-vs-expected card on day 1 of a new period */}
        {showActualVsExpected && (
          <ActualVsExpectedCard
            actual={lastStart}
            expected={prediction.expectedStart}
          />
        )}

        {/* No-data fallback — illustration + onboarding CTA */}
        {state.kind === 'no-data' && (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: t.spacing.md }}>
              <Illustration name="empty-calendar" width={200} height={140} />
              <Text variant="bodyStrong" align="center" style={{ marginTop: t.spacing.md }}>
                Tap any day above to log your first period.
              </Text>
              <Text variant="caption" color={t.palette.inkMuted} align="center">
                Predictions tighten after a couple of cycles.
              </Text>
            </View>
          </Card>
        )}

        {/* Next-period card (only when we're past day 1, otherwise the hero already covers it) */}
        {prediction && state.kind !== 'no-data' && state.kind !== 'expected-soon' && state.kind !== 'late' && (
          <Card>
            <VStack gap="sm">
              <Text variant="micro" color={t.palette.inkMuted}>
                NEXT PERIOD
              </Text>
              <Text variant="bodyStrong">
                {humanRange(prediction.expectedStart, prediction.expectedEnd)}
              </Text>
              <Text variant="caption" color={t.palette.inkMuted}>
                Window: {humanRange(prediction.confidenceLow, prediction.confidenceHigh)}.
              </Text>
              {prediction.isDefault && (
                <Text variant="caption" color={t.palette.inkFaint}>
                  Using default 28-day estimate. Predictions tighten after a couple of cycles.
                </Text>
              )}
            </VStack>
          </Card>
        )}
      </VStack>
    </Screen>
  );
}

function ActualVsExpectedCard({ actual, expected }: { actual: string; expected: string }) {
  const t = useTheme();
  const variation = diffDays(actual, expected); // negative = early
  const labelMain =
    variation === 0
      ? 'On time'
      : variation < 0
      ? `${Math.abs(variation)} ${Math.abs(variation) === 1 ? 'day' : 'days'} early`
      : `${variation} ${variation === 1 ? 'day' : 'days'} late`;
  const reinforce =
    variation === 0
      ? "Right on cue. Your body's rhythm is remarkable."
      : Math.abs(variation) <= 2
      ? "It's okay; just adjust and prioritise self-care."
      : 'A wider variation than usual — patterns may shift.';

  return (
    <Card>
      <VStack gap="sm">
        <Text variant="micro" color={t.palette.inkMuted}>
          PERIOD STARTED
        </Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={t.palette.inkMuted}>
              Actual
            </Text>
            <Text variant="bodyStrong">{humanDay(actual)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={t.palette.inkMuted}>
              Expected
            </Text>
            <Text variant="bodyStrong" color={t.palette.inkMuted}>
              {humanDay(expected)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={t.palette.inkMuted}>
              Variation
            </Text>
            <Text variant="bodyStrong">{labelMain}</Text>
          </View>
        </View>
        <Text variant="caption" color={t.palette.inkFaint}>
          {reinforce}
        </Text>
      </VStack>
    </Card>
  );
}

function QuickChipBar({
  actions,
  today,
  symptomsToday,
  moodsToday,
  onCustomize,
}: {
  actions: QuickAction[];
  today: string;
  symptomsToday: string[];
  moodsToday: string[];
  onCustomize: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const { patchDay } = useCycle();

  const isOn = (a: QuickAction): boolean => {
    if (a.kind === 'symptom') return symptomsToday.includes(a.payload!);
    if (a.kind === 'mood') return moodsToday.includes(a.payload!);
    return false;
  };

  const handle = async (a: QuickAction) => {
    if (a.kind === 'symptom' && a.payload) {
      const next = symptomsToday.includes(a.payload)
        ? symptomsToday.filter((s) => s !== a.payload)
        : [...symptomsToday, a.payload];
      await patchDay(today, { symptomTagsArr: next });
      return;
    }
    if (a.kind === 'mood' && a.payload) {
      const next = moodsToday.includes(a.payload)
        ? moodsToday.filter((s) => s !== a.payload)
        : [...moodsToday, a.payload];
      await patchDay(today, { moodTagsArr: next });
      return;
    }
    router.push(`/log/${today}`);
  };

  if (actions.length === 0) return null;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: t.spacing.sm,
        }}
      >
        <Text variant="micro" color={t.palette.inkMuted}>
          QUICK
        </Text>
        <Pressable
          onPress={onCustomize}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Customize quick-bar"
        >
          <Text variant="micro" color={t.palette.inkMuted}>
            CUSTOMIZE
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {actions.map((a) => {
          const on = isOn(a);
          return (
            <Pressable
              key={a.id}
              onPress={() => handle(a)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={a.label}
              style={({ pressed }) => ({
                paddingVertical: t.spacing.sm + 2,
                paddingHorizontal: t.spacing.md,
                backgroundColor: on ? t.palette.ink : t.palette.paperDeep,
                borderRadius: t.radii.pill,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon name={a.icon} size={14} color={on ? t.palette.paper : t.palette.ink} />
              <Text variant="caption" color={on ? t.palette.paper : t.palette.inkSoft}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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
            Settings → Mode when you want them back.
          </Text>
        </Card>
      </VStack>
    </Screen>
  );
}

function flowToDotColor(
  flow: string | null,
  palette: ReturnType<typeof useTheme>['palette'],
): string | null {
  switch (flow) {
    case 'spotting':
      return palette.flowSpotting;
    case 'light':
      return palette.flowLight;
    case 'medium':
      return palette.flowMedium;
    case 'heavy':
      return palette.flowHeavy;
    default:
      return null;
  }
}

function humanRange(a: string, b: string) {
  const da = fromISO(a);
  const db = fromISO(b);
  const sameMonth = da.getMonth() === db.getMonth();
  const fa = da.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fb = db.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  );
  void addDaysISO; // silence unused-import lint when temporarily not used
  return `${fa} – ${fb}`;
}

function humanDay(iso: string) {
  return fromISO(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
