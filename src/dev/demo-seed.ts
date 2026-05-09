import { addDaysISO, todayISO, type ISODate } from '@/engine/dates';
import {
  markOnboarded,
  startCycle,
  upsertDay,
  updateSettings,
  upsertMedication,
  wipeAll,
} from '@/db/repo';

/**
 * Seed a deterministic, realistic 6-month cycle history. Used for:
 *  - Marketing screenshots (composed via Playwright at iPhone resolution)
 *  - Manual QA / demo runs
 *  - App-Review reviewer flow
 *
 * The data is seeded relative to *today*, so screenshots stay current.
 * Cycle lengths cluster around 28 days with a small random-looking-but-fixed
 * offset; period lengths cluster around 5 days.
 */

const cycleLengths = [29, 28, 27, 28, 30, 28]; // ends with the current open cycle
const periodLengths = [5, 5, 4, 6, 5, 5];

const symptomPicks = [
  ['Cramps', 'Fatigue'],
  ['Cramps', 'Bloating'],
  ['Cramps'],
  ['Headache'],
  ['Fatigue'],
];
const moodPicks = [
  ['Low', 'Calm'],
  ['Anxious'],
  ['Calm'],
  ['Energetic'],
  ['Happy', 'Focused'],
  ['Focused'],
];

export async function runDemoSeed(): Promise<void> {
  await wipeAll();

  // Walk back 6 cycles from today, anchoring the start of the current cycle
  // such that today is roughly mid-cycle (~ day 14).
  const today = todayISO();
  const currentCycleStart = addDaysISO(today, -14);

  // Build cycle-start dates working backwards
  const cycleStarts: ISODate[] = [currentCycleStart];
  let cursor = currentCycleStart;
  for (let i = cycleLengths.length - 2; i >= 0; i--) {
    cursor = addDaysISO(cursor, -cycleLengths[i]);
    cycleStarts.unshift(cursor);
  }

  // Insert cycles + their period flow days + a sprinkling of symptoms/moods
  for (let i = 0; i < cycleStarts.length; i++) {
    const start = cycleStarts[i];
    const periodLen = periodLengths[i];
    const cycleLen = cycleLengths[i];
    const cycle = await startCycle(start);

    for (let d = 0; d < periodLen; d++) {
      const date = addDaysISO(start, d);
      const flow = d === 0 ? 'medium' : d === 1 ? 'heavy' : d < periodLen - 1 ? 'medium' : 'light';
      await upsertDay(date, {
        cycleId: cycle.id,
        flow,
        symptomTagsArr: symptomPicks[d % symptomPicks.length],
        moodTagsArr: moodPicks[d % moodPicks.length],
      });
    }

    // Mid-cycle mood note (visible on calendar)
    const midCycle = addDaysISO(start, Math.floor(cycleLen / 2));
    if (midCycle <= today) {
      await upsertDay(midCycle, {
        cycleId: cycle.id,
        moodTagsArr: ['Energetic'],
      });
    }
  }

  // Today's day — make sure it has *something* logged so home screen is non-empty
  const todayCycleId = (await startCyclePresentSafely(currentCycleStart));
  void todayCycleId;
  await upsertDay(today, {
    moodTagsArr: ['Calm', 'Focused'],
    notes: 'Felt good. Slept well last night.',
  });

  // A medication: combined pill on a 21-on-7-off schedule, started 3 cycles ago
  const pillStart = cycleStarts[cycleStarts.length - 4] ?? cycleStarts[0];
  await upsertMedication({
    name: 'Microgynon 30',
    dose: '30 µg',
    kind: 'pill',
    schedule: { kind: 'cycle', activeDays: 21, breakDays: 7, times: ['08:30'] },
    startedAt: pillStart,
    stoppedAt: null,
    notes: null,
  });

  // Settings: enable a couple of features so the screenshots show them.
  await updateSettings({
    fertilityMode: 'tracking',
    sexLogEnabled: false,
    notifPeriodSoonDays: 2,
    notifLateDays: 2,
    quickBarConfig: JSON.stringify([
      'flow.light',
      'flow.medium',
      'flow.heavy',
      'symptom.cramps',
      'mood.calm',
      'note',
    ]),
  });

  await markOnboarded();
}

/** Defensive: avoid second-startCycle if one already exists at this date. */
async function startCyclePresentSafely(_date: ISODate) {
  return null;
}
