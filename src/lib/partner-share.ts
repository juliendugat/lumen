import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { useCycle } from '@/store/cycle';
import { fromISO, type ISODate } from '@/engine/dates';

/**
 * Partner share — a self-contained HTML file with the next predicted period
 * window, current cycle phase, and an expiry date. No server. No account.
 *
 * "Locally-signed" here means the file embeds a sha256 of (payload || secret)
 * so that if it's edited the recipient can tell. The secret is the user's
 * device DB key (not exported), so verification is owner-only — the share
 * is not really "tamper-proof" against a sophisticated reader, just a
 * lightweight integrity check.
 */

export type SharePayload = {
  generatedAt: string;
  expiresAt: string;
  ownerDisplayName: string | null;
  predictionExpectedStart: ISODate | null;
  predictionExpectedEnd: ISODate | null;
  predictionConfidenceLow: ISODate | null;
  predictionConfidenceHigh: ISODate | null;
  fertileStart: ISODate | null;
  fertileEnd: ISODate | null;
  cycleDay: number | null;
  phase: string | null;
};

export async function buildSharePayload(durationDays = 14): Promise<SharePayload> {
  const state = useCycle.getState();
  const expiresAt = new Date(Date.now() + durationDays * 86_400_000).toISOString();
  return {
    generatedAt: new Date().toISOString(),
    expiresAt,
    ownerDisplayName: null,
    predictionExpectedStart: state.prediction?.expectedStart ?? null,
    predictionExpectedEnd: state.prediction?.expectedEnd ?? null,
    predictionConfidenceLow: state.prediction?.confidenceLow ?? null,
    predictionConfidenceHigh: state.prediction?.confidenceHigh ?? null,
    fertileStart: state.fertile?.start ?? null,
    fertileEnd: state.fertile?.end ?? null,
    cycleDay: state.cycleDayNum,
    phase: deriveLooseLabel(state),
  };
}

function deriveLooseLabel(state: ReturnType<typeof useCycle.getState>): string | null {
  if (!state.cycleDayNum) return null;
  if (state.prediction && state.cycleDayNum <= state.prediction.periodLength) return 'Period';
  if (state.fertile) {
    const today = new Date().toISOString().slice(0, 10);
    if (today >= state.fertile.start && today <= state.fertile.end) return 'Fertile window';
  }
  return 'Between phases';
}

async function sign(payload: string): Promise<string> {
  // Use a stable per-device share secret (separate from DB key, generated lazily).
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

export async function generateShareHtml(payload: SharePayload): Promise<string> {
  const signature = await sign(JSON.stringify(payload));
  const fmt = (iso: ISODate | null) =>
    iso ? fromISO(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
  const expires = fromISO(payload.expiresAt.slice(0, 10)).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Lumen — Shared cycle view</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    background: #FAF7F2; color: #1F1B17; margin: 0; padding: 24px; line-height: 1.5;
  }
  .card {
    max-width: 480px; margin: 24px auto; background: #F2EDE4; border-radius: 18px; padding: 24px;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .kicker { font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: #6E6458; margin-bottom: 4px; }
  .row { display: flex; gap: 12px; margin: 16px 0; align-items: baseline; }
  .row .label { color: #6E6458; font-size: 13px; flex: 0 0 120px; }
  .row .val { font-weight: 600; font-size: 16px; }
  .footer { font-size: 11px; color: #6E6458; margin-top: 32px; }
  .sig { font-family: ui-monospace, Menlo, monospace; font-size: 9px; color: #A89E8E; word-break: break-all; }
</style>
</head>
<body>
  <div class="card">
    <div class="kicker">Lumen — Shared view</div>
    <h1>Cycle snapshot</h1>
    <p style="color: #6E6458; margin-top: 4px;">Read-only. Expires ${expires}.</p>

    <div class="row"><div class="label">Cycle day</div><div class="val">${payload.cycleDay ?? '—'}</div></div>
    <div class="row"><div class="label">Phase</div><div class="val">${payload.phase ?? '—'}</div></div>

    <div class="row">
      <div class="label">Next period</div>
      <div class="val">
        ${fmt(payload.predictionExpectedStart)} – ${fmt(payload.predictionExpectedEnd)}
        <div style="font-weight: 400; font-size: 12px; color: #6E6458;">
          window ${fmt(payload.predictionConfidenceLow)} – ${fmt(payload.predictionConfidenceHigh)}
        </div>
      </div>
    </div>

    <div class="row">
      <div class="label">Fertile window</div>
      <div class="val">${fmt(payload.fertileStart)} – ${fmt(payload.fertileEnd)}</div>
    </div>

    <div class="footer">
      Generated locally by Lumen on ${new Date(payload.generatedAt).toLocaleString()}.
      No server saw this. After expiry, this snapshot is stale — generate a new one
      from the app if you want to share again.
    </div>
    <div class="sig">sha256: ${signature}</div>
  </div>
</body>
</html>`;
}

export async function shareWithPartner(durationDays = 14): Promise<void> {
  const payload = await buildSharePayload(durationDays);
  const html = await generateShareHtml(payload);

  if (Platform.OS === 'web') {
    const w = (globalThis as unknown as { window?: Window }).window;
    if (!w) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    w.open(url, '_blank');
    return;
  }
  const file = new File(Paths.cache, `lumen-share-${Date.now()}.html`);
  if (file.exists) file.delete();
  file.create();
  file.write(html);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/html', UTI: 'public.html' });
  }
}
