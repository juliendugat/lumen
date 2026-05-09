/**
 * Lumen design tokens.
 *
 * Theme is "warm paper + ink" — calm, body-literate, adult, neutral.
 * Light is the default; dark is a true dark mode (not just inverted).
 */

export const palette = {
  // Warm off-white paper background. Slightly creamy, not clinical.
  paper: '#FAF7F2',
  paperDeep: '#F2EDE4',
  paperEdge: '#E7E0D3',

  ink: '#1F1B17',
  inkSoft: '#3A332B',
  inkMuted: '#6E6458',
  inkFaint: '#A89E8E',

  // Period red — terracotta, not bright pink. Confident but not loud.
  flowLight: '#E8B5A4',
  flowMedium: '#C97A63',
  flowHeavy: '#9B4A38',
  flowSpotting: '#D9A89A',

  // Fertile / ovulation — soft sage, suggesting growth without flowers.
  fertile: '#A8B89C',
  fertilePeak: '#7E9270',

  // Predictions — desaturated muted blue, the "estimate" voice.
  predicted: '#9CA8B5',
  predictedSoft: '#C4CCD3',

  // Cycle-phase distinct accents (used in dot-strips and stats):
  //   period      ─ terracotta family, see flow* above
  //   follicular  ─ warm honey/mustard, suggesting morning/build-up
  //   ovulation   ─ teal-tinted fertile, the day of peak
  //   luteal      ─ muted sage for the wind-down
  follicular: '#D9B86A',
  follicularSoft: '#EBD9AC',
  ovulation: '#6FA9A0',
  ovulationSoft: '#B8D3CE',
  luteal: '#9A9F7E',
  lutealSoft: '#C7CAB2',

  // Accents
  accent: '#7E9270',
  warning: '#C28840',
  error: '#9B4A38',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(31,27,23,0.08)',
} as const;

export const darkPalette = {
  paper: '#16130F',
  paperDeep: '#1F1B17',
  paperEdge: '#2A2520',

  ink: '#F2EDE4',
  inkSoft: '#D8D0C2',
  inkMuted: '#9A9080',
  inkFaint: '#6E6458',

  flowLight: '#9B5A48',
  flowMedium: '#C97A63',
  flowHeavy: '#E89580',
  flowSpotting: '#8C5447',

  fertile: '#7E9270',
  fertilePeak: '#A8B89C',

  predicted: '#6E7A87',
  predictedSoft: '#4A535C',

  follicular: '#D9B86A',
  follicularSoft: '#594B2E',
  ovulation: '#6FA9A0',
  ovulationSoft: '#2D4F4A',
  luteal: '#9A9F7E',
  lutealSoft: '#3F4232',

  accent: '#A8B89C',
  warning: '#D9A055',
  error: '#E8806B',

  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(0,0,0,0.4)',
} as const;

export type Palette = typeof palette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  micro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
} as const;

export const motion = {
  fast: 150,
  base: 240,
  slow: 420,
  breathe: 4000,
} as const;

export type ThemeMode = 'light' | 'dark';

export function getPalette(mode: ThemeMode): Palette {
  return mode === 'dark' ? (darkPalette as unknown as Palette) : palette;
}
