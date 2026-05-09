import { describe, expect, it } from 'vitest';
import { predictNext } from './predict';
import { addDaysISO } from './dates';

describe('predictNext — life-mode handling', () => {
  it('returns null in pregnancy mode regardless of history', () => {
    const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
    expect(predictNext({ startDates: starts }, { lifeMode: 'pregnancy' })).toBeNull();
    expect(predictNext({ startDates: ['2026-01-01'] }, { lifeMode: 'pregnancy' })).toBeNull();
    expect(predictNext({ startDates: [] }, { lifeMode: 'pregnancy' })).toBeNull();
  });

  it('produces wider band in perimenopause vs standard for the same regular history', () => {
    const start = '2026-01-01';
    const starts = [start, addDaysISO(start, 28), addDaysISO(start, 56), addDaysISO(start, 84)];
    const standard = predictNext({ startDates: starts }, { lifeMode: 'standard' })!;
    const peri = predictNext({ startDates: starts }, { lifeMode: 'perimenopause' })!;
    expect(peri.cycleSigma).toBeGreaterThan(standard.cycleSigma);
  });

  it('teen mode behaves like standard for predictions (only copy differs)', () => {
    const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
    const teen = predictNext({ startDates: starts }, { lifeMode: 'teen' })!;
    const standard = predictNext({ startDates: starts }, { lifeMode: 'standard' })!;
    expect(teen.expectedStart).toBe(standard.expectedStart);
    expect(teen.cycleLength).toBe(standard.cycleLength);
  });
});
