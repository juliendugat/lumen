import { describe, expect, it } from 'vitest';
import { predictNext } from './predict';
import { addDaysISO } from './dates';

describe('predictNext — life-mode handling', () => {
  it('returns null in pregnant mode regardless of history', () => {
    const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
    expect(predictNext({ startDates: starts }, { lifeMode: 'pregnant' })).toBeNull();
    expect(predictNext({ startDates: ['2026-01-01'] }, { lifeMode: 'pregnant' })).toBeNull();
    expect(predictNext({ startDates: [] }, { lifeMode: 'pregnant' })).toBeNull();
  });

  it('returns null in postpartum mode regardless of history', () => {
    const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
    expect(predictNext({ startDates: starts }, { lifeMode: 'postpartum' })).toBeNull();
    expect(predictNext({ startDates: [] }, { lifeMode: 'postpartum' })).toBeNull();
  });

  it('produces wider band in perimenopausal vs cycling for the same regular history', () => {
    const start = '2026-01-01';
    const starts = [start, addDaysISO(start, 28), addDaysISO(start, 56), addDaysISO(start, 84)];
    const cycling = predictNext({ startDates: starts }, { lifeMode: 'cycling' })!;
    const peri = predictNext({ startDates: starts }, { lifeMode: 'perimenopausal' })!;
    expect(peri.cycleSigma).toBeGreaterThan(cycling.cycleSigma);
  });
});
