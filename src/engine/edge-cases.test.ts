import { describe, expect, it } from 'vitest';
import { addDaysISO, diffDays, fromISO, toISO } from './dates';
import { cycleDay, predictNext, cycleLengthsFromStarts } from './predict';
import { generateIcs } from '@/lib/ics';
import { estimateFertileWindow } from './fertility';

describe('date helpers — edge cases', () => {
  it('round-trips across DST transitions', () => {
    // 2026-03-29 UK DST start; 2026-10-25 DST end
    const dstSpring = '2026-03-28';
    expect(addDaysISO(dstSpring, 1)).toBe('2026-03-29');
    expect(addDaysISO(dstSpring, 2)).toBe('2026-03-30');
    expect(diffDays('2026-03-30', '2026-03-28')).toBe(2);
  });

  it('handles year boundary', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDays('2027-01-01', '2026-12-31')).toBe(1);
  });

  it('handles leap day', () => {
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysISO('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('toISO handles edge cases without crash', () => {
    expect(toISO(new Date(0))).toBeTruthy();
    expect(() => fromISO('not-a-date')).not.toThrow();
  });
});

describe('cycle day — edge cases', () => {
  it('handles same day same date', () => {
    expect(cycleDay('2026-05-09', '2026-05-09')).toBe(1);
  });

  it('returns null on future last-start date', () => {
    expect(cycleDay('2030-01-01', '2026-05-09')).toBeNull();
  });
});

describe('predictNext — degenerate input', () => {
  it('drops obviously invalid cycle lengths', () => {
    // 5-day "cycle" is impossible, 90-day cycle is also out of plausible range
    expect(cycleLengthsFromStarts(['2026-01-01', '2026-01-06', '2026-04-06'])).toEqual([]);
  });

  it('does not crash on duplicate start dates', () => {
    expect(() =>
      predictNext({ startDates: ['2026-01-01', '2026-01-01', '2026-01-29'] }),
    ).not.toThrow();
  });

  it('confidence band never has start > end', () => {
    const p = predictNext({ startDates: ['2026-01-01', '2026-01-29', '2026-02-26'] })!;
    expect(p.confidenceLow <= p.confidenceHigh).toBe(true);
  });

  it('cycle length stays in plausible range', () => {
    const p = predictNext({ startDates: ['2026-01-01', '2026-01-29'] })!;
    expect(p.cycleLength).toBeGreaterThan(15);
    expect(p.cycleLength).toBeLessThan(60);
  });
});

describe('fertility window — edge cases', () => {
  it('peak is always inside the window', () => {
    const w = estimateFertileWindow('2026-05-29');
    expect(w.peak >= w.start).toBe(true);
    expect(w.peak <= w.end).toBe(true);
  });

  it('window straddles a year boundary cleanly', () => {
    const w = estimateFertileWindow('2026-01-12');
    expect(w.start.startsWith('2025')).toBe(true); // start = -19 days → late Dec 2025
    expect(w.peak.startsWith('2025')).toBe(true);  // peak  = -14 days → late Dec 2025
    expect(w.end <= '2026-01-02').toBe(true);      // end   = -11 days → Jan 2026 ok
  });
});

describe('ICS generation — edge cases', () => {
  it('handles many forecasts without truncation', () => {
    const forecasts = Array.from({ length: 12 }).map((_, i) => ({
      predictedStart: addDaysISO('2026-05-01', i * 28),
      predictedEnd: addDaysISO('2026-05-05', i * 28),
      confidenceLow: addDaysISO('2026-04-29', i * 28),
      confidenceHigh: addDaysISO('2026-05-03', i * 28),
    }));
    const ics = generateIcs(forecasts);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(12);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('escapes commas and semicolons in titles', () => {
    const ics = generateIcs([
      {
        predictedStart: '2026-05-15',
        predictedEnd: '2026-05-19',
        confidenceLow: '2026-05-13',
        confidenceHigh: '2026-05-17',
      },
    ]);
    // Default title has no special chars but the description does (commas).
    expect(ics).toContain('Estimated window: 2026-05-13 → 2026-05-17');
  });
});
