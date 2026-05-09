import { addDaysISO, diffDays, type ISODate } from './dates';

export type CycleHistory = {
  /** ISO start dates of past confirmed periods, oldest first. */
  startDates: ISODate[];
  /** Optional: lengths in days of past periods (flow days), oldest first. */
  periodLengths?: number[];
};

export type Prediction = {
  /** Most likely next period start date. */
  expectedStart: ISODate;
  /** Most likely next period end date (start + estimated period length - 1). */
  expectedEnd: ISODate;
  /** Lower bound of 80% confidence band for next start. */
  confidenceLow: ISODate;
  /** Upper bound of 80% confidence band for next start. */
  confidenceHigh: ISODate;
  /** Effective cycle length used (recency-weighted mean). */
  cycleLength: number;
  /** Effective period length used. */
  periodLength: number;
  /** Standard deviation of cycle length over the weighted window, in days. */
  cycleSigma: number;
  /** Number of complete cycles used to estimate. */
  samplesUsed: number;
  /** True when we fell back to defaults (cold start). */
  isDefault: boolean;
};

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
const DEFAULT_SIGMA = 4;
const MIN_PLAUSIBLE_CYCLE = 18;
const MAX_PLAUSIBLE_CYCLE = 60;
/** ~80% confidence band assuming roughly normal residuals. */
const Z_80 = 1.28;
/** Half-life in cycles for exponential weighting. ln(2)/4 ≈ 0.173. */
const RECENCY_DECAY = Math.log(2) / 4;

/**
 * Compute deltas (cycle lengths) from an ordered list of start dates.
 * Filters implausible values (< MIN or > MAX) — likely logging mistakes.
 */
export function cycleLengthsFromStarts(startDates: ISODate[]): number[] {
  if (startDates.length < 2) return [];
  const out: number[] = [];
  for (let i = 1; i < startDates.length; i++) {
    const d = diffDays(startDates[i], startDates[i - 1]);
    if (d >= MIN_PLAUSIBLE_CYCLE && d <= MAX_PLAUSIBLE_CYCLE) out.push(d);
  }
  return out;
}

/**
 * Recency-weighted mean. Most recent value has weight 1; older values
 * decay exponentially with half-life ~4 cycles.
 */
export function weightedMean(samples: number[]): number {
  if (samples.length === 0) return NaN;
  let num = 0;
  let den = 0;
  // samples[samples.length-1] is most recent → weight 1.
  for (let i = 0; i < samples.length; i++) {
    const ageFromMostRecent = samples.length - 1 - i;
    const w = Math.exp(-RECENCY_DECAY * ageFromMostRecent);
    num += w * samples[i];
    den += w;
  }
  return num / den;
}

/**
 * Recency-weighted sample variance using the same weights.
 * Uses the unbiased "frequency weights" form (no Bessel correction here —
 * the weighted form is already a consistent estimator for σ² in our use).
 */
export function weightedVariance(samples: number[], mean: number): number {
  if (samples.length < 2) return NaN;
  let num = 0;
  let den = 0;
  for (let i = 0; i < samples.length; i++) {
    const ageFromMostRecent = samples.length - 1 - i;
    const w = Math.exp(-RECENCY_DECAY * ageFromMostRecent);
    const diff = samples[i] - mean;
    num += w * diff * diff;
    den += w;
  }
  return num / den;
}

export type PredictOptions = {
  /** Override default cycle length when no history exists. */
  defaultCycleLength?: number;
  /** Override default period length when no history exists. */
  defaultPeriodLength?: number;
  /**
   * Life mode tweaks the prediction:
   *   - 'perimenopause' relaxes the outlier window and floors σ higher,
   *     producing visibly wider bands.
   *   - 'pregnancy' returns null — predictions are paused.
   */
  lifeMode?: 'standard' | 'teen' | 'pregnancy' | 'perimenopause';
};

/**
 * Predict the next period given history. See plan §4 for the algorithm.
 *
 * Cold start behaviour:
 *  - 0 prior cycles → defaults (28 ± 4) — or supplied overrides.
 *  - 1 prior cycle → defaults still, anchored to the known start.
 *  - 2+ cycles → recency-weighted mean + variance; band tightens with data.
 */
export function predictNext(
  history: CycleHistory,
  options: PredictOptions = {},
): Prediction | null {
  if (options.lifeMode === 'pregnancy') return null;

  const starts = [...history.startDates].sort();
  if (starts.length === 0) return null;

  const defaultCycle = options.defaultCycleLength ?? DEFAULT_CYCLE_LENGTH;
  const defaultPeriod = options.defaultPeriodLength ?? DEFAULT_PERIOD_LENGTH;
  const isPerimenopause = options.lifeMode === 'perimenopause';
  const sigmaFloor = isPerimenopause ? 6 : 1;

  const lengths = cycleLengthsFromStarts(starts);
  const lastStart = starts[starts.length - 1];

  let cycleLength: number;
  let cycleSigma: number;
  let isDefault = false;

  if (lengths.length === 0) {
    cycleLength = defaultCycle;
    cycleSigma = isPerimenopause ? Math.max(DEFAULT_SIGMA, 7) : DEFAULT_SIGMA;
    isDefault = true;
  } else {
    const m = weightedMean(lengths);
    const v = lengths.length >= 2 ? weightedVariance(lengths, m) : DEFAULT_SIGMA * DEFAULT_SIGMA;
    cycleLength = Math.round(m);
    cycleSigma = Math.max(sigmaFloor, Math.sqrt(v));
  }

  const periodLengths = (history.periodLengths ?? []).filter((n) => n >= 1 && n <= 14);
  const periodLength =
    periodLengths.length > 0
      ? Math.max(1, Math.round(weightedMean(periodLengths)))
      : defaultPeriod;

  const expectedStart = addDaysISO(lastStart, cycleLength);
  const expectedEnd = addDaysISO(expectedStart, Math.max(0, periodLength - 1));
  const halfBand = Math.round(Z_80 * cycleSigma);
  const confidenceLow = addDaysISO(expectedStart, -halfBand);
  const confidenceHigh = addDaysISO(expectedStart, halfBand);

  return {
    expectedStart,
    expectedEnd,
    confidenceLow,
    confidenceHigh,
    cycleLength,
    periodLength,
    cycleSigma,
    samplesUsed: lengths.length,
    isDefault,
  };
}

/**
 * Compute the cycle day (1-based) for `today`, given the most recent period start.
 * Returns null if `lastStart` is in the future or unknown.
 */
export function cycleDay(lastStart: ISODate | null | undefined, today: ISODate): number | null {
  if (!lastStart) return null;
  const d = diffDays(today, lastStart);
  if (d < 0) return null;
  return d + 1;
}
