import { type LifeMode, type Voice } from '@/store/cycle';

/**
 * Tone-aware copy. Two axes from the UX-review Mode redesign:
 *  - lifeMode (engine): cycling / pregnant / perimenopausal / postpartum
 *  - voice    (copy)  : adult / teen / clinical
 *
 * Voice wins on tone; lifeMode wins on framing.
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

const adultCycling: Bag = {
  homeKicker: 'today',
  predictHeadline: (n) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`),
  fertileLabel: 'Fertile window (estimate)',
  fertileSub: 'Estimate based on your cycle pattern. Not a contraceptive method.',
  emptyHomeBody:
    "Tap the ring to log today's flow, symptoms, mood, or notes. Your data stays on this device.",
  notesPrompt: 'Anything worth remembering?',
};

const teenCycling: Bag = {
  homeKicker: 'today',
  predictHeadline: (n) =>
    n === 0 ? 'Today, maybe' : n === 1 ? 'Around tomorrow' : `In about ${n} days`,
  fertileLabel: 'Most likely fertile days',
  fertileSub:
    "These are the days a body is most likely to be able to get pregnant. It's an estimate from your pattern — it isn't birth control.",
  emptyHomeBody:
    'Tap the circle to log how today feels — bleeding, pain, mood, or just a note. Nothing leaves this phone.',
  notesPrompt: 'Anything you want to remember about today?',
};

const clinicalCycling: Bag = {
  homeKicker: 'today',
  predictHeadline: (n) =>
    n === 0 ? 'Expected today' : n === 1 ? 'Expected tomorrow' : `Expected in ${n} days`,
  fertileLabel: 'Estimated fertile window',
  fertileSub:
    'Computed from the recency-weighted cycle mean. Estimate, not a contraceptive method.',
  emptyHomeBody:
    "Log today's flow, symptoms, BBT, mucus, or notes. Data is stored locally only.",
  notesPrompt: 'Notes for this day:',
};

const pregnancy: Bag = {
  ...adultCycling,
  homeKicker: 'pregnancy',
  predictHeadline: () => 'Tracking your pregnancy',
  fertileLabel: 'Cycle predictions paused',
  fertileSub:
    'Period and fertile-window predictions are paused while pregnancy mode is on.',
};

const postpartum: Bag = {
  ...adultCycling,
  homeKicker: 'postpartum',
  predictHeadline: () => 'Postpartum',
  fertileLabel: 'Cycle predictions paused',
  fertileSub:
    'Cycles return on their own schedule after birth. Predictions resume once Lumen has logged data.',
};

const perimenopausal: Bag = {
  ...adultCycling,
  predictHeadline: (n) => (n <= 0 ? 'Window has started' : `Roughly in ${n} days`),
  fertileSub:
    'Cycle variability rises in perimenopause — windows are wider and predictions are best-effort.',
};

/**
 * Returns the right copy bundle for the active life-mode + voice combination.
 * Pregnancy/perimenopausal/postpartum bundles inherit the active voice's
 * cycling bundle as a base, so a clinical pregnancy still reads clinical.
 */
export function getCopy(lifeMode: LifeMode, voice: Voice = 'adult'): Bag {
  switch (lifeMode) {
    case 'pregnant':
      return { ...pickCycling(voice), ...pregnancy };
    case 'postpartum':
      return { ...pickCycling(voice), ...postpartum };
    case 'perimenopausal':
      return { ...pickCycling(voice), ...perimenopausal };
    case 'cycling':
    default:
      return pickCycling(voice);
  }
}

function pickCycling(voice: Voice): Bag {
  switch (voice) {
    case 'teen':
      return teenCycling;
    case 'clinical':
      return clinicalCycling;
    default:
      return adultCycling;
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

/** Voice → user-visible default term. Used when no explicit term override exists. */
export function termForVoice(voice: Voice): Term {
  return voice === 'clinical' ? 'menstruation' : 'period';
}
