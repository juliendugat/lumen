import { type ISODate, diffDays } from './dates';

export type DayPoint = {
  date: ISODate;
  cycleStart?: ISODate; // start of the cycle this day belongs to
  flow?: string | null;
  symptoms?: string[];
  moods?: string[];
  bbt?: number | null;
};

/**
 * For each symptom tag, compute the distribution across cycle days.
 * Returns an array of { symptom, byCycleDay } where byCycleDay[i] = number of
 * occurrences on cycle day (i+1).
 */
export type SymptomDistribution = {
  symptom: string;
  byCycleDay: number[];
  totalOccurrences: number;
  /** Which cycle-day window (1-indexed start, end inclusive) accounts for ≥ 50% of occurrences. */
  hotspot?: { startDay: number; endDay: number; share: number };
};

export function computeSymptomTrends(
  days: DayPoint[],
  maxCycleLen = 35,
): SymptomDistribution[] {
  const counts = new Map<string, number[]>();

  for (const d of days) {
    if (!d.cycleStart || !d.symptoms || d.symptoms.length === 0) continue;
    const dayIndex = diffDays(d.date, d.cycleStart);
    if (dayIndex < 0 || dayIndex >= maxCycleLen) continue;
    for (const s of d.symptoms) {
      let arr = counts.get(s);
      if (!arr) {
        arr = new Array(maxCycleLen).fill(0);
        counts.set(s, arr);
      }
      arr[dayIndex] += 1;
    }
  }

  const out: SymptomDistribution[] = [];
  for (const [symptom, byCycleDay] of counts) {
    const total = byCycleDay.reduce((a, b) => a + b, 0);
    if (total < 3) continue; // not enough signal
    out.push({
      symptom,
      byCycleDay,
      totalOccurrences: total,
      hotspot: findHotspot(byCycleDay, total),
    });
  }
  out.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  return out;
}

function findHotspot(arr: number[], total: number): SymptomDistribution['hotspot'] {
  // Find the smallest contiguous window covering ≥ 50% of occurrences.
  let bestStart = 0;
  let bestEnd = arr.length - 1;
  let bestLen = arr.length;
  for (let start = 0; start < arr.length; start++) {
    let running = 0;
    for (let end = start; end < arr.length; end++) {
      running += arr[end];
      if (running >= total * 0.5) {
        const len = end - start + 1;
        if (len < bestLen) {
          bestLen = len;
          bestStart = start;
          bestEnd = end;
        }
        break;
      }
    }
  }
  const share = arr.slice(bestStart, bestEnd + 1).reduce((a, b) => a + b, 0) / total;
  return { startDay: bestStart + 1, endDay: bestEnd + 1, share };
}

/**
 * Compute mood prevalence — share of logged days with each mood.
 */
export function computeMoodShare(days: DayPoint[]): Array<{ mood: string; share: number }> {
  const counts = new Map<string, number>();
  let logged = 0;
  for (const d of days) {
    if (!d.moods || d.moods.length === 0) continue;
    logged++;
    for (const m of d.moods) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  if (logged === 0) return [];
  return Array.from(counts.entries())
    .map(([mood, n]) => ({ mood, share: n / logged }))
    .sort((a, b) => b.share - a.share);
}

/**
 * Per-cycle stats for the multi-cycle insights dashboard.
 */
export type PerCycleStat = {
  startDate: ISODate;
  cycleLength: number | null; // null for the most recent (open) cycle
  periodLength: number | null;
  symptomCount: number;
};

export function computePerCycleStats(
  cycleStarts: ISODate[],
  days: DayPoint[],
): PerCycleStat[] {
  const sorted = [...cycleStarts].sort();
  const out: PerCycleStat[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    const next = sorted[i + 1];
    const cycleLen = next ? diffDays(next, start) : null;
    let periodLen = 0;
    let symptomCount = 0;
    for (const d of days) {
      if (d.cycleStart !== start) continue;
      if (d.flow && d.flow !== 'spotting') periodLen++;
      symptomCount += d.symptoms?.length ?? 0;
    }
    out.push({
      startDate: start,
      cycleLength: cycleLen,
      periodLength: periodLen > 0 ? periodLen : null,
      symptomCount,
    });
  }
  return out;
}
