/**
 * Configurable home-screen quick-bar.
 *
 * The user can pick which 3-10 chips appear under the cycle ring. Each chip
 * is an "action" defined here. The rest of the app references these by id
 * so adding a chip is just adding an entry below.
 *
 * Note: flow chips are NOT in this list because the home screen always
 * surfaces flow tiles (Spotting/Light/Medium/Heavy) above the quick-bar
 * already. Adding flow as quick-bar chips would just duplicate them.
 */

import { type IconName } from '@/ui/icons/Icon';

export type QuickAction = {
  id: string;
  label: string;
  icon: IconName;
  /** Which kind of editor to launch when tapped. */
  kind: 'symptom' | 'mood' | 'note' | 'bbt' | 'mucus' | 'sex' | 'medication';
  /** For symptom/mood chips, the tag value to toggle on today's day. */
  payload?: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  // Common symptoms
  { id: 'symptom.cramps', label: 'Cramps', icon: 'cramps', kind: 'symptom', payload: 'Cramps' },
  { id: 'symptom.headache', label: 'Headache', icon: 'headache', kind: 'symptom', payload: 'Headache' },
  { id: 'symptom.fatigue', label: 'Fatigue', icon: 'fatigue', kind: 'symptom', payload: 'Fatigue' },
  { id: 'symptom.bloating', label: 'Bloating', icon: 'bloating', kind: 'symptom', payload: 'Bloating' },
  { id: 'symptom.nausea', label: 'Nausea', icon: 'nausea', kind: 'symptom', payload: 'Nausea' },
  { id: 'symptom.acne', label: 'Acne', icon: 'acne', kind: 'symptom', payload: 'Acne' },
  { id: 'symptom.backache', label: 'Backache', icon: 'backache', kind: 'symptom', payload: 'Backache' },
  { id: 'symptom.cravings', label: 'Cravings', icon: 'cravings', kind: 'symptom', payload: 'Cravings' },
  { id: 'symptom.insomnia', label: 'Insomnia', icon: 'insomnia', kind: 'symptom', payload: 'Insomnia' },

  // Moods
  { id: 'mood.happy', label: 'Happy', icon: 'happy', kind: 'mood', payload: 'Happy' },
  { id: 'mood.calm', label: 'Calm', icon: 'calm', kind: 'mood', payload: 'Calm' },
  { id: 'mood.anxious', label: 'Anxious', icon: 'anxious', kind: 'mood', payload: 'Anxious' },
  { id: 'mood.irritable', label: 'Irritable', icon: 'irritable', kind: 'mood', payload: 'Irritable' },
  { id: 'mood.low', label: 'Low', icon: 'low', kind: 'mood', payload: 'Low' },
  { id: 'mood.energetic', label: 'Energetic', icon: 'energetic', kind: 'mood', payload: 'Energetic' },
  { id: 'mood.focused', label: 'Focused', icon: 'focused', kind: 'mood', payload: 'Focused' },

  // Tracking
  { id: 'bbt', label: 'BBT', icon: 'thermometer', kind: 'bbt' },
  { id: 'mucus', label: 'Mucus', icon: 'mucus', kind: 'mucus' },
  { id: 'sex', label: 'Sex', icon: 'heart', kind: 'sex' },
  { id: 'note', label: 'Note', icon: 'note', kind: 'note' },
];

export const DEFAULT_QUICK_BAR = ['symptom.cramps', 'mood.calm', 'note'];

export function parseQuickBar(json: string | null | undefined): string[] {
  if (!json) return DEFAULT_QUICK_BAR;
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return DEFAULT_QUICK_BAR;
    // Drop any ids the catalog no longer recognises (e.g. legacy 'flow.*'
    // entries from earlier builds). Stale ids would otherwise count toward
    // the picked total without being editable.
    const valid = new Set(QUICK_ACTIONS.map((a) => a.id));
    return arr.filter((x): x is string => typeof x === 'string' && valid.has(x));
  } catch {
    return DEFAULT_QUICK_BAR;
  }
}

export function findAction(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((a) => a.id === id);
}
