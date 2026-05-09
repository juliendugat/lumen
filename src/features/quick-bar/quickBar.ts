/**
 * Configurable home-screen quick-bar.
 *
 * The user can pick which 3-6 chips appear under the cycle ring. Each chip
 * is an "action" defined here. The rest of the app references these by id
 * so adding a chip is just adding an entry below + a settings option.
 */

import { type IconName } from '@/ui/icons/Icon';

export type QuickAction = {
  id: string;
  label: string;
  icon: IconName;
  /** Which kind of editor to launch when tapped. */
  kind:
    | 'flow'
    | 'symptom'
    | 'mood'
    | 'note'
    | 'bbt'
    | 'mucus'
    | 'sex'
    | 'medication';
  /** For symptom/mood chips, the tag value to toggle on today's day. */
  payload?: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  // Flow shortcuts
  { id: 'flow.spotting', label: 'Spotting', icon: 'spotting', kind: 'flow', payload: 'spotting' },
  { id: 'flow.light', label: 'Light', icon: 'drop-light', kind: 'flow', payload: 'light' },
  { id: 'flow.medium', label: 'Medium', icon: 'drop', kind: 'flow', payload: 'medium' },
  { id: 'flow.heavy', label: 'Heavy', icon: 'drop-heavy', kind: 'flow', payload: 'heavy' },

  // Common symptoms
  { id: 'symptom.cramps', label: 'Cramps', icon: 'cramps', kind: 'symptom', payload: 'Cramps' },
  { id: 'symptom.headache', label: 'Headache', icon: 'headache', kind: 'symptom', payload: 'Headache' },
  { id: 'symptom.fatigue', label: 'Fatigue', icon: 'fatigue', kind: 'symptom', payload: 'Fatigue' },
  { id: 'symptom.bloating', label: 'Bloating', icon: 'bloating', kind: 'symptom', payload: 'Bloating' },
  { id: 'symptom.nausea', label: 'Nausea', icon: 'nausea', kind: 'symptom', payload: 'Nausea' },
  { id: 'symptom.acne', label: 'Acne', icon: 'acne', kind: 'symptom', payload: 'Acne' },

  // Moods
  { id: 'mood.happy', label: 'Happy', icon: 'happy', kind: 'mood', payload: 'Happy' },
  { id: 'mood.calm', label: 'Calm', icon: 'calm', kind: 'mood', payload: 'Calm' },
  { id: 'mood.anxious', label: 'Anxious', icon: 'anxious', kind: 'mood', payload: 'Anxious' },
  { id: 'mood.low', label: 'Low', icon: 'low', kind: 'mood', payload: 'Low' },
  { id: 'mood.energetic', label: 'Energetic', icon: 'energetic', kind: 'mood', payload: 'Energetic' },

  // Tracking
  { id: 'bbt', label: 'BBT', icon: 'thermometer', kind: 'bbt' },
  { id: 'mucus', label: 'Mucus', icon: 'mucus', kind: 'mucus' },
  { id: 'sex', label: 'Sex', icon: 'heart', kind: 'sex' },
  { id: 'note', label: 'Note', icon: 'note', kind: 'note' },
];

export const DEFAULT_QUICK_BAR = ['flow.light', 'flow.medium', 'flow.heavy', 'symptom.cramps'];

export function parseQuickBar(json: string | null | undefined): string[] {
  if (!json) return DEFAULT_QUICK_BAR;
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string');
    return DEFAULT_QUICK_BAR;
  } catch {
    return DEFAULT_QUICK_BAR;
  }
}

export function findAction(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((a) => a.id === id);
}
