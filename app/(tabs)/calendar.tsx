import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { addMonths, addDays, format, isSameDay, startOfMonth, startOfWeek, endOfMonth } from 'date-fns';
import { Screen } from '@/ui/components/Screen';
import { Text } from '@/ui/components/Text';
import { useTheme } from '@/ui/ThemeProvider';
import { useCycle } from '@/store/cycle';
import { useCopy } from '@/copy/useCopy';
import { addDaysISO, toISO, type ISODate } from '@/engine/dates';
import { type Day } from '@/db/schema';

type DayMap = Map<ISODate, Day>;

/**
 * Multi-month "journey" calendar (mirrors design-study image #5):
 * shows the previous month, the current month, and the next 4 months in
 * a single continuous scroll, so users can plan around upcoming cycles.
 */
export default function CalendarTab() {
  const t = useTheme();
  const router = useRouter();
  const { prediction, fertile, loadDays, settings } = useCycle();
  const [dayMap, setDayMap] = useState<DayMap>(new Map());
  // Fertile windows are only meaningful (and only shown) when the user is
  // actively tracking fertility. Off by default.
  const fertilityOn = !!settings?.fertilityMode && settings.fertilityMode !== 'off';

  // Build the month list: -1, 0 (current), +1..+4
  const months = useMemo(() => {
    const base = startOfMonth(new Date());
    return Array.from({ length: 6 }).map((_, i) => addMonths(base, i - 1));
  }, []);

  useEffect(() => {
    (async () => {
      const first = startOfMonth(months[0]);
      const last = endOfMonth(months[months.length - 1]);
      const ds = await loadDays(toISO(first), toISO(last));
      const m: DayMap = new Map();
      for (const d of ds) m.set(d.date, d);
      setDayMap(m);
    })();
  }, [months, loadDays]);

  // Predicted period set: stretch out N upcoming periods using cycleLength
  const predictedSet = useMemo(() => {
    if (!prediction) return new Set<string>();
    const out = new Set<string>();
    let s = prediction.expectedStart;
    for (let i = 0; i < 6; i++) {
      let cur = s;
      for (let d = 0; d < prediction.periodLength; d++) {
        out.add(cur);
        cur = addDaysISO(cur, 1);
      }
      s = addDaysISO(s, prediction.cycleLength);
    }
    return out;
  }, [prediction]);

  const fertileSet = useMemo(() => {
    if (!fertilityOn || !fertile || !prediction) return new Set<string>();
    const out = new Set<string>();
    let start = fertile.start;
    let end = fertile.end;
    for (let i = 0; i < 6; i++) {
      let d = start;
      while (d <= end) {
        out.add(d);
        d = addDaysISO(d, 1);
      }
      start = addDaysISO(start, prediction.cycleLength);
      end = addDaysISO(end, prediction.cycleLength);
    }
    return out;
  }, [fertilityOn, fertile, prediction]);

  return (
    // Non-scroll Screen so the Legend can sit in a pinned footer below the
    // scrollable month list, instead of being buried at the bottom of a long
    // six-month scroll.
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: t.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: t.spacing.md }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            CALENDAR
          </Text>
          <Text variant="h1">Your journey</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            Six months at a glance — past, present, and projected.
          </Text>
        </View>

        <View style={{ marginTop: t.spacing.lg, gap: t.spacing.xl }}>
          {months.map((m) => (
            <Month
              key={toISO(m)}
              cursor={m}
              dayMap={dayMap}
              predictedSet={predictedSet}
              fertileSet={fertileSet}
              onPickDay={(iso) => router.push(`/log/${iso}`)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Pinned footer — stays put while the month list scrolls. */}
      <View style={{ paddingTop: t.spacing.md }}>
        <Legend showFertile={fertilityOn} />
      </View>
    </Screen>
  );
}

function Month({
  cursor,
  dayMap,
  predictedSet,
  fertileSet,
  onPickDay,
}: {
  cursor: Date;
  dayMap: DayMap;
  predictedSet: Set<string>;
  fertileSet: Set<string>;
  onPickDay: (iso: ISODate) => void;
}) {
  const t = useTheme();
  const cells = useMemo(() => buildMonth(cursor), [cursor]);

  return (
    <View>
      <Text variant="bodyStrong" style={{ marginBottom: t.spacing.sm }}>
        {format(cursor, 'MMMM yyyy')}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
          <Text
            key={i}
            variant="micro"
            color={t.palette.inkFaint}
            align="center"
            style={{ flex: 1 }}
          >
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
        {cells.map((d, i) => {
          const iso = toISO(d);
          const day = dayMap.get(iso);
          const isToday = isSameDay(d, new Date());
          const inMonth = d.getMonth() === cursor.getMonth();
          const isPredicted = predictedSet.has(iso);
          const isFertile = fertileSet.has(iso);
          return (
            <Pressable
              key={i}
              onPress={() => onPickDay(iso)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${iso}`}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: inMonth ? 1 : 0.3,
              }}
            >
              <DayCell
                date={d}
                flow={day?.flow ?? null}
                hasNote={Boolean(day?.notes)}
                isToday={isToday}
                isPredicted={isPredicted}
                isFertile={isFertile}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DayCell({
  date,
  flow,
  hasNote,
  isToday,
  isPredicted,
  isFertile,
}: {
  date: Date;
  flow: string | null;
  hasNote: boolean;
  isToday: boolean;
  isPredicted: boolean;
  isFertile: boolean;
}) {
  const t = useTheme();
  const flowColor = (() => {
    if (!flow) return null;
    if (flow === 'spotting') return t.palette.flowSpotting;
    if (flow === 'light') return t.palette.flowLight;
    if (flow === 'medium') return t.palette.flowMedium;
    if (flow === 'heavy') return t.palette.flowHeavy;
    return null;
  })();

  // Priority: a logged flow always wins; otherwise a predicted upcoming period
  // gets a soft fill (plus the dashed ring below), then the fertile window.
  const bg = flowColor
    ? flowColor
    : isPredicted
    ? t.palette.predictedSoft
    : isFertile
    ? t.palette.ovulationSoft
    : 'transparent';
  const fg = flowColor ? t.palette.paper : t.palette.ink;
  const ringColor = isPredicted ? t.palette.predicted : isToday ? t.palette.ink : 'transparent';

  return (
    <View
      style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: bg,
          borderWidth: ringColor !== 'transparent' ? 1.5 : 0,
          borderColor: ringColor,
          borderStyle: isPredicted ? 'dashed' : 'solid',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="micro" color={fg}>
          {date.getDate()}
        </Text>
      </View>
      {hasNote && (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.palette.inkMuted,
          }}
        />
      )}
    </View>
  );
}

function Legend({ showFertile }: { showFertile: boolean }) {
  const t = useTheme();
  const { Term } = useCopy();
  const item = (
    fill: string,
    label: string,
    opts: { border?: string; dashed?: boolean } = {},
  ) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          backgroundColor: fill,
          borderWidth: opts.border ? 1.5 : 0,
          borderColor: opts.border,
          borderStyle: opts.dashed ? 'dashed' : 'solid',
        }}
      />
      <Text variant="micro" color={t.palette.inkMuted}>
        {label}
      </Text>
    </View>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: t.palette.paperDeep,
        paddingVertical: t.spacing.sm,
        paddingHorizontal: t.spacing.md,
        borderRadius: t.radii.md,
      }}
    >
      {item(t.palette.flowMedium, `${Term} (logged)`)}
      {showFertile && item(t.palette.ovulationSoft, 'Fertile window (est.)')}
      {item(t.palette.predictedSoft, `Predicted ${Term.toLowerCase()}`, {
        border: t.palette.predicted,
        dashed: true,
      })}
    </View>
  );
}

function buildMonth(cursor: Date): Date[] {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  return cells;
}
