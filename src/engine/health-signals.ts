import { diffDays, type ISODate } from './dates';

/**
 * Estimate "chance of pregnancy" from cycle position. Returns a coarse band,
 * NEVER a precise probability — Lumen is not a contraceptive. The UI must
 * always pair this with the "estimate, not contraception" disclaimer.
 *
 * Bands:
 *  - 'high'    : within ±2 days of estimated peak
 *  - 'moderate': inside the wider fertile window (peak −5 .. peak +1)
 *  - 'low'     : outside the fertile window
 *  - 'unknown' : no fertile window estimate available
 */
export type PregnancyChance = 'low' | 'moderate' | 'high' | 'unknown';

export function pregnancyChance(today: ISODate, fertile: { start: ISODate; end: ISODate; peak: ISODate } | null): PregnancyChance {
  if (!fertile) return 'unknown';
  const distFromPeak = Math.abs(diffDays(today, fertile.peak));
  if (today >= fertile.start && today <= fertile.end) {
    if (distFromPeak <= 2) return 'high';
    return 'moderate';
  }
  return 'low';
}

/**
 * Determine whether a cycle's variation crosses an "atypical" threshold.
 * Mirrors Clue's surfacing of an "atypical" flag in their analysis screen.
 *
 * Thresholds were chosen conservatively — we should not alarm a user about
 * normal variation. From clinical references:
 *  - Variation < 5 days within 6 months: very stable
 *  - 5-9 days: typical for healthy adults
 *  - 9+ days: worth a conversation with a doctor (we surface it)
 */
export type VariationLevel = 'stable' | 'typical' | 'atypical';

export function classifyVariation(cycleLengthsLastN: number[]): VariationLevel {
  if (cycleLengthsLastN.length < 3) return 'typical';
  const min = Math.min(...cycleLengthsLastN);
  const max = Math.max(...cycleLengthsLastN);
  const range = max - min;
  if (range < 5) return 'stable';
  if (range < 9) return 'typical';
  return 'atypical';
}

/**
 * User-facing copy for variation level. Never alarming, never instructive
 * beyond "worth mentioning to a doctor". Lumen is not a diagnostic tool.
 */
export function variationCopy(level: VariationLevel): {
  title: string;
  body: string;
} {
  switch (level) {
    case 'stable':
      return {
        title: 'Stable rhythm',
        body: 'Your cycle lengths cluster tightly — the prediction band is narrow.',
      };
    case 'typical':
      return {
        title: 'Typical variation',
        body: 'Cycles vary by a handful of days, which is normal for most people.',
      };
    case 'atypical':
      return {
        title: 'Wider variation than usual',
        body: 'Cycles range over more than a week. Stress, sleep, and lifestyle changes can drive this — if it persists, it may be worth mentioning to your doctor.',
      };
  }
}
