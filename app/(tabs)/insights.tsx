import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Tabs } from '@/ui/components/Tabs';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { Illustration } from '@/ui/illustrations/Illustration';
import { useCycle } from '@/store/cycle';
import { listCycles, getTrendDays } from '@/db/repo';
import { cycleLengthsFromStarts } from '@/engine/predict';
import {
  computeMoodShare,
  computePerCycleStats,
  computeSymptomTrends,
  type SymptomDistribution,
  type PerCycleStat,
  type DayPoint,
} from '@/engine/trends';
import { LineChart } from '@/features/charts/LineChart';
import { Donut } from '@/features/charts/Donut';
import { PhaseStrip, PhaseLegend } from '@/features/phase-strip/PhaseStrip';
import { fromISO, diffDays, addDaysISO } from '@/engine/dates';
import { reinforcing } from '@/features/home/headline';
import { classifyVariation, variationCopy } from '@/engine/health-signals';
import { useCopy } from '@/copy/useCopy';

type TabKey = 'overview' | 'trends' | 'fertility' | 'symptoms';

export default function Insights() {
  const t = useTheme();
  const cycle = useCycle();
  const [tab, setTab] = useState<TabKey>('overview');
  const [stats, setStats] = useState<{
    cycles: number;
    avg: number | null;
    shortest: number | null;
    longest: number | null;
    variation: number | null;
  } | null>(null);
  const [trends, setTrends] = useState<SymptomDistribution[]>([]);
  const [moodShare, setMoodShare] = useState<Array<{ mood: string; share: number }>>([]);
  const [perCycle, setPerCycle] = useState<PerCycleStat[]>([]);
  const [days, setDays] = useState<DayPoint[]>([]);

  useEffect(() => {
    (async () => {
      const cs = await listCycles();
      const dayPoints = await getTrendDays();
      const lens = cycleLengthsFromStarts(cs.map((c) => c.startDate));
      if (lens.length > 0) {
        const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
        setStats({
          cycles: cs.length,
          avg,
          shortest: Math.min(...lens),
          longest: Math.max(...lens),
          variation: Math.max(...lens) - Math.min(...lens),
        });
      } else {
        setStats({ cycles: cs.length, avg: null, shortest: null, longest: null, variation: null });
      }
      setTrends(computeSymptomTrends(dayPoints));
      setMoodShare(computeMoodShare(dayPoints));
      setPerCycle(computePerCycleStats(cs.map((c) => c.startDate), dayPoints));
      setDays(dayPoints);
    })();
  }, []);

  const noData = !stats || stats.cycles < 1;

  // The Fertility tab only makes sense when the user is tracking fertility.
  const fertilityOn =
    !!cycle.settings?.fertilityMode && cycle.settings.fertilityMode !== 'off';

  // If fertility tracking gets switched off while the Fertility tab is open,
  // fall back to Overview so we never show an orphaned/empty tab.
  useEffect(() => {
    if (!fertilityOn && tab === 'fertility') setTab('overview');
  }, [fertilityOn, tab]);

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'trends', label: 'Trends' },
    ...(fertilityOn ? [{ value: 'fertility', label: 'Fertility' }] : []),
    { value: 'symptoms', label: 'Symptoms' },
  ];

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg, paddingBottom: t.spacing.md }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          INSIGHTS
        </Text>
        <Text variant="h1">Your patterns</Text>
      </View>

      <Tabs
        tabs={tabs}
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
      />

      <VStack
        gap="lg"
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl + 80,
        }}
      >
        {noData ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: t.spacing.md }}>
              <Illustration name="patterns" width={220} height={140} />
              <Text variant="bodyStrong" align="center" style={{ marginTop: t.spacing.md }}>
                Not enough data yet
              </Text>
              <Text variant="caption" color={t.palette.inkMuted} align="center">
                After a couple of cycles, you'll see averages, regularity, symptom patterns, and BBT trends here.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            {tab === 'overview' && <OverviewTab stats={stats!} perCycle={perCycle} />}
            {tab === 'trends' && <TrendsTab perCycle={perCycle} stats={stats!} />}
            {tab === 'fertility' && <FertilityTab />}
            {tab === 'symptoms' && (
              <SymptomsTab trends={trends} moodShare={moodShare} days={days} />
            )}
          </>
        )}
      </VStack>
    </Screen>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  perCycle,
}: {
  stats: {
    cycles: number;
    avg: number | null;
    shortest: number | null;
    longest: number | null;
    variation: number | null;
  };
  perCycle: PerCycleStat[];
}) {
  const t = useTheme();
  const { term } = useCopy();
  const settings = useCycle((s) => s.settings);
  const cycleLength = settings?.defaultCycleLength ?? 28;
  const periodLength = settings?.defaultPeriodLength ?? 5;
  const cycleDay = useCycle((s) => s.cycleDayNum);
  const reinforce = reinforcing({ cycles: stats.cycles, variation: stats.variation ?? 0 });

  const lastTwo = perCycle.slice(-2);
  const lastClosed = lastTwo.find((c) => c.cycleLength != null);

  // Averages and regularity need a *completed* cycle to measure — i.e. a
  // second period start. Until then most tiles read "—", which looks broken
  // without a word of explanation. Mirror the "No patterns yet" copy elsewhere.
  const awaitingSecondCycle = stats.avg === null;

  return (
    <VStack gap="lg">
      {awaitingSecondCycle && (
        <Card style={{ backgroundColor: t.palette.lutealSoft }}>
          <VStack gap="xs">
            <Text variant="bodyStrong">Gathering your baseline</Text>
            <Text variant="caption" color={t.palette.inkMuted}>
              Averages and regularity appear once you've logged a second {term} —
              that's the first full cycle we can measure. For now you'll see your
              current cycle below; the rest fills in as you go.
            </Text>
          </VStack>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Card>
            <VStack gap="xs">
              <Text variant="micro" color={t.palette.inkMuted}>
                AVG CYCLE
              </Text>
              <Text variant="display">
                {stats.avg !== null ? Math.round(stats.avg) : '—'}
              </Text>
              <Text variant="caption" color={t.palette.inkMuted}>
                days
              </Text>
            </VStack>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <VStack gap="xs">
              <Text variant="micro" color={t.palette.inkMuted}>
                AVG PERIOD
              </Text>
              <Text variant="display">{lastClosed?.periodLength ?? '—'}</Text>
              <Text variant="caption" color={t.palette.inkMuted}>
                days
              </Text>
            </VStack>
          </Card>
        </View>
      </View>

      <Card>
        <VStack gap="sm">
          <Text variant="micro" color={t.palette.inkMuted}>
            CURRENT CYCLE
          </Text>
          <PhaseStrip
            cycleLength={cycleLength}
            periodLength={periodLength}
            currentDay={cycleDay}
            highlightCurrent
            barHeight={20}
          />
          <PhaseLegend />
        </VStack>
      </Card>

      <Card>
        <VStack gap="xs">
          <Text variant="micro" color={t.palette.inkMuted}>
            REGULARITY
          </Text>
          <Text variant="bodyStrong">
            {stats.variation === null
              ? '—'
              : stats.variation <= 4
              ? 'Quite regular'
              : 'A bit variable'}
          </Text>
          {reinforce && (
            <Text variant="caption" color={t.palette.inkMuted}>
              {reinforce}
            </Text>
          )}
        </VStack>
      </Card>
    </VStack>
  );
}

// ─── Trends ───────────────────────────────────────────────────────────────

function TrendsTab({
  perCycle,
  stats,
}: {
  perCycle: PerCycleStat[];
  stats: {
    cycles: number;
    avg: number | null;
    shortest: number | null;
    longest: number | null;
    variation: number | null;
  };
}) {
  const t = useTheme();
  const { Term } = useCopy();
  const settings = useCycle((s) => s.settings);
  const periodLength = settings?.defaultPeriodLength ?? 5;
  const closed = perCycle.filter((c) => c.cycleLength != null);
  const reinforce = reinforcing({ cycles: stats.cycles, variation: stats.variation ?? 0 });

  // Most recent 2 closed cycles for the comparison card
  const recent = closed.slice(-2);
  const last = recent[recent.length - 2] ?? null;
  const current = recent[recent.length - 1] ?? null;
  const variation = last && current ? Math.abs((current.cycleLength ?? 0) - (last.cycleLength ?? 0)) : null;

  // Variation classification across last 6 closed cycles
  const lastSix = closed.slice(-6).map((c) => c.cycleLength!).filter(Boolean);
  const varLevel = classifyVariation(lastSix);
  const varCopy = variationCopy(varLevel);

  // Cycle-rhythm chart: cycle lengths and period lengths over time
  const cycleSeries: Array<number | null> = closed.map((c) => c.cycleLength ?? null);
  const periodSeries: Array<number | null> = closed.map((c) => c.periodLength ?? null);
  const xLabels = closed.map((c) =>
    fromISO(c.startDate).toLocaleDateString(undefined, { month: 'short' }),
  );

  return (
    <VStack gap="lg">
      {/* Atypical-variation soft warning, only when the threshold is crossed */}
      {varLevel === 'atypical' && lastSix.length >= 3 && (
        <Card style={{ borderWidth: 1, borderColor: t.palette.warning }}>
          <VStack gap="xs">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="flag" size={16} color={t.palette.warning} />
              <Text variant="bodyStrong" color={t.palette.warning}>
                {varCopy.title}
              </Text>
            </View>
            <Text variant="caption" color={t.palette.inkSoft}>
              {varCopy.body}
            </Text>
          </VStack>
        </Card>
      )}

      {/* Quick comparison of last vs current */}
      <Card style={{ backgroundColor: t.palette.lutealSoft }}>
        <VStack gap="sm">
          <Text variant="micro" color={t.palette.inkMuted}>
            CYCLE LENGTH
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 4,
            }}
          >
            <Text variant="body">Last cycle</Text>
            <Text variant="bodyStrong">{last?.cycleLength ?? '—'} days</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: t.palette.ink,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.sm + 2,
              borderRadius: t.radii.md,
            }}
          >
            <Text variant="body" color={t.palette.paper}>
              This cycle
            </Text>
            <Text variant="bodyStrong" color={t.palette.paper}>
              {current?.cycleLength ?? '—'} days
            </Text>
          </View>
          <Text variant="caption" color={t.palette.inkSoft}>
            Variation: {variation === null ? '—' : `${variation} day${variation === 1 ? '' : 's'}`}
          </Text>
          {reinforce && (
            <Text variant="caption" color={t.palette.inkMuted}>
              {reinforce}
            </Text>
          )}
        </VStack>
      </Card>

      {/* Mini phase strips for the last 3 closed cycles */}
      {closed.slice(-3).reverse().map((c) => (
        <Card key={c.startDate}>
          <VStack gap="sm">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">{c.cycleLength} days</Text>
              <Text variant="caption" color={t.palette.inkMuted}>
                Started {fromISO(c.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <PhaseStrip
              cycleLength={c.cycleLength!}
              periodLength={c.periodLength ?? periodLength}
              barHeight={14}
            />
          </VStack>
        </Card>
      ))}

      {/* Cycle rhythm line chart */}
      {cycleSeries.length >= 2 && (
        <Card>
          <VStack gap="sm">
            <Text variant="micro" color={t.palette.inkMuted}>
              CYCLE RHYTHM — LAST {cycleSeries.length} CYCLES
            </Text>
            <LineChart
              values={cycleSeries}
              width={280}
              height={120}
              color={t.palette.luteal}
              yMin={Math.min(...(cycleSeries.filter((v) => v != null) as number[])) - 2}
              yMax={Math.max(...(cycleSeries.filter((v) => v != null) as number[])) + 2}
            />
            <Text variant="caption" color={t.palette.inkMuted}>
              Cycle days
            </Text>
            <View style={{ height: t.spacing.md }} />
            <LineChart
              values={periodSeries}
              width={280}
              height={80}
              color={t.palette.flowMedium}
              yMin={0}
              yMax={Math.max(8, Math.max(...(periodSeries.filter((v) => v != null) as number[])) + 1)}
            />
            <Text variant="caption" color={t.palette.inkMuted}>
              {Term} days
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              {xLabels.map((l, i) => (
                <Text key={i} variant="micro" color={t.palette.inkFaint}>
                  {l}
                </Text>
              ))}
            </View>
          </VStack>
        </Card>
      )}

      {reinforce && (
        <Text variant="caption" color={t.palette.inkMuted} align="center">
          {reinforce}
        </Text>
      )}
    </VStack>
  );
}

// ─── Fertility ────────────────────────────────────────────────────────────

function FertilityTab() {
  const t = useTheme();
  const { fertile, prediction, lastStart } = useCycle();

  if (!prediction || !fertile || !lastStart) {
    return (
      <Card>
        <Text variant="bodyStrong">Not enough data yet</Text>
        <Text variant="caption" color={t.palette.inkMuted}>
          Log a couple of cycles and Lumen will estimate fertile windows here.
        </Text>
      </Card>
    );
  }

  // Build a position-on-cycle progress bar
  const today = new Date().toISOString().slice(0, 10);
  const cycleDay = diffDays(today, lastStart) + 1;
  const cycleLen = prediction.cycleLength;
  const fertileStartDay = diffDays(fertile.start, lastStart) + 1;
  const fertileEndDay = diffDays(fertile.end, lastStart) + 1;
  const peakDay = diffDays(fertile.peak, lastStart) + 1;
  const inWindow = today >= fertile.start && today <= fertile.end;
  const daysToPeak = diffDays(fertile.peak, today);

  // Upcoming windows (next 3) — derived by stepping forward by cycleLength
  const upcoming = [0, 1, 2].map((i) => ({
    start: addDaysISO(fertile.start, cycleLen * (i + 1)),
    end: addDaysISO(fertile.end, cycleLen * (i + 1)),
    peak: addDaysISO(fertile.peak, cycleLen * (i + 1)),
  }));

  return (
    <VStack gap="lg">
      <Card>
        <VStack gap="md">
          <Text variant="micro" color={t.palette.inkMuted}>
            NEXT OVULATION
          </Text>
          <Text variant="h2">
            {daysToPeak === 0 ? 'Today' : daysToPeak > 0 ? `${daysToPeak} days left` : 'Past'}
          </Text>
          <FertilityProgressBar
            cycleLen={cycleLen}
            cycleDay={cycleDay}
            periodLength={prediction.periodLength}
            fertileStart={fertileStartDay}
            fertileEnd={fertileEndDay}
            peakDay={peakDay}
          />
          <Text variant="caption" color={t.palette.inkMuted}>
            {inWindow
              ? 'Currently in fertile window — pregnancy possible.'
              : daysToPeak > 0
              ? 'Currently low chances of getting pregnant.'
              : 'Past peak — chances winding down.'}
            {' '}Estimate, not contraception.
          </Text>
        </VStack>
      </Card>

      <Card>
        <VStack gap="md">
          <Text variant="micro" color={t.palette.inkMuted}>
            UPCOMING FERTILE WINDOWS
          </Text>
          {upcoming.map((w) => (
            <View key={w.start} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body">
                  {fromISO(w.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {' – '}
                  {fromISO(w.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <Text variant="caption" color={t.palette.inkMuted}>
                  Peak {fromISO(w.peak).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: t.palette.ovulationSoft,
                  position: 'relative',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -3,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: t.palette.ovulation,
                    transform: [{ translateX: -7 }],
                  }}
                />
              </View>
            </View>
          ))}
        </VStack>
      </Card>
    </VStack>
  );
}

function FertilityProgressBar({
  cycleLen,
  cycleDay,
  periodLength,
  fertileStart,
  fertileEnd,
  peakDay,
}: {
  cycleLen: number;
  cycleDay: number;
  periodLength: number;
  fertileStart: number;
  fertileEnd: number;
  peakDay: number;
}) {
  const t = useTheme();
  const pct = (n: number) => `${Math.max(0, Math.min(100, ((n - 1) / (cycleLen - 1)) * 100))}%` as const;
  return (
    <View style={{ height: 24, position: 'relative', marginVertical: 4 }}>
      {/* Track */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: t.palette.paperEdge,
        }}
      />
      {/* Period segment */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: pct(periodLength),
          top: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: t.palette.flowMedium,
        }}
      />
      {/* Fertile segment */}
      <View
        style={{
          position: 'absolute',
          left: pct(fertileStart),
          width: `${((fertileEnd - fertileStart) / (cycleLen - 1)) * 100}%`,
          top: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: t.palette.ovulationSoft,
        }}
      />
      {/* Peak marker */}
      <View
        style={{
          position: 'absolute',
          left: pct(peakDay),
          top: 4,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: t.palette.ovulation,
          borderWidth: 2,
          borderColor: t.palette.paper,
          transform: [{ translateX: -8 }],
        }}
      />
      {/* Today marker */}
      <View
        style={{
          position: 'absolute',
          left: pct(cycleDay),
          top: 0,
          width: 2,
          height: 24,
          backgroundColor: t.palette.ink,
          transform: [{ translateX: -1 }],
        }}
      />
    </View>
  );
}

// ─── Symptoms ─────────────────────────────────────────────────────────────

function SymptomsTab({
  trends,
  moodShare,
  days,
}: {
  trends: SymptomDistribution[];
  moodShare: Array<{ mood: string; share: number }>;
  days: DayPoint[];
}) {
  const t = useTheme();

  if (trends.length === 0 && moodShare.length === 0) {
    return (
      <Card>
        <Text variant="bodyStrong">No patterns yet</Text>
        <Text variant="caption" color={t.palette.inkMuted}>
          Log symptoms and moods on a few days, and clusters will surface here.
        </Text>
      </Card>
    );
  }

  // Top symptom gets the donut treatment; the rest get the bar.
  const top = trends[0];
  const rest = trends.slice(1, 6);

  return (
    <VStack gap="lg">
      {top && (
        <Card>
          <VStack gap="md">
            <Text variant="micro" color={t.palette.inkMuted}>
              MOST FREQUENT
            </Text>
            <SymptomPhaseDonut symptom={top.symptom} totalCount={top.totalOccurrences} days={days} />
          </VStack>
        </Card>
      )}

      {rest.length > 0 && (
        <Card>
          <VStack gap="md">
            <Text variant="micro" color={t.palette.inkMuted}>
              FREQUENTLY TRACKED
            </Text>
            {rest.map((s) => {
              const phaseCounts = phaseSegmentCounts(s.symptom, days);
              return (
                <View key={s.symptom} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyStrong">{s.symptom}</Text>
                    <Text variant="caption" color={t.palette.inkMuted}>
                      x{s.totalOccurrences}
                    </Text>
                  </View>
                  <PhaseSegmentBar counts={phaseCounts} />
                  {s.hotspot && (
                    <Text variant="caption" color={t.palette.inkFaint}>
                      Cluster: cycle days {s.hotspot.startDay}–{s.hotspot.endDay}
                    </Text>
                  )}
                </View>
              );
            })}
          </VStack>
        </Card>
      )}

      {moodShare.length > 0 && (
        <Card>
          <VStack gap="sm">
            <Text variant="micro" color={t.palette.inkMuted}>
              MOOD SHARE
            </Text>
            {moodShare.slice(0, 5).map((m) => (
              <View key={m.mood} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="body">{m.mood}</Text>
                  <Text variant="caption" color={t.palette.inkMuted}>
                    {Math.round(m.share * 100)}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: t.palette.paperEdge,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.round(m.share * 100)}%`,
                      height: '100%',
                      backgroundColor: t.palette.fertile,
                    }}
                  />
                </View>
              </View>
            ))}
          </VStack>
        </Card>
      )}

      {/* BBT chart for last cycle (if data) */}
      <BBTLast30Days days={days} />
    </VStack>
  );
}

function SymptomPhaseDonut({
  symptom,
  totalCount,
  days,
}: {
  symptom: string;
  totalCount: number;
  days: DayPoint[];
}) {
  const t = useTheme();
  const { Term } = useCopy();
  const counts = phaseSegmentCounts(symptom, days);
  const segs = [
    { value: counts.period, color: t.palette.flowMedium, label: Term },
    { value: counts.follicular, color: t.palette.follicular, label: 'Follicular' },
    { value: counts.ovulation, color: t.palette.ovulation, label: 'Ovulation' },
    { value: counts.luteal, color: t.palette.luteal, label: 'Luteal' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing.lg, alignItems: 'center' }}>
      <Donut segments={segs} size={120} strokeWidth={14} centerLabel={`x${totalCount}`} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="bodyStrong">{symptom}</Text>
        {segs.map((s) => (
          <View
            key={s.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }}
            />
            <Text variant="caption" color={t.palette.inkSoft}>
              {s.label}
            </Text>
            <View style={{ flex: 1 }} />
            <Text variant="caption" color={t.palette.inkMuted}>
              x{s.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function phaseSegmentCounts(symptom: string, days: DayPoint[]) {
  const counts = { period: 0, follicular: 0, ovulation: 0, luteal: 0 };
  for (const d of days) {
    if (!d.symptoms?.includes(symptom)) continue;
    if (!d.cycleStart) continue;
    const dayN = diffDays(d.date, d.cycleStart) + 1;
    if (dayN <= 5) counts.period++;
    else if (dayN <= 13) counts.follicular++;
    else if (dayN <= 16) counts.ovulation++;
    else counts.luteal++;
  }
  return counts;
}

function PhaseSegmentBar({
  counts,
}: {
  counts: { period: number; follicular: number; ovulation: number; luteal: number };
}) {
  const t = useTheme();
  const total = counts.period + counts.follicular + counts.ovulation + counts.luteal;
  if (total === 0) return null;
  const segs = [
    { color: t.palette.flowMedium, n: counts.period, label: 'Period' },
    { color: t.palette.follicular, n: counts.follicular, label: 'Follicular' },
    { color: t.palette.ovulation, n: counts.ovulation, label: 'Ovulation' },
    { color: t.palette.luteal, n: counts.luteal, label: 'Luteal' },
  ];
  return (
    <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
      {segs.map((s, i) => {
        const w = (s.n / total) * 100;
        if (w === 0) return null;
        return (
          <View
            key={i}
            style={{ width: `${w}%`, backgroundColor: s.color, height: '100%' }}
          />
        );
      })}
    </View>
  );
}

function BBTLast30Days({ days }: { days: DayPoint[] }) {
  const t = useTheme();
  const recent = days.filter((d) => d.bbt != null).slice(-30);
  if (recent.length < 3) return null;
  const series = recent.map((d) => d.bbt ?? null);
  return (
    <Card>
      <VStack gap="sm">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="thermometer" size={16} color={t.palette.inkMuted} />
          <Text variant="micro" color={t.palette.inkMuted}>
            BBT — RECENT
          </Text>
        </View>
        <LineChart values={series} width={280} height={140} />
        <Text variant="caption" color={t.palette.inkFaint}>
          A sustained rise of ~0.2°C usually marks ovulation in the day or two prior.
        </Text>
      </VStack>
    </Card>
  );
}
