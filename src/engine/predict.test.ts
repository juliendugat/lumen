import { describe, expect, it } from 'vitest';
import { addDaysISO, toISO } from './dates';
import {
  cycleLengthsFromStarts,
  cycleDay,
  predictNext,
  weightedMean,
  weightedVariance,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
} from './predict';

const ANCHOR = '2026-01-01';

function generateStarts(lengths: number[], anchor = ANCHOR): string[] {
  const out: string[] = [anchor];
  let cur = anchor;
  for (const l of lengths) {
    cur = addDaysISO(cur, l);
    out.push(cur);
  }
  return out;
}

describe('cycleLengthsFromStarts', () => {
  it('returns deltas in order', () => {
    expect(cycleLengthsFromStarts(generateStarts([28, 29, 27]))).toEqual([28, 29, 27]);
  });

  it('filters implausibly short cycles', () => {
    expect(cycleLengthsFromStarts(generateStarts([28, 5, 28]))).toEqual([28, 28]);
  });

  it('filters implausibly long cycles', () => {
    expect(cycleLengthsFromStarts(generateStarts([28, 90, 28]))).toEqual([28, 28]);
  });

  it('returns empty for fewer than 2 starts', () => {
    expect(cycleLengthsFromStarts([])).toEqual([]);
    expect(cycleLengthsFromStarts(['2026-01-01'])).toEqual([]);
  });
});

describe('weightedMean / weightedVariance', () => {
  it('weighted mean equals arithmetic mean for identical samples', () => {
    expect(weightedMean([28, 28, 28])).toBeCloseTo(28, 6);
  });

  it('weights more recent samples more heavily', () => {
    // older 28, newer 30 — recency weighted should be > 29
    expect(weightedMean([28, 30])).toBeGreaterThan(29);
  });

  it('weighted variance is zero for identical samples', () => {
    expect(weightedVariance([28, 28, 28], 28)).toBeCloseTo(0, 6);
  });
});

describe('predictNext — cold start', () => {
  it('returns null on empty history', () => {
    expect(predictNext({ startDates: [] })).toBeNull();
  });

  it('falls back to defaults with a single cycle', () => {
    const p = predictNext({ startDates: ['2026-01-01'] })!;
    expect(p.cycleLength).toBe(DEFAULT_CYCLE_LENGTH);
    expect(p.periodLength).toBe(DEFAULT_PERIOD_LENGTH);
    expect(p.isDefault).toBe(true);
    expect(p.expectedStart).toBe('2026-01-29');
  });

  it('uses overrides when provided', () => {
    const p = predictNext(
      { startDates: ['2026-01-01'] },
      { defaultCycleLength: 30, defaultPeriodLength: 6 },
    )!;
    expect(p.cycleLength).toBe(30);
    expect(p.periodLength).toBe(6);
    expect(p.expectedStart).toBe('2026-01-31');
  });
});

describe('predictNext — with history', () => {
  it('predicts based on recent cycle lengths', () => {
    const starts = generateStarts([28, 28, 28, 28]);
    const p = predictNext({ startDates: starts })!;
    expect(p.cycleLength).toBe(28);
    expect(p.isDefault).toBe(false);
    expect(p.samplesUsed).toBe(4);
    // Tight band when σ ≈ 0
    expect(p.cycleSigma).toBeLessThanOrEqual(1.0001);
  });

  it('produces a wider band when cycles are irregular', () => {
    const regular = predictNext({ startDates: generateStarts([28, 28, 28, 28]) })!;
    const irregular = predictNext({ startDates: generateStarts([24, 32, 26, 34]) })!;
    expect(irregular.cycleSigma).toBeGreaterThan(regular.cycleSigma);
  });

  it('confidence band straddles expected start', () => {
    const p = predictNext({ startDates: generateStarts([28, 30, 27, 29]) })!;
    expect(p.confidenceLow <= p.expectedStart).toBe(true);
    expect(p.confidenceHigh >= p.expectedStart).toBe(true);
  });

  it('uses period length history when supplied', () => {
    const p = predictNext({
      startDates: generateStarts([28, 28, 28]),
      periodLengths: [4, 4, 4],
    })!;
    expect(p.periodLength).toBe(4);
  });
});

describe('cycleDay', () => {
  it('day 1 on the start date', () => {
    expect(cycleDay('2026-01-15', '2026-01-15')).toBe(1);
  });

  it('day 7 a week in', () => {
    expect(cycleDay('2026-01-15', '2026-01-21')).toBe(7);
  });

  it('null when start is in the future', () => {
    expect(cycleDay('2026-01-20', '2026-01-15')).toBeNull();
  });

  it('null when no start known', () => {
    expect(cycleDay(null, '2026-01-15')).toBeNull();
  });
});

describe('predictNext — accuracy harness', () => {
  /**
   * Synthetic-cycle generator. Each cycle length drawn from N(mu, sigma),
   * rounded. Returns {history, futureActuals} so we can simulate predicting
   * at each step and compute MAE.
   */
  function gaussian(mu: number, sigma: number, rng: () => number): number {
    // Box–Muller
    const u1 = Math.max(rng(), 1e-9);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mu + z * sigma;
  }
  function seededRng(seed: number) {
    let s = seed >>> 0;
    return () => {
      // mulberry32
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function simulate(mu: number, sigma: number, n: number, seed: number) {
    const rng = seededRng(seed);
    const lengths: number[] = [];
    for (let i = 0; i < n; i++) {
      const l = Math.round(gaussian(mu, sigma, rng));
      lengths.push(Math.max(20, Math.min(45, l)));
    }
    return generateStarts(lengths);
  }

  it('regular cycles (μ=28, σ=1.5) achieves MAE ≤ 1.5 days at 12 history points', () => {
    let totalErr = 0;
    let count = 0;
    let inBand = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const starts = simulate(28, 1.5, 24, seed);
      // predict from 12 history → check against actual cycle 13
      for (let split = 12; split < 23; split++) {
        const history = starts.slice(0, split + 1);
        const actual = starts[split + 1];
        const p = predictNext({ startDates: history })!;
        const err = Math.abs(
          (Date.parse(actual) - Date.parse(p.expectedStart)) / 86_400_000,
        );
        totalErr += err;
        count++;
        if (actual >= p.confidenceLow && actual <= p.confidenceHigh) inBand++;
      }
    }
    const mae = totalErr / count;
    const coverage = inBand / count;
    expect(mae).toBeLessThanOrEqual(1.5);
    expect(coverage).toBeGreaterThanOrEqual(0.75); // ~80% target
  });
});

it('toISO is stable', () => {
  expect(toISO(new Date('2026-01-15T12:00:00Z'))).toMatch(/^2026-01-1[45]$/);
});
