import { describe, expect, it } from 'vitest';
import { deriveHomeState, headlineFor, reinforcing } from './headline';

const basePrediction = {
  expectedStart: '2026-06-06',
  expectedEnd: '2026-06-10',
  confidenceLow: '2026-06-04',
  confidenceHigh: '2026-06-08',
  cycleLength: 28,
  periodLength: 5,
  cycleSigma: 1.5,
  samplesUsed: 6,
  isDefault: false,
};

describe('deriveHomeState', () => {
  it('no-data when no cycle has been logged', () => {
    const s = deriveHomeState({
      cycleDay: null,
      prediction: null,
      fertile: null,
      todayIso: '2026-05-09',
    });
    expect(s.kind).toBe('no-data');
  });

  it('period when within periodLength', () => {
    const s = deriveHomeState({
      cycleDay: 3,
      prediction: basePrediction,
      fertile: { start: '2026-05-23', end: '2026-05-31', peak: '2026-05-28' },
      todayIso: '2026-05-09',
    });
    expect(s.kind).toBe('period');
    if (s.kind === 'period') expect(s.dayInPeriod).toBe(3);
  });

  it('fertile when today is in fertile window', () => {
    const s = deriveHomeState({
      cycleDay: 14,
      prediction: basePrediction,
      fertile: { start: '2026-05-23', end: '2026-05-31', peak: '2026-05-28' },
      todayIso: '2026-05-25',
    });
    expect(s.kind).toBe('fertile');
  });

  it('expected-soon when prediction is within 5 days', () => {
    const s = deriveHomeState({
      cycleDay: 26,
      prediction: { ...basePrediction, expectedStart: '2026-06-06' },
      fertile: null,
      todayIso: '2026-06-03',
    });
    expect(s.kind).toBe('expected-soon');
    if (s.kind === 'expected-soon') expect(s.daysUntil).toBe(3);
  });

  it('late when today is past expectedStart', () => {
    const s = deriveHomeState({
      cycleDay: 32,
      prediction: { ...basePrediction, expectedStart: '2026-06-06' },
      fertile: null,
      todayIso: '2026-06-09',
    });
    expect(s.kind).toBe('late');
    if (s.kind === 'late') expect(s.daysLate).toBe(3);
  });
});

describe('headlineFor', () => {
  it('returns sensible big-string for each state', () => {
    expect(headlineFor({ kind: 'no-data' }).big).toMatch(/Log your first/);
    expect(headlineFor({ kind: 'period', dayInPeriod: 2, periodLength: 5 }).big).toMatch(/Day 2/);
    expect(headlineFor({ kind: 'late', daysLate: 4 }).big).toMatch(/4 days/);
    expect(
      headlineFor({ kind: 'expected-soon', daysUntil: 3, expectedDate: '2026-06-06' }).big,
    ).toMatch(/3 days/);
    expect(headlineFor({ kind: 'fertile', daysToPeak: 0 }).big).toMatch(/Peak day/);
    expect(headlineFor({ kind: 'fertile', daysToPeak: 2 }).big).toMatch(/2 days/);
  });

  it('attaches a learn link for states that benefit from explanation', () => {
    expect(headlineFor({ kind: 'period', dayInPeriod: 1, periodLength: 5 }).learn).toBeDefined();
    expect(headlineFor({ kind: 'late', daysLate: 1 }).learn).toBeDefined();
    expect(headlineFor({ kind: 'fertile', daysToPeak: 0 }).learn).toBeDefined();
  });
});

describe('reinforcing', () => {
  it('null when too few cycles', () => {
    expect(reinforcing({ cycles: 1, variation: 0 })).toBeNull();
  });
  it('upbeat when very stable', () => {
    expect(reinforcing({ cycles: 6, variation: 0 })).toMatch(/remarkable/);
  });
  it('honest when very variable', () => {
    expect(reinforcing({ cycles: 6, variation: 10 })).toMatch(/vary/);
  });
});
