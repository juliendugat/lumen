/**
 * Map a cycle day (1-based) to the named phase + a normalized [0,1] position.
 * Used by the dot-strip and any phase-color rendering.
 *
 * Phase boundaries (using a 28-day standard cycle):
 *   period      ─ days 1..periodLength
 *   follicular  ─ end of period .. fertile.start - 1
 *   ovulation   ─ fertile.peak (single day, but we treat the window as ovulation)
 *   fertile     ─ overlaps with follicular tail + ovulation + luteal head
 *   luteal      ─ fertile.end + 1 .. cycleLength
 */

export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal';

export type PhaseInfo = {
  phase: CyclePhase;
  /** True if this day is inside the fertile window (overrides phase color in some UI). */
  fertile: boolean;
  /** True if this is the peak (ovulation day). */
  peak: boolean;
};

export type PhaseInput = {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  fertileStart: number;
  fertileEnd: number;
  fertilePeak: number;
};

export function phaseForDay(d: number, p: PhaseInput): PhaseInfo {
  const fertile = d >= p.fertileStart && d <= p.fertileEnd;
  const peak = d === p.fertilePeak;
  let phase: CyclePhase;
  if (d <= p.periodLength) phase = 'period';
  else if (peak) phase = 'ovulation';
  else if (d < p.fertilePeak) phase = 'follicular';
  else phase = 'luteal';
  return { phase, fertile, peak };
}

/**
 * Build a list of phase info for cycle days [1..length], ready for the dot-strip.
 */
export function buildPhaseStrip(p: Omit<PhaseInput, 'cycleDay'>): PhaseInfo[] {
  const days: PhaseInfo[] = [];
  const len = Math.max(1, Math.min(60, Math.round(p.cycleLength)));
  for (let d = 1; d <= len; d++) {
    days.push(phaseForDay(d, { ...p, cycleDay: d }));
  }
  return days;
}

/** Convenience: derive fertile-day numbers from an estimated window relative to cycle start. */
export function phaseDefaultsFor(cycleLength: number, periodLength: number) {
  // Standard luteal-phase assumption: ovulation at length-14, fertile window
  // is the 5-day pre-ovulation lead + day of ovulation + 1 day after.
  const peak = Math.max(periodLength + 1, cycleLength - 14);
  const start = Math.max(periodLength + 1, peak - 5);
  const end = Math.min(cycleLength, peak + 1);
  return {
    cycleLength,
    periodLength,
    fertileStart: start,
    fertileEnd: end,
    fertilePeak: peak,
  };
}
