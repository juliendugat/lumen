import type { ISODate } from '@/engine/dates';

/**
 * One-line daily tips. Deterministically chosen by date so the tip is stable
 * across re-renders within the same day, and consistent across devices on
 * the same date. No "tip of the moment" surprises.
 *
 * Tone: helpful, calm, occasionally specific. Never instructive about medical
 * decisions. Never marketing. Never alarming.
 */

export type DailyTip = { id: string; text: string };

const TIPS: DailyTip[] = [
  { id: 'iron-1', text: 'Pair iron-rich foods with vitamin C — it boosts absorption.' },
  { id: 'sleep-1', text: 'Sleep loss can shift cycle timing. A consistent bedtime tightens predictions.' },
  { id: 'cramps-1', text: 'A heating pad on the lower belly helps as much as some painkillers for cramps.' },
  { id: 'water-1', text: 'Hydration eases bloating in the days before a period.' },
  { id: 'cycle-1', text: 'Cycles slightly out of rhythm for a month is normal. Patterns matter more than single cycles.' },
  { id: 'mood-1', text: 'Logging mood for a few cycles often reveals a clearer pattern than a single month.' },
  { id: 'fertile-1', text: 'Fertile-window estimates can shift with stress, illness, or travel.' },
  { id: 'walk-1', text: 'A 20-minute walk in daylight is one of the most reliable mood resets across phases.' },
  { id: 'magnesium-1', text: 'Magnesium-rich foods (greens, nuts, dark chocolate) can ease cramps for some.' },
  { id: 'temp-1', text: 'A sustained 0.2°C BBT rise marks ovulation in the day or two prior — only useful if measured before getting out of bed.' },
  { id: 'mucus-1', text: 'Cervical mucus that’s clear and stretchy is a sign ovulation may be near.' },
  { id: 'bleeding-1', text: 'Heavier flow is iron-costly. Iron-rich meals through the period help energy stay steady.' },
  { id: 'pms-1', text: 'PMS is real and treatable. Persistent low mood every month is worth a doctor’s visit.' },
  { id: 'birth-control-1', text: 'Some contraception flattens the cycle on Lumen — you may see steady "cycles" with little variation.' },
  { id: 'caffeine-1', text: 'Caffeine sensitivity often rises in the late luteal phase. Worth noticing if you’re sleep-disrupted that week.' },
  { id: 'mind-1', text: 'Naming what you’re feeling — even just “tired”, “anxious”, “flat” — helps it move through faster.' },
  { id: 'data-1', text: 'Lumen exports are JSON — you can open them in any text editor. Yours, fully readable.' },
  { id: 'privacy-1', text: 'Lumen sees no servers. If you put your phone in airplane mode, the app still works exactly the same.' },
];

export function tipForDate(iso: ISODate): DailyTip {
  // Stable hash: sum of charcodes
  let h = 0;
  for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) | 0;
  const idx = ((h % TIPS.length) + TIPS.length) % TIPS.length;
  return TIPS[idx];
}
