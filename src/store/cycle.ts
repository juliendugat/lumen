import { create } from 'zustand';
import {
  exportAll,
  getCycleSummary,
  getDay,
  getDaysInRange,
  getSettings,
  importAll,
  markOnboarded,
  mostRecentCycle,
  recentPredictionRecords,
  recordPrediction,
  settleOpenPredictions,
  togglePeriodDay,
  updateSettings,
  upsertDay,
  wipeAll,
  type DayPatch,
  type ExportPayload,
} from '@/db/repo';
import { predictNext, cycleDay, type Prediction } from '@/engine/predict';
import { estimateFertileWindow } from '@/engine/fertility';
import { termForVoice } from '@/copy/copy';
import { effectiveSigma } from '@/engine/learn';
import { todayISO, type ISODate, addDaysISO, diffDays } from '@/engine/dates';
import { rescheduleNotifications } from '@/lib/notifications';
import type { Day, Settings } from '@/db/schema';

/**
 * Two independent axes (Mode redesign — UX Review issue 04):
 *  - LifeMode is the engine axis: what Lumen predicts.
 *  - Voice is the copy axis: how Lumen talks. Voice owns terminology.
 */
export type LifeMode = 'cycling' | 'pregnant' | 'perimenopausal' | 'postpartum';
export type Voice = 'adult' | 'teen' | 'clinical';

type CycleState = {
  ready: boolean;
  settings: Settings | null;
  prediction: Prediction | null;
  fertile: { start: ISODate; end: ISODate; peak: ISODate } | null;
  lastStart: ISODate | null;
  todayDay: Day | null;
  cycleDayNum: number | null;
  /** Total number of cycles the user has logged. Drives the ring's
   * confidence ramp on the home screen (dotted at 0, full at 3+). */
  cyclesLogged: number;
  /** When in pregnancy mode, weeks since LMP (or pregnancyStartDate). */
  pregnancyWeek: number | null;
  pregnancyDayInWeek: number | null;
  refresh: () => Promise<void>;
  setFlow: (date: ISODate, flow: 'spotting' | 'light' | 'medium' | 'heavy') => Promise<void>;
  patchDay: (date: ISODate, patch: DayPatch) => Promise<void>;
  patchSettings: (patch: Partial<Settings>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  loadDays: (from: ISODate, to: ISODate) => Promise<Day[]>;
  exportData: () => Promise<ExportPayload>;
  importData: (payload: ExportPayload) => Promise<void>;
  wipe: () => Promise<void>;
};

export const useCycle = create<CycleState>((set, get) => ({
  ready: false,
  settings: null,
  prediction: null,
  fertile: null,
  lastStart: null,
  todayDay: null,
  cycleDayNum: null,
  cyclesLogged: 0,
  pregnancyWeek: null,
  pregnancyDayInWeek: null,

  refresh: async () => {
    const [settings, summary, recent, today] = await Promise.all([
      getSettings(),
      getCycleSummary(),
      mostRecentCycle(),
      getDay(todayISO()),
    ]);
    const lastStart = recent?.startDate ?? null;
    const records = await recentPredictionRecords();

    const lifeMode = (settings.lifeMode ?? 'cycling') as LifeMode;

    let prediction = predictNext(
      {
        startDates: summary.startDates,
        periodLengths: summary.periodLengths,
      },
      {
        defaultCycleLength: settings.defaultCycleLength,
        defaultPeriodLength: settings.defaultPeriodLength,
        lifeMode,
      },
    );

    if (prediction) {
      // Widen σ if recent residuals say we should
      const sigma = effectiveSigma(prediction.cycleSigma, records);
      if (sigma !== prediction.cycleSigma) {
        const halfBand = Math.round(1.28 * sigma);
        prediction = {
          ...prediction,
          cycleSigma: sigma,
          confidenceLow: addDaysISO(prediction.expectedStart, -halfBand),
          confidenceHigh: addDaysISO(prediction.expectedStart, halfBand),
        };
      }
    }

    const fertile = prediction
      ? estimateFertileWindow(prediction.expectedStart)
      : null;

    // Pregnancy week from LMP (or pregnancyStartDate, fall back to lastStart)
    let pregnancyWeek: number | null = null;
    let pregnancyDayInWeek: number | null = null;
    if (lifeMode === 'pregnant') {
      const anchor = settings.pregnancyLmpDate ?? settings.pregnancyStartDate ?? lastStart;
      if (anchor) {
        const d = diffDays(summary.today, anchor);
        if (d >= 0) {
          pregnancyWeek = Math.floor(d / 7);
          pregnancyDayInWeek = d % 7;
        }
      }
    }

    set({
      ready: true,
      settings,
      prediction,
      fertile,
      lastStart,
      todayDay: today,
      cycleDayNum: cycleDay(lastStart, summary.today),
      cyclesLogged: summary.startDates.length,
      pregnancyWeek,
      pregnancyDayInWeek,
    });

    if (prediction) {
      // Audit log + notification refresh
      await recordPrediction({
        predictedStart: prediction.expectedStart,
        predictedEnd: prediction.expectedEnd,
        confidenceLow: prediction.confidenceLow,
        confidenceHigh: prediction.confidenceHigh,
      });
      await rescheduleNotifications({
        predictedStart: prediction.expectedStart,
        confidenceHigh: prediction.confidenceHigh,
        fertileStart: fertile?.start,
        periodSoonDays: settings.notifPeriodSoonDays ?? undefined,
        lateDays: settings.notifLateDays ?? undefined,
        fertileEnabled: settings.notifFertileWindow,
        term: termForVoice((settings.voice ?? 'adult') as Voice),
      });
    }
  },

  setFlow: async (date, flow) => {
    await togglePeriodDay(date, flow);
    // If user logged a fresh start, settle prior open predictions.
    await settleOpenPredictions(date);
    await get().refresh();
  },

  patchDay: async (date, patch) => {
    await upsertDay(date, patch);
    await get().refresh();
  },

  patchSettings: async (patch) => {
    await updateSettings(patch);
    await get().refresh();
  },

  finishOnboarding: async () => {
    await markOnboarded();
    await get().refresh();
  },

  loadDays: async (from, to) => {
    return getDaysInRange(from, to);
  },

  exportData: () => exportAll(),

  importData: async (payload) => {
    await importAll(payload);
    await get().refresh();
  },

  wipe: async () => {
    await wipeAll();
    await get().refresh();
  },
}));
