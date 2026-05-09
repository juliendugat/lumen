import { describe, expect, it } from 'vitest';
import { effectiveSigma, predictionError, residualSigma } from './learn';

describe('predictionError', () => {
  it('positive when actual is later than predicted', () => {
    expect(predictionError('2026-01-29', '2026-02-01')).toBe(3);
  });

  it('negative when actual is earlier', () => {
    expect(predictionError('2026-01-29', '2026-01-26')).toBe(-3);
  });
});

describe('residualSigma', () => {
  it('NaN with fewer than 2 records', () => {
    expect(residualSigma([])).toBeNaN();
    expect(
      residualSigma([{ predictedStart: '2026-01-01', actualStart: '2026-01-02', errorDays: 1 }]),
    ).toBeNaN();
  });

  it('zero when all errors are zero', () => {
    const r = residualSigma([
      { predictedStart: 'a', actualStart: 'a', errorDays: 0 },
      { predictedStart: 'a', actualStart: 'a', errorDays: 0 },
    ]);
    expect(r).toBe(0);
  });
});

describe('effectiveSigma', () => {
  it('returns model sigma when no residuals', () => {
    expect(effectiveSigma(2.5, [])).toBe(2.5);
  });

  it('takes max of model and residual sigma', () => {
    const records = Array.from({ length: 4 }).map((_, i) => ({
      predictedStart: 'a',
      actualStart: 'b',
      errorDays: i % 2 === 0 ? 4 : -4,
    }));
    // residual σ ≈ 4
    expect(effectiveSigma(1, records)).toBeCloseTo(4, 1);
    expect(effectiveSigma(5, records)).toBe(5);
  });
});
