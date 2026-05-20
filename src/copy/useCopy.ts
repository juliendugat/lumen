import { useCycle, type LifeMode, type Voice } from '@/store/cycle';
import { getCopy, termForVoice, termPlural, type Term } from './copy';

/**
 * Reads the active life-mode + voice from settings and returns the matching
 * copy bundle plus the user-facing term ("period" vs clinical "menstruation").
 *
 * This is the single bridge between the Voice setting and the UI — components
 * call `useCopy()` instead of hardcoding "Period" so switching to Clinical
 * actually changes terminology. `Term`/`TermPlural` are capitalised for use at
 * the start of a label (e.g. "Menstruation (logged)").
 */
export function useCopy(): {
  copy: ReturnType<typeof getCopy>;
  voice: Voice;
  lifeMode: LifeMode;
  term: Term;
  termPlural: string;
  Term: string;
  TermPlural: string;
} {
  const settings = useCycle((s) => s.settings);
  const lifeMode = (settings?.lifeMode ?? 'cycling') as LifeMode;
  const voice = (settings?.voice ?? 'adult') as Voice;
  const copy = getCopy(lifeMode, voice);
  const term = termForVoice(voice);
  const plural = termPlural(term);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    copy,
    voice,
    lifeMode,
    term,
    termPlural: plural,
    Term: cap(term),
    TermPlural: cap(plural),
  };
}
