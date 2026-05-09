import { and, asc, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { openDb } from './client';
import { cycles, days, medDoses, medications, predictions, settings, voiceMemos } from './schema';
import type { Cycle, Day, NewCycle, NewDay, Prediction, Settings } from './schema';
import { addDaysISO, diffDays, todayISO, type ISODate } from '@/engine/dates';

const SINGLETON = 'singleton';

function uid(): string {
  // Time + random — small, sortable, no extra dep.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowMs() {
  return Date.now();
}

// ─── Settings ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Omit<Settings, 'createdAt' | 'updatedAt'> = {
  id: SINGLETON,
  themeMode: 'system',
  terminology: 'period',
  lockEnabled: false,
  fertilityMode: 'off',
  lifeMode: 'standard',
  pregnancyStartDate: null,
  pregnancyLmpDate: null,
  sexLogEnabled: false,
  quickBarConfig: null,
  healthSyncEnabled: false,
  notifPeriodSoonDays: 2,
  notifLateDays: 2,
  notifFertileWindow: false,
  defaultCycleLength: 28,
  defaultPeriodLength: 5,
  onboardedAt: null,
};

const VALID_LIFE_MODES = ['standard', 'teen', 'pregnancy', 'perimenopause'] as const;
const VALID_FERTILITY_MODES = ['off', 'tracking', 'avoidance', 'conception'] as const;
const VALID_TERMINOLOGIES = ['period', 'cycle', 'menstruation'] as const;
const VALID_THEME_MODES = ['system', 'light', 'dark'] as const;

function normalizeSettings(row: Settings): Settings {
  return {
    ...row,
    lifeMode: VALID_LIFE_MODES.includes(row.lifeMode as (typeof VALID_LIFE_MODES)[number])
      ? row.lifeMode
      : 'standard',
    fertilityMode: VALID_FERTILITY_MODES.includes(
      row.fertilityMode as (typeof VALID_FERTILITY_MODES)[number],
    )
      ? row.fertilityMode
      : 'off',
    terminology: VALID_TERMINOLOGIES.includes(
      row.terminology as (typeof VALID_TERMINOLOGIES)[number],
    )
      ? row.terminology
      : 'period',
    themeMode: VALID_THEME_MODES.includes(row.themeMode as (typeof VALID_THEME_MODES)[number])
      ? row.themeMode
      : 'system',
    // Coerce nullable booleans / numbers to safe defaults
    defaultCycleLength:
      row.defaultCycleLength >= 18 && row.defaultCycleLength <= 60
        ? row.defaultCycleLength
        : 28,
    defaultPeriodLength:
      row.defaultPeriodLength >= 1 && row.defaultPeriodLength <= 14
        ? row.defaultPeriodLength
        : 5,
  };
}

export async function getSettings(): Promise<Settings> {
  const db = await openDb();
  const rows = await db.select().from(settings).where(eq(settings.id, SINGLETON)).limit(1);
  if (rows.length > 0) return normalizeSettings(rows[0]);
  const now = nowMs();
  const fresh: Settings = { ...DEFAULT_SETTINGS, createdAt: now, updatedAt: now };
  await db.insert(settings).values(fresh);
  return fresh;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await openDb();
  const existing = await getSettings();
  const merged: Settings = { ...existing, ...patch, updatedAt: nowMs() };
  await db.update(settings).set(merged).where(eq(settings.id, SINGLETON));
  return merged;
}

export async function markOnboarded(): Promise<Settings> {
  return updateSettings({ onboardedAt: nowMs() });
}

// ─── Cycles ───────────────────────────────────────────────────────────────

export async function listCycles(): Promise<Cycle[]> {
  const db = await openDb();
  return db
    .select()
    .from(cycles)
    .where(eq(cycles.predicted, false))
    .orderBy(asc(cycles.startDate));
}

export async function mostRecentCycle(): Promise<Cycle | null> {
  const db = await openDb();
  const rows = await db
    .select()
    .from(cycles)
    .where(eq(cycles.predicted, false))
    .orderBy(desc(cycles.startDate))
    .limit(1);
  return rows[0] ?? null;
}

export async function startCycle(date: ISODate): Promise<Cycle> {
  const db = await openDb();
  const now = nowMs();
  const cycle: NewCycle = {
    id: uid(),
    startDate: date,
    endDate: null,
    predicted: false,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(cycles).values(cycle);
  return cycle as Cycle;
}

export async function endCycle(cycleId: string, endDate: ISODate): Promise<void> {
  const db = await openDb();
  await db
    .update(cycles)
    .set({ endDate, updatedAt: nowMs() })
    .where(eq(cycles.id, cycleId));
}

export async function deleteCycle(cycleId: string): Promise<void> {
  const db = await openDb();
  await db.update(days).set({ cycleId: null }).where(eq(days.cycleId, cycleId));
  await db.delete(cycles).where(eq(cycles.id, cycleId));
}

// ─── Days ─────────────────────────────────────────────────────────────────

export type DayPatch = Partial<Omit<Day, 'date' | 'createdAt' | 'updatedAt'>> & {
  moodTagsArr?: string[] | null;
  symptomTagsArr?: string[] | null;
};

export async function getDay(date: ISODate): Promise<Day | null> {
  const db = await openDb();
  const rows = await db.select().from(days).where(eq(days.date, date)).limit(1);
  return rows[0] ?? null;
}

export async function getDaysInRange(from: ISODate, to: ISODate): Promise<Day[]> {
  const db = await openDb();
  return db
    .select()
    .from(days)
    .where(and(gte(days.date, from), lte(days.date, to)))
    .orderBy(asc(days.date));
}

function serializeArr(v: string[] | null | undefined): string | null {
  if (!v || v.length === 0) return null;
  return JSON.stringify(v);
}

export function parseArr(v: string | null | undefined): string[] {
  if (!v) return [];
  try {
    const x = JSON.parse(v);
    return Array.isArray(x) ? (x as string[]) : [];
  } catch {
    return [];
  }
}

export async function upsertDay(date: ISODate, patch: DayPatch): Promise<Day> {
  const db = await openDb();
  const existing = await getDay(date);
  const now = nowMs();

  const next: Day = {
    date,
    cycleId: patch.cycleId ?? existing?.cycleId ?? null,
    flow: patch.flow ?? existing?.flow ?? null,
    notes: patch.notes ?? existing?.notes ?? null,
    moodTags:
      patch.moodTagsArr !== undefined
        ? serializeArr(patch.moodTagsArr)
        : (patch.moodTags ?? existing?.moodTags ?? null),
    symptomTags:
      patch.symptomTagsArr !== undefined
        ? serializeArr(patch.symptomTagsArr)
        : (patch.symptomTags ?? existing?.symptomTags ?? null),
    sexLogged: patch.sexLogged ?? existing?.sexLogged ?? null,
    protectionUsed: patch.protectionUsed ?? existing?.protectionUsed ?? null,
    bbt: patch.bbt ?? existing?.bbt ?? null,
    mucus: patch.mucus ?? existing?.mucus ?? null,
    customJson: patch.customJson ?? existing?.customJson ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (existing) {
    await db.update(days).set(next).where(eq(days.date, date));
  } else {
    const insertRow: NewDay = next;
    await db.insert(days).values(insertRow);
  }

  return next;
}

/**
 * Toggle a period day on/off. When turning ON, attach to (or create) the
 * surrounding cycle so the prediction engine sees a contiguous flow.
 *
 * Rejects future dates — flow can't be logged before it's happened.
 */
export async function togglePeriodDay(
  date: ISODate,
  flow: 'spotting' | 'light' | 'medium' | 'heavy',
): Promise<Day> {
  if (date > todayISO()) {
    throw new Error('Cannot log a period in the future.');
  }
  const existing = await getDay(date);
  if (existing?.flow === flow) {
    return upsertDay(date, { flow: null });
  }
  // Find the cycle this day belongs to: most recent cycle whose start ≤ date.
  const cycle = await cycleContaining(date);
  let cycleId = cycle?.id ?? null;
  if (!cycle) {
    // No prior cycle within reasonable range — start a new one if the previous
    // period start is more than ~14 days away (avoid attaching to old cycles).
    const recent = await mostRecentCycle();
    if (!recent || diffDays(date, recent.startDate) > 14) {
      const created = await startCycle(date);
      cycleId = created.id;
    } else {
      cycleId = recent.id;
    }
  }
  return upsertDay(date, { flow, cycleId });
}

async function cycleContaining(date: ISODate): Promise<Cycle | null> {
  const db = await openDb();
  const rows = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.predicted, false), lte(cycles.startDate, date)))
    .orderBy(desc(cycles.startDate))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Derive period-length estimates from logged flow days. For each cycle,
 * count the contiguous run of period flow days starting at the cycle start.
 */
export async function periodLengthsFromHistory(): Promise<number[]> {
  const db = await openDb();
  const cs = await listCycles();
  const out: number[] = [];
  for (const c of cs) {
    let run = 0;
    let probe = c.startDate;
    // Walk forward up to 14 days
    for (let i = 0; i < 14; i++) {
      const row = await db.select().from(days).where(eq(days.date, probe)).limit(1);
      const flow = row[0]?.flow;
      if (!flow || flow === 'spotting') break;
      run++;
      probe = addDaysISO(probe, 1);
    }
    if (run > 0) out.push(run);
  }
  return out;
}

// ─── Predictions audit log ────────────────────────────────────────────────

export async function recordPrediction(p: {
  predictedStart: ISODate;
  predictedEnd: ISODate;
  confidenceLow: ISODate;
  confidenceHigh: ISODate;
  cycleId?: string;
}): Promise<void> {
  const db = await openDb();
  await db.insert(predictions).values({
    id: uid(),
    cycleId: p.cycleId ?? null,
    predictedStart: p.predictedStart,
    predictedEnd: p.predictedEnd,
    confidenceLow: p.confidenceLow,
    confidenceHigh: p.confidenceHigh,
    madeAt: nowMs(),
  });
}

export async function settleOpenPredictions(actualStart: ISODate): Promise<void> {
  const db = await openDb();
  const open = await db
    .select()
    .from(predictions)
    .where(eq(predictions.actualStart, null as unknown as string));
  for (const p of open) {
    const err = diffDays(actualStart, p.predictedStart);
    await db
      .update(predictions)
      .set({ actualStart, errorDays: err })
      .where(eq(predictions.id, p.id));
  }
}

export async function recentPredictionRecords(): Promise<
  Array<{ predictedStart: string; actualStart: string; errorDays: number }>
> {
  const db = await openDb();
  const rows = await db
    .select()
    .from(predictions)
    .orderBy(desc(predictions.madeAt))
    .limit(24);
  return rows
    .filter((r): r is Prediction & { actualStart: string; errorDays: number } =>
      Boolean(r.actualStart && r.errorDays !== null && r.errorDays !== undefined),
    )
    .map((r) => ({
      predictedStart: r.predictedStart,
      actualStart: r.actualStart!,
      errorDays: r.errorDays!,
    }));
}

// ─── Convenience aggregate ────────────────────────────────────────────────

export type CycleSummary = {
  startDates: ISODate[];
  periodLengths: number[];
  today: ISODate;
};

export async function getCycleSummary(): Promise<CycleSummary> {
  const cs = await listCycles();
  const lengths = await periodLengthsFromHistory();
  return {
    startDates: cs.map((c) => c.startDate),
    periodLengths: lengths,
    today: todayISO(),
  };
}

// ─── Trends helpers ───────────────────────────────────────────────────────

export type DayPointForTrends = {
  date: ISODate;
  cycleStart?: ISODate;
  flow?: string | null;
  symptoms?: string[];
  moods?: string[];
  bbt?: number | null;
};

/**
 * Build a flat list of {date, cycleStart, flow, symptoms, moods, bbt} —
 * everything the trends engine needs in one shot.
 */
export async function getTrendDays(): Promise<DayPointForTrends[]> {
  const db = await openDb();
  const cs = await listCycles();
  const cycleByDate = new Map<string, string>();
  for (let i = 0; i < cs.length; i++) {
    const start = cs[i].startDate;
    const next = cs[i + 1]?.startDate;
    let probe = start;
    while (true) {
      cycleByDate.set(probe, start);
      probe = addDaysISO(probe, 1);
      if (next && probe >= next) break;
      if (!next && diffDays(probe, start) > 60) break;
    }
  }
  const allDays = await db.select().from(days).orderBy(asc(days.date));
  return allDays.map((d) => {
    let cycleStart = cycleByDate.get(d.date);
    if (!cycleStart && d.cycleId) {
      cycleStart = cs.find((c) => c.id === d.cycleId)?.startDate;
    }
    return {
      date: d.date,
      cycleStart,
      flow: d.flow,
      symptoms: parseArr(d.symptomTags),
      moods: parseArr(d.moodTags),
      bbt: d.bbt,
    };
  });
}

// ─── Voice memos ──────────────────────────────────────────────────────────

export type VoiceMemoRow = typeof voiceMemos.$inferSelect;

export async function listVoiceMemos(date: ISODate): Promise<VoiceMemoRow[]> {
  const db = await openDb();
  return db
    .select()
    .from(voiceMemos)
    .where(eq(voiceMemos.date, date))
    .orderBy(asc(voiceMemos.createdAt));
}

export async function addVoiceMemo(
  date: ISODate,
  uri: string,
  durationMs: number,
): Promise<VoiceMemoRow> {
  const db = await openDb();
  const row: VoiceMemoRow = {
    id: uid(),
    date,
    uri,
    durationMs,
    createdAt: nowMs(),
  };
  await db.insert(voiceMemos).values(row);
  return row;
}

export async function deleteVoiceMemo(id: string): Promise<void> {
  const db = await openDb();
  await db.delete(voiceMemos).where(eq(voiceMemos.id, id));
}

// ─── Diagnostics ──────────────────────────────────────────────────────────

export type DiagnosticsReport = {
  cycleCount: number;
  loggedDayCount: number;
  oldestCycle: ISODate | null;
  newestCycle: ISODate | null;
  predictionRecords: number;
  medicationCount: number;
  doseCount: number;
  orphanDays: number; // days with no matching cycle
  schemaVersion: number;
};

export async function runDiagnostics(): Promise<DiagnosticsReport> {
  const db = await openDb();
  const [cs, ds, ps, ms, mds] = await Promise.all([
    db.select().from(cycles).orderBy(asc(cycles.startDate)),
    db.select().from(days),
    db.select().from(predictions),
    db.select().from(medications),
    db.select().from(medDoses),
  ]);
  let schemaVersion = 0;
  try {
    const client = (db as unknown as { $client: { getAllAsync: <T>(sql: string) => Promise<T[]> } }).$client;
    const r = await client.getAllAsync<{ version: number }>(
      'SELECT MAX(version) AS version FROM _migrations',
    );
    schemaVersion = r[0]?.version ?? 0;
  } catch {
    schemaVersion = 0;
  }
  const cycleIds = new Set(cs.map((c) => c.id));
  let orphanDays = 0;
  for (const d of ds) {
    if (d.cycleId && !cycleIds.has(d.cycleId)) orphanDays++;
  }
  return {
    cycleCount: cs.length,
    loggedDayCount: ds.length,
    oldestCycle: cs[0]?.startDate ?? null,
    newestCycle: cs[cs.length - 1]?.startDate ?? null,
    predictionRecords: ps.length,
    medicationCount: ms.length,
    doseCount: mds.length,
    orphanDays,
    schemaVersion,
  };
}

/**
 * Repair common data issues:
 *  - Day rows pointing at a cycleId that no longer exists → null cycleId.
 *  - Future-dated days (data corruption from clock skew) → leave intact but
 *    flagged in the count below.
 */
export async function repairData(): Promise<{ orphansFixed: number }> {
  const db = await openDb();
  const cs = await db.select().from(cycles);
  const ids = new Set(cs.map((c) => c.id));
  const allDays = await db.select().from(days);
  let fixed = 0;
  for (const d of allDays) {
    if (d.cycleId && !ids.has(d.cycleId)) {
      await db.update(days).set({ cycleId: null }).where(eq(days.date, d.date));
      fixed++;
    }
  }
  return { orphansFixed: fixed };
}

// ─── Bulk export / import ─────────────────────────────────────────────────

export type ExportPayload = {
  version: 2;
  exportedAt: number;
  cycles: Cycle[];
  days: Day[];
  predictions: Prediction[];
  settings: Settings;
  medications: Array<typeof medications.$inferSelect>;
  medDoses: Array<typeof medDoses.$inferSelect>;
};

export async function exportAll(): Promise<ExportPayload> {
  const db = await openDb();
  const [cs, ds, ps, s, ms, mds] = await Promise.all([
    db.select().from(cycles).orderBy(asc(cycles.startDate)),
    db.select().from(days).orderBy(asc(days.date)),
    db.select().from(predictions).orderBy(asc(predictions.madeAt)),
    getSettings(),
    db.select().from(medications),
    db.select().from(medDoses).orderBy(asc(medDoses.takenAt)),
  ]);
  return {
    version: 2,
    exportedAt: nowMs(),
    cycles: cs,
    days: ds,
    predictions: ps,
    settings: s,
    medications: ms,
    medDoses: mds,
  };
}

export async function importAll(payload: ExportPayload): Promise<void> {
  if (payload.version !== 2 && (payload as { version: number }).version !== 1) {
    throw new Error('Unsupported export version');
  }
  const db = await openDb();
  await db.delete(medDoses);
  await db.delete(medications);
  await db.delete(predictions);
  await db.delete(days);
  await db.delete(cycles);
  for (const c of payload.cycles) await db.insert(cycles).values(c);
  for (const d of payload.days) await db.insert(days).values(d);
  for (const p of payload.predictions) await db.insert(predictions).values(p);
  if (payload.version === 2) {
    for (const m of payload.medications ?? []) await db.insert(medications).values(m);
    for (const md of payload.medDoses ?? []) await db.insert(medDoses).values(md);
  }
  await updateSettings(payload.settings);
}

export async function wipeAll(): Promise<void> {
  const db = await openDb();
  await db.delete(predictions);
  await db.delete(days);
  await db.delete(cycles);
  await db.delete(medDoses);
  await db.delete(medications);
  await db.delete(settings);
}

// ─── Medications ──────────────────────────────────────────────────────────

export type MedKind = 'pill' | 'patch' | 'iud' | 'implant' | 'other';
export type MedSchedule =
  | { kind: 'daily'; times: string[] }
  | { kind: 'cycle'; activeDays: number; breakDays: number; times: string[] }
  | { kind: 'asNeeded' };

export type MedicationView = {
  id: string;
  name: string;
  dose: string | null;
  kind: MedKind;
  schedule: MedSchedule | null;
  startedAt: string | null;
  stoppedAt: string | null;
  notes: string | null;
  active: boolean;
};

function toMedView(row: typeof medications.$inferSelect): MedicationView {
  let parsed: MedSchedule | null = null;
  if (row.schedule) {
    try {
      parsed = JSON.parse(row.schedule) as MedSchedule;
    } catch {
      parsed = null;
    }
  }
  return {
    id: row.id,
    name: row.name,
    dose: row.dose,
    kind: (row.kind as MedKind) ?? 'other',
    schedule: parsed,
    startedAt: row.startedAt,
    stoppedAt: row.stoppedAt,
    notes: row.notes,
    active: !row.stoppedAt,
  };
}

export async function listMedications(opts?: { activeOnly?: boolean }): Promise<MedicationView[]> {
  const db = await openDb();
  const rows = opts?.activeOnly
    ? await db.select().from(medications).where(isNull(medications.stoppedAt))
    : await db.select().from(medications);
  return rows.map(toMedView);
}

export async function getMedication(id: string): Promise<MedicationView | null> {
  const db = await openDb();
  const rows = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
  return rows[0] ? toMedView(rows[0]) : null;
}

export async function upsertMedication(
  med: Omit<MedicationView, 'active' | 'id'> & { id?: string },
): Promise<MedicationView> {
  const db = await openDb();
  const now = nowMs();
  const id = med.id ?? uid();
  const scheduleJson = med.schedule ? JSON.stringify(med.schedule) : null;
  const existing = med.id ? await getMedication(med.id) : null;
  const row = {
    id,
    name: med.name,
    dose: med.dose ?? null,
    kind: med.kind,
    schedule: scheduleJson,
    startedAt: med.startedAt ?? null,
    stoppedAt: med.stoppedAt ?? null,
    notes: med.notes ?? null,
    createdAt: existing ? now : now, // we don't track a separate column, just use updated_at
    updatedAt: now,
  };
  if (existing) {
    await db.update(medications).set(row).where(eq(medications.id, id));
  } else {
    await db.insert(medications).values(row);
  }
  const fresh = await getMedication(id);
  return fresh!;
}

export async function deleteMedication(id: string): Promise<void> {
  const db = await openDb();
  await db.delete(medDoses).where(eq(medDoses.medId, id));
  await db.delete(medications).where(eq(medications.id, id));
}

export async function logDose(medId: string, takenAt: number, skipped = false): Promise<void> {
  const db = await openDb();
  await db.insert(medDoses).values({
    id: uid(),
    medId,
    takenAt,
    skipped,
    notes: null,
  });
}

export async function recentDoses(medId: string, limit = 30): Promise<Array<typeof medDoses.$inferSelect>> {
  const db = await openDb();
  return db
    .select()
    .from(medDoses)
    .where(eq(medDoses.medId, medId))
    .orderBy(desc(medDoses.takenAt))
    .limit(limit);
}
