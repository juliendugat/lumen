import type { IconName } from '@/ui/icons/Icon';

/**
 * Symptom catalog with category grouping. Mirrors the design-study layout
 * (image #4 page 2): expandable category cards, each with illustrated chips.
 *
 * Adding a category is appending to `SYMPTOM_GROUPS`; adding a symptom is
 * appending to a group's `items` array.
 *
 * Tag values are stored verbatim in the days.symptomTags JSON, so renames
 * are a data migration. Add freely; rename rarely.
 */

export type SymptomCategory =
  | 'Pain'
  | 'Skin'
  | 'Hair'
  | 'Sleep'
  | 'Digestion'
  | 'Energy';

export type SymptomItem = {
  /** Stored value (used in days.symptomTags). Stable; do not rename. */
  value: string;
  /** User-visible label. */
  label: string;
  icon: IconName;
};

export type SymptomGroup = {
  category: SymptomCategory;
  items: SymptomItem[];
};

export const SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    category: 'Pain',
    items: [
      { value: 'Cramps', label: 'Cramps', icon: 'cramps' },
      { value: 'Headache', label: 'Headache', icon: 'headache' },
      { value: 'Migraine', label: 'Migraine', icon: 'headache' },
      { value: 'Backache', label: 'Backache', icon: 'backache' },
      { value: 'Lower back', label: 'Lower back', icon: 'backache' },
      { value: 'Joint pain', label: 'Joint pain', icon: 'sparkle' },
      { value: 'Leg pain', label: 'Leg pain', icon: 'sparkle' },
      { value: 'Tender breasts', label: 'Tender breasts', icon: 'breast' },
    ],
  },
  {
    category: 'Skin',
    items: [
      { value: 'Acne', label: 'Acne', icon: 'acne' },
      { value: 'Dry skin', label: 'Dry skin', icon: 'leaf' },
      { value: 'Oily skin', label: 'Oily skin', icon: 'sparkle' },
      { value: 'Breakouts', label: 'Breakouts', icon: 'acne' },
      { value: 'Sensitive skin', label: 'Sensitive', icon: 'flower' },
    ],
  },
  {
    category: 'Hair',
    items: [
      { value: 'Oily hair', label: 'Oily hair', icon: 'sparkle' },
      { value: 'Dry hair', label: 'Dry hair', icon: 'leaf' },
      { value: 'Hair loss', label: 'Hair loss', icon: 'cloud' },
    ],
  },
  {
    category: 'Sleep',
    items: [
      { value: 'Insomnia', label: 'Insomnia', icon: 'insomnia' },
      { value: 'Restless sleep', label: 'Restless', icon: 'moon' },
      { value: 'Vivid dreams', label: 'Vivid dreams', icon: 'moon' },
    ],
  },
  {
    category: 'Digestion',
    items: [
      { value: 'Bloating', label: 'Bloating', icon: 'bloating' },
      { value: 'Nausea', label: 'Nausea', icon: 'nausea' },
      { value: 'Cravings', label: 'Cravings', icon: 'cravings' },
      { value: 'Diarrhoea', label: 'Diarrhoea', icon: 'leaf' },
      { value: 'Constipation', label: 'Constipation', icon: 'leaf' },
    ],
  },
  {
    category: 'Energy',
    items: [
      { value: 'Fatigue', label: 'Fatigue', icon: 'fatigue' },
      { value: 'Hot flashes', label: 'Hot flashes', icon: 'sun' },
      { value: 'Dizziness', label: 'Dizziness', icon: 'cloud' },
      { value: 'Brain fog', label: 'Brain fog', icon: 'cloud' },
    ],
  },
];

export const MOOD_ITEMS: SymptomItem[] = [
  { value: 'Happy', label: 'Happy', icon: 'happy' },
  { value: 'Calm', label: 'Calm', icon: 'calm' },
  { value: 'Anxious', label: 'Anxious', icon: 'anxious' },
  { value: 'Irritable', label: 'Irritable', icon: 'irritable' },
  { value: 'Low', label: 'Low', icon: 'low' },
  { value: 'Energetic', label: 'Energetic', icon: 'energetic' },
  { value: 'Sad', label: 'Sad', icon: 'sad' },
  { value: 'Focused', label: 'Focused', icon: 'focused' },
  { value: 'Overwhelmed', label: 'Overwhelmed', icon: 'cloud' },
  { value: 'Confident', label: 'Confident', icon: 'sparkle' },
];

/** Flat search index for quick filtering. */
export const ALL_SYMPTOM_ITEMS: SymptomItem[] = SYMPTOM_GROUPS.flatMap((g) => g.items);

/** Cervical-mucus / vaginal-discharge values, top-level on the Flow tab. */
export const DISCHARGE_VALUES: Array<{
  value: string;
  label: string;
  icon: IconName;
}> = [
  { value: 'none', label: 'None', icon: 'leaf' },
  { value: 'spotting', label: 'Spotting', icon: 'spotting' },
  { value: 'sticky', label: 'Sticky', icon: 'mucus' },
  { value: 'creamy', label: 'Creamy', icon: 'mucus' },
  { value: 'watery', label: 'Watery', icon: 'mucus' },
  { value: 'eggwhite', label: 'Eggwhite', icon: 'mucus' },
];
