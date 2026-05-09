import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { fromISO, type ISODate } from '@/engine/dates';
import {
  exportAll,
  listMedications,
  parseArr,
  type ExportPayload,
} from '@/db/repo';
import {
  computeMoodShare,
  computeSymptomTrends,
  type DayPoint,
} from '@/engine/trends';
import { cycleLengthsFromStarts } from '@/engine/predict';

/**
 * Generates a print-ready, doctor-friendly summary of recent cycles. Designed
 * for monochrome printing — no color-coded backgrounds. Uses the same data
 * the app exports (no narrative interpretation).
 */
export async function generateDoctorReportHtml(): Promise<string> {
  const data = await exportAll();
  const meds = await listMedications();
  const monthsBack = 12;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const recentCycles = data.cycles
    .filter((c) => c.startDate >= cutoffIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const lengths = cycleLengthsFromStarts(recentCycles.map((c) => c.startDate));
  const avg = lengths.length
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : null;
  const min = lengths.length ? Math.min(...lengths) : null;
  const max = lengths.length ? Math.max(...lengths) : null;
  const stdev =
    lengths.length >= 2
      ? Math.sqrt(
          lengths.reduce((a, b) => a + (b - (avg ?? 0)) ** 2, 0) / lengths.length,
        )
      : null;

  // Build day points for trends
  const dayPoints: DayPoint[] = data.days.map((d) => {
    const cyc = data.cycles.find((c) => c.id === d.cycleId);
    return {
      date: d.date,
      cycleStart: cyc?.startDate,
      flow: d.flow,
      symptoms: parseArr(d.symptomTags),
      moods: parseArr(d.moodTags),
      bbt: d.bbt,
    };
  });
  const trends = computeSymptomTrends(dayPoints).slice(0, 8);
  const moodShare = computeMoodShare(dayPoints).slice(0, 5);

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return wrapHtml(`
    <h1>Cycle history summary</h1>
    <p class="muted">Generated on ${today} from a Lumen ${data.version} export. ${monthsBack}-month window.</p>

    <h2>Cycle stats</h2>
    <table>
      <tr><td>Cycles in window</td><td>${recentCycles.length}</td></tr>
      <tr><td>Average length</td><td>${avg !== null ? avg + ' days' : '—'}</td></tr>
      <tr><td>Shortest / longest</td><td>${min !== null ? `${min} – ${max}` : '—'}</td></tr>
      <tr><td>Standard deviation</td><td>${stdev !== null ? stdev.toFixed(1) + ' days' : '—'}</td></tr>
    </table>

    <h2>Cycles</h2>
    <table class="grid">
      <tr><th>Start</th><th>End</th><th>Period (days)</th><th>Cycle length</th></tr>
      ${recentCycles
        .map((c, i) => {
          const next = recentCycles[i + 1];
          const len = next ? daysBetween(c.startDate, next.startDate) : '—';
          const periodDays = countPeriodDays(c.id, c.startDate, data);
          return `
            <tr>
              <td>${formatDate(c.startDate)}</td>
              <td>${c.endDate ? formatDate(c.endDate) : '—'}</td>
              <td>${periodDays || '—'}</td>
              <td>${len}</td>
            </tr>`;
        })
        .join('')}
    </table>

    <h2>Symptom patterns</h2>
    ${
      trends.length === 0
        ? '<p class="muted">Not enough symptom data logged in the window.</p>'
        : `<table class="grid">
            <tr><th>Symptom</th><th>Occurrences</th><th>Cluster (cycle days)</th></tr>
            ${trends
              .map(
                (t) => `
              <tr>
                <td>${escapeHtml(t.symptom)}</td>
                <td>${t.totalOccurrences}</td>
                <td>${
                  t.hotspot ? `${t.hotspot.startDay}–${t.hotspot.endDay}` : '—'
                }</td>
              </tr>`,
              )
              .join('')}
          </table>`
    }

    <h2>Mood share</h2>
    ${
      moodShare.length === 0
        ? '<p class="muted">No mood data logged.</p>'
        : `<table class="grid">
            <tr><th>Mood</th><th>Share of logged days</th></tr>
            ${moodShare
              .map(
                (m) => `
              <tr>
                <td>${escapeHtml(m.mood)}</td>
                <td>${(m.share * 100).toFixed(0)}%</td>
              </tr>`,
              )
              .join('')}
          </table>`
    }

    <h2>Medications</h2>
    ${
      meds.length === 0
        ? '<p class="muted">None recorded.</p>'
        : `<table class="grid">
            <tr><th>Name</th><th>Kind</th><th>Started</th><th>Stopped</th></tr>
            ${meds
              .map(
                (m) => `
              <tr>
                <td>${escapeHtml(m.name)}${m.dose ? ' — ' + escapeHtml(m.dose) : ''}</td>
                <td>${escapeHtml(m.kind)}</td>
                <td>${m.startedAt ? formatDate(m.startedAt) : '—'}</td>
                <td>${m.stoppedAt ? formatDate(m.stoppedAt) : '—'}</td>
              </tr>`,
              )
              .join('')}
          </table>`
    }

    <p class="footer muted">Generated locally on the user's device by Lumen. Not transmitted to any server.</p>
  `);
}

function daysBetween(a: ISODate, b: ISODate): string {
  const da = fromISO(a).getTime();
  const db = fromISO(b).getTime();
  return String(Math.round((db - da) / 86_400_000) + ' days');
}

function countPeriodDays(cycleId: string, _start: ISODate, data: ExportPayload): number {
  return data.days.filter(
    (d) => d.cycleId === cycleId && d.flow && d.flow !== 'spotting',
  ).length;
}

function formatDate(iso: ISODate): string {
  return fromISO(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapHtml(body: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Lumen — Cycle history</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; color: #1F1B17; line-height: 1.45; }
  h1 { font-size: 22pt; margin: 0 0 8px; font-weight: 600; }
  h2 { font-size: 13pt; margin: 22px 0 6px; border-bottom: 1px solid #E7E0D3; padding-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; font-size: 10pt; }
  table.grid th, table.grid td { border: 1px solid #E7E0D3; padding: 6px 8px; text-align: left; }
  table:not(.grid) td { padding: 3px 8px; }
  table:not(.grid) td:first-child { color: #6E6458; width: 40%; }
  .muted { color: #6E6458; }
  .footer { font-size: 8pt; margin-top: 28px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

/**
 * Render the doctor report HTML to a PDF and share it.
 * On web, opens a print dialog with the HTML.
 */
export async function exportDoctorReport(): Promise<void> {
  const html = await generateDoctorReportHtml();
  if (Platform.OS === 'web') {
    const w = (globalThis as unknown as { window?: Window }).window;
    if (!w) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWin = w.open(url, '_blank');
    if (printWin) {
      printWin.addEventListener('load', () => {
        try {
          printWin.print();
        } catch {
          /* ignore */
        }
      });
    }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
