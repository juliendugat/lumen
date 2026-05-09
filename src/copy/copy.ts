import { type LifeMode } from '@/store/cycle';

/**
 * Tone-aware copy. Returns plain strings for the current life-mode + terminology
 * setting. Teen mode uses friendlier, education-first language. Pregnancy and
 * perimenopause modes also adjust framing.
 */

export type Term = 'period' | 'cycle' | 'menstruation';

type Bag = {
  homeKicker: string;
  predictHeadline: (daysUntil: number, label: string) => string;
  fertileLabel: string;
  fertileSub: string;
  emptyHomeBody: string;
  notesPrompt: string;
};

const standard: Bag = {
  homeKicker: 'today',
  predictHeadline: (n, label) =>
    n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`,
  fertileLabel: 'Fertile window (estimate)',
  fertileSub: 'Estimate based on your cycle pattern. Not a contraceptive method.',
  emptyHomeBody:
    "Tap the ring to log today's flow, symptoms, mood, or notes. Your data stays on this device.",
  notesPrompt: 'Anything worth remembering?',
};

const teen: Bag = {
  homeKicker: 'today',
  predictHeadline: (n, _label) =>
    n === 0 ? 'Today, maybe' : n === 1 ? 'Around tomorrow' : `In about ${n} days`,
  fertileLabel: 'Most likely fertile days',
  fertileSub:
    "These are the days a body is most likely to be able to get pregnant. It's an estimate from your pattern — it isn't birth control.",
  emptyHomeBody:
    'Tap the circle to log how today feels — bleeding, pain, mood, or just a note. Nothing leaves this phone.',
  notesPrompt: 'Anything you want to remember about today?',
};

const pregnancy: Bag = {
  ...standard,
  homeKicker: 'pregnancy',
  predictHeadline: () => 'Tracking your pregnancy',
  fertileLabel: 'Cycle predictions paused',
  fertileSub:
    'Period and fertile-window predictions are paused while pregnancy mode is on.',
};

const perimenopause: Bag = {
  ...standard,
  predictHeadline: (n, _label) =>
    n <= 0 ? 'Window has started' : `Roughly in ${n} days`,
  fertileSub:
    'Cycle variability rises in perimenopause — windows are wider and predictions are best-effort.',
};

export function getCopy(mode: LifeMode): Bag {
  switch (mode) {
    case 'teen':
      return teen;
    case 'pregnancy':
      return pregnancy;
    case 'perimenopause':
      return perimenopause;
    default:
      return standard;
  }
}

export function termPlural(term: Term): string {
  switch (term) {
    case 'period':
      return 'periods';
    case 'cycle':
      return 'cycles';
    case 'menstruation':
      return 'menstrual periods';
  }
}
