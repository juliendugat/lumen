/**
 * Generates App Store screenshots from the live web build.
 *
 * Workflow:
 *   1. Start the dev server (npm run web:isolated)
 *   2. Run this script: node scripts/screenshots.mjs
 *   3. Outputs PNGs at iPhone 6.7" resolution (1290×2796) into assets/screenshots/.
 *
 * Each PNG is exactly the size App Store Connect expects for the 6.7" display
 * size (iPhone 15 / 16 Pro Max). For the 6.5" tier (iPhone 14 Plus etc.) you
 * can re-run with VIEWPORT=6.5 to get 1284×2778.
 *
 * The web build wires `?demo=1` to wipe + reseed deterministic data, so every
 * run produces identical screenshots.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, 'assets', 'screenshots');
mkdirSync(out, { recursive: true });

const PROFILES = {
  '6.7': { width: 1290, height: 2796, dpr: 3 },
  '6.5': { width: 1284, height: 2778, dpr: 3 },
  '5.5': { width: 1242, height: 2208, dpr: 3 },
};
const profileKey = process.env.VIEWPORT ?? '6.7';
const profile = PROFILES[profileKey];
if (!profile) throw new Error(`Unknown VIEWPORT: ${profileKey}`);

const baseURL = process.env.LUMEN_URL ?? 'http://localhost:8082';

const SHOTS = [
  // [filename, route, label-overlay, wait-after-ms]
  { file: '01-home', path: '/', wait: 1500, scrollY: 0 },
  { file: '02-calendar', path: '/calendar', wait: 1500, scrollY: 0 },
  { file: '03-insights', path: '/insights', wait: 1500, scrollY: 0 },
  { file: '04-insights-trends', path: '/insights', wait: 1500, scrollY: 1000 },
  { file: '05-day-log', path: '/log/__TODAY__', wait: 1500, scrollY: 0 },
  { file: '06-settings', path: '/settings', wait: 1500, scrollY: 0 },
  { file: '07-medications', path: '/medications', wait: 1500, scrollY: 0 },
  { file: '08-privacy', path: '/privacy', wait: 1500, scrollY: 0 },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: profile.width / profile.dpr, height: profile.height / profile.dpr },
  deviceScaleFactor: profile.dpr,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

console.log(`Seeding demo data via ${baseURL}/?demo=1 …`);
await page.goto(`${baseURL}/?demo=1`, { waitUntil: 'networkidle', timeout: 60_000 });
// Wait for the cycle ring to appear (sentinel that boot finished)
try {
  await page.waitForFunction(
    () => {
      const txt = document.body?.textContent ?? '';
      return /Day \d+/.test(txt) || /Get started/.test(txt);
    },
    { timeout: 30_000 },
  );
} catch (e) {
  console.warn('Sentinel not found in 30s — capturing current state anyway.');
}
await page.waitForTimeout(2_000); // give animations a beat

for (const shot of SHOTS) {
  const path = shot.path.replace('__TODAY__', todayISO());
  console.log(`→ ${path}  (${shot.file})`);
  await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(shot.wait);
  if (shot.scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), shot.scrollY);
    await page.waitForTimeout(500);
  }
  const file = join(out, `${shot.file}-${profileKey}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved ${file}`);
}

await browser.close();
console.log('Done. Upload these to App Store Connect → Lumen → App Store → 6.7" Display.');
