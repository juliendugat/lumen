import { addDaysISO, type ISODate } from './dates';

export type FertileWindow = {
  /** First day of estimated fertile window (inclusive). */
  start: ISODate;
  /** Last day of estimated fertile window (inclusive). */
  end: ISODate;
  /** Most likely ovulation day (centre of the window). */
  peak: ISODate;
};

/**
 * Estimate the fertile window for a cycle whose next predicted start is `nextStart`.
 *
 * Uses the standard luteal-phase assumption: ovulation ≈ 14 days before next period,
 * with a sperm-survival window of ~5 days before and 1 day after ovulation.
 *
 * This is an estimate, NOT contraception — the UI must communicate that.
 */
export function estimateFertileWindow(nextStart: ISODate): FertileWindow {
  const peak = addDaysISO(nextStart, -14);
  return {
    start: addDaysISO(nextStart, -19),
    end: addDaysISO(nextStart, -11),
    peak,
  };
}
