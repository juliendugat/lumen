import { describe, expect, it } from 'vitest';
import { generateIcs } from '../lib/ics';

describe('generateIcs', () => {
  it('produces a valid VCALENDAR envelope', () => {
    const out = generateIcs([
      {
        predictedStart: '2026-05-15',
        predictedEnd: '2026-05-19',
        confidenceLow: '2026-05-13',
        confidenceHigh: '2026-05-17',
      },
    ]);
    expect(out).toMatch(/^BEGIN:VCALENDAR/);
    expect(out).toMatch(/END:VCALENDAR$/);
    expect(out).toMatch(/VERSION:2\.0/);
  });

  it('includes period event with correct dates', () => {
    const out = generateIcs([
      {
        predictedStart: '2026-05-15',
        predictedEnd: '2026-05-19',
        confidenceLow: '2026-05-13',
        confidenceHigh: '2026-05-17',
      },
    ]);
    expect(out).toContain('DTSTART;VALUE=DATE:20260515');
    expect(out).toContain('DTEND;VALUE=DATE:20260520'); // exclusive
    expect(out).toContain('SUMMARY:Period (predicted)');
  });

  it('includes fertile window when provided', () => {
    const out = generateIcs([
      {
        predictedStart: '2026-05-15',
        predictedEnd: '2026-05-19',
        confidenceLow: '2026-05-13',
        confidenceHigh: '2026-05-17',
        fertileStart: '2026-04-26',
        fertileEnd: '2026-05-04',
      },
    ]);
    expect(out).toContain('SUMMARY:Fertile window (estimate)');
  });

  it('events are stable on re-export (same UID)', () => {
    const a = generateIcs([
      {
        predictedStart: '2026-05-15',
        predictedEnd: '2026-05-19',
        confidenceLow: '2026-05-13',
        confidenceHigh: '2026-05-17',
      },
    ]);
    const b = generateIcs([
      {
        predictedStart: '2026-05-15',
        predictedEnd: '2026-05-19',
        confidenceLow: '2026-05-13',
        confidenceHigh: '2026-05-17',
      },
    ]);
    expect(a).toBe(b);
  });
});
