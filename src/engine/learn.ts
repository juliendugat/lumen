import { diffDays, type ISODate } from './dates';

export type PredictionRecord = {
  predictedStart: ISODate;
  actualStart: ISODate;
  errorDays: number;
};

/**
 * Compute prediction error in days. Positive = period was late vs predicted.
 */
export function predictionError(predictedStart: ISODate, actualStart: ISODate): number {
  return diffDays(actualStart, predictedStart);
}

/**
 * Adjust predicted-cycle σ given recent prediction errors. Used when the
 * prediction was made and we now know the actual; the engine widens or
 * tightens the band the next time around based on these residuals.
 *
 * We use the larger of (cycle-length-derived σ) and (residual σ), so that
 * the band never shrinks below what the user's actual mis-predictions warrant.
 */
export function residualSigma(records: PredictionRecord[]): number {
  if (records.length < 2) return NaN;
  const recent = records.slice(-12); // last ~12 cycles
  let sumSq = 0;
  for (const r of recent) sumSq += r.errorDays * r.errorDays;
  return Math.sqrt(sumSq / recent.length);
}

/**
 * Combine model σ from cycle-length variance with residual σ from past
 * prediction errors. Take the max so the band genuinely reflects how
 * wrong we've been, not just how variable cycles look in isolation.
 */
export function effectiveSigma(modelSigma: number, residuals: PredictionRecord[]): number {
  const r = residualSigma(residuals);
  if (Number.isNaN(r)) return modelSigma;
  return Math.max(modelSigma, r);
}
