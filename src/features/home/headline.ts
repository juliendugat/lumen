import { diffDays, fromISO, todayISO, type ISODate } from '@/engine/dates';
import type { Prediction } from '@/engine/predict';

export type HomeState =
  | { kind: 'no-data' }
  | { kind: 'period'; dayInPeriod: number; periodLength: number }
  | { kind: 'late'; daysLate: number }
  | { kind: 'expected-soon'; daysUntil: number; expectedDate: ISODate }
  | { kind: 'fertile'; daysToPeak: number }
  | { kind: 'follicular'; cycleDay: number }
  | { kind: 'luteal'; cycleDay: number };

export type HomeStateInput = {
  cycleDay: number | null;
  prediction: Prediction | null;
  fertile: { start: ISODate; end: ISODate; peak: ISODate } | null;
  todayIso: ISODate;
};

/**
 * Decide which "state" we're in and surface a single dominant headline. Mirrors
 * how Flo/Clue lead with one strong message ("Late for 4 days", "11 days
 * until your next period", "Day 15 — Fertile window").
 */
export function deriveHomeState(p: HomeStateInput): HomeState {
  if (!p.cycleDay) return { kind: 'no-data' };

  const periodLength = p.prediction?.periodLength ?? 5;

  // Inside the current period
  if (p.cycleDay <= periodLength) {
    return { kind: 'period', dayInPeriod: p.cycleDay, periodLength };
  }

  // Late?
  if (p.prediction) {
    const days = diffDays(p.todayIso, p.prediction.expectedStart);
    if (days > 0) {
      return { kind: 'late', daysLate: days };
    }
  }

  // Expected soon (within 5 days)
  if (p.prediction) {
    const days = diffDays(p.prediction.expectedStart, p.todayIso);
    if (days >= 0 && days <= 5) {
      return { kind: 'expected-soon', daysUntil: days, expectedDate: p.prediction.expectedStart };
    }
  }

  // Inside the fertile window?
  if (p.fertile && p.todayIso >= p.fertile.start && p.todayIso <= p.fertile.end) {
    const daysToPeak = diffDays(p.fertile.peak, p.todayIso);
    return { kind: 'fertile', daysToPeak };
  }

  // Pre-ovulation (follicular) or post-ovulation (luteal)?
  if (p.fertile && p.todayIso < p.fertile.start) {
    return { kind: 'follicular', cycleDay: p.cycleDay };
  }
  return { kind: 'luteal', cycleDay: p.cycleDay };
}

export type HomeHeadline = {
  kicker: string;
  big: string;
  sub: string;
  /** When non-null, shown as an inline learn-more link beneath the headline. */
  learn?: { label: string; articleId: string };
};

export function headlineFor(state: HomeState): HomeHeadline {
  switch (state.kind) {
    case 'no-data':
      return {
        kicker: 'WELCOME',
        big: 'Log your first period',
        sub: 'Tap the ring or pick a day above to start tracking.',
      };
    case 'period':
      return {
        kicker: 'PERIOD',
        big: `Day ${state.dayInPeriod}`,
        sub: `Of your period · about ${state.periodLength} days total.`,
        learn: { label: 'Why cramps happen', articleId: 'cramps' },
      };
    case 'late':
      return {
        kicker: 'LATE',
        big: `${state.daysLate} ${state.daysLate === 1 ? 'day' : 'days'}`,
        sub: 'Past your expected start. Stress, sleep, and travel can shift it.',
        learn: { label: 'When a period is late', articleId: 'late-period' },
      };
    case 'expected-soon':
      if (state.daysUntil === 0) {
        return {
          kicker: 'EXPECTED',
          big: 'Today',
          sub: 'Your period is most likely to start today.',
        };
      }
      if (state.daysUntil === 1) {
        return {
          kicker: 'EXPECTED',
          big: 'Tomorrow',
          sub: 'Your period is most likely to start tomorrow.',
        };
      }
      return {
        kicker: 'NEXT PERIOD',
        big: `In ${state.daysUntil} days`,
        sub: `Most likely around ${humanDay(state.expectedDate)}.`,
      };
    case 'fertile':
      if (state.daysToPeak === 0) {
        return {
          kicker: 'OVULATION',
          big: 'Peak day',
          sub: 'Estimated peak fertility today. Estimate, not contraception.',
          learn: { label: 'Read about ovulation', articleId: 'ovulation' },
        };
      }
      if (state.daysToPeak > 0) {
        return {
          kicker: 'FERTILE WINDOW',
          big: `Peak in ${state.daysToPeak} ${state.daysToPeak === 1 ? 'day' : 'days'}`,
          sub: 'Estimated fertile window. Estimate, not contraception.',
          learn: { label: 'About the fertile window', articleId: 'fertile-window' },
        };
      }
      return {
        kicker: 'FERTILE WINDOW',
        big: 'Closing',
        sub: 'Past peak. Window is winding down.',
        learn: { label: 'About the luteal phase', articleId: 'luteal' },
      };
    case 'follicular':
      return {
        kicker: 'FOLLICULAR',
        big: `Day ${state.cycleDay}`,
        sub: 'Body building energy toward ovulation.',
        learn: { label: 'About the follicular phase', articleId: 'follicular' },
      };
    case 'luteal':
      return {
        kicker: 'LUTEAL',
        big: `Day ${state.cycleDay}`,
        sub: 'Post-ovulation phase. PMS-y feelings can show here.',
        learn: { label: 'About the luteal phase', articleId: 'luteal' },
      };
  }
}

function humanDay(iso: ISODate): string {
  return fromISO(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/** Reinforcing message strung onto Insights; intentionally calm, not effusive. */
export function reinforcing(stat: { variation?: number; cycles?: number }): string | null {
  if ((stat.cycles ?? 0) < 2) return null;
  const v = stat.variation ?? 0;
  if (v <= 1) return 'Your rhythm is remarkable.';
  if (v <= 3) return 'Your rhythm is steady.';
  if (v <= 6) return 'A bit variable, which is normal.';
  return 'Cycles vary a fair bit — patterns may emerge over time.';
}

/** Tracker for non-trivial dates: ensure todayISO() round-trips through fromISO. */
export function _smokeRoundTrip(): boolean {
  const t = todayISO();
  return fromISO(t).toISOString().slice(0, 10) === t;
}
