import { describe, expect, it } from 'vitest';
import { computeSymptomTrends, computeMoodShare, computePerCycleStats } from './trends';
import { addDaysISO } from './dates';

describe('computeSymptomTrends', () => {
  it('finds a hotspot when symptom clusters in early cycle', () => {
    const start = '2026-01-01';
    const days = [
      { date: start, cycleStart: start, symptoms: ['Cramps'] },
      { date: addDaysISO(start, 1), cycleStart: start, symptoms: ['Cramps'] },
      { date: addDaysISO(start, 2), cycleStart: start, symptoms: ['Cramps'] },
      { date: addDaysISO(start, 14), cycleStart: start, symptoms: ['Headache'] },
    ];
    const trends = computeSymptomTrends(days);
    const cramps = trends.find((t) => t.symptom === 'Cramps');
    expect(cramps).toBeDefined();
    expect(cramps!.totalOccurrences).toBe(3);
    expect(cramps!.hotspot!.startDay).toBeLessThanOrEqual(3);
  });

  it('skips symptoms with fewer than 3 occurrences', () => {
    const start = '2026-01-01';
    const days = [
      { date: start, cycleStart: start, symptoms: ['Rare'] },
      { date: addDaysISO(start, 1), cycleStart: start, symptoms: ['Rare'] },
    ];
    expect(computeSymptomTrends(days)).toEqual([]);
  });
});

describe('computeMoodShare', () => {
  it('shares sum to <= 1 per mood and ranks by frequency', () => {
    const days = [
      { date: '2026-01-01', moods: ['Happy'] },
      { date: '2026-01-02', moods: ['Happy', 'Calm'] },
      { date: '2026-01-03', moods: ['Anxious'] },
    ];
    const shares = computeMoodShare(days);
    expect(shares[0].mood).toBe('Happy');
    expect(shares[0].share).toBeCloseTo(2 / 3, 6);
  });
});

describe('computePerCycleStats', () => {
  it('computes lengths from consecutive starts', () => {
    const stats = computePerCycleStats(['2026-01-01', '2026-01-29', '2026-02-26'], []);
    expect(stats[0].cycleLength).toBe(28);
    expect(stats[1].cycleLength).toBe(28);
    expect(stats[2].cycleLength).toBeNull(); // most recent / open
  });
});
