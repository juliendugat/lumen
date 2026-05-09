// Renders the Lumen app icon set from inline SVG using `sharp`.
//
//   node scripts/build-icon.mjs
//
// Outputs:
//   assets/icon.png            1024×1024  full-bleed (App Store, Android legacy)
//   assets/adaptive-icon.png   1024×1024  foreground only on transparent (Android adaptive)
//   assets/favicon.png            64×64   browser tab
//   assets/splash-icon.png       512×512  centered crescent for splash screen
//   assets/icon-monochrome.svg            archived source

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

// Palette (mirrors src/ui/theme.ts)
const PAPER = '#FAF7F2';
const INK = '#1F1B17';
const TERRACOTTA = '#C97A63';
const TERRACOTTA_DEEP = '#9B4A38';
const SAGE = '#7E9270';

/**
 * Full-bleed icon — warm-paper background with a crescent moon and a small
 * ink dot at the centre representing today's marker on the cycle ring.
 *
 * The crescent is drawn as the boolean difference of two circles using
 * SVG's mask attribute, which sharp's librsvg backend handles natively.
 */
function fullBleed({ size = 1024, withBackground = true } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const inset = size * 0.08;
  const maskId = 'crescent-mask';
  const gradientId = 'paper-grad';
  const accentId = 'crescent-grad';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="${gradientId}" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="${PAPER}" />
      <stop offset="100%" stop-color="#F2EDE4" />
    </radialGradient>
    <linearGradient id="${accentId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${TERRACOTTA}" />
      <stop offset="100%" stop-color="${TERRACOTTA_DEEP}" />
    </linearGradient>
    <mask id="${maskId}">
      <rect x="0" y="0" width="${size}" height="${size}" fill="white" />
      <circle cx="${cx + inset}" cy="${cy - inset * 0.4}" r="${r * 0.96}" fill="black" />
    </mask>
  </defs>

  ${
    withBackground
      ? `<rect x="0" y="0" width="${size}" height="${size}" fill="url(#${gradientId})" rx="${size * 0.22}" />`
      : ''
  }

  <!-- Outer ring suggestion (very subtle on paper, still visible on transparent) -->
  <circle cx="${cx}" cy="${cy}" r="${r + size * 0.06}"
          fill="none"
          stroke="${withBackground ? '#E7E0D3' : 'rgba(31,27,23,0.18)'}"
          stroke-width="${size * 0.012}" />

  <!-- Crescent (terracotta) -->
  <g mask="url(#${maskId})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${accentId})" />
  </g>

  <!-- Sage ovulation tick at the top of the ring -->
  <circle cx="${cx + r * 0.78}" cy="${cy - r * 0.55}" r="${size * 0.022}" fill="${SAGE}" opacity="0.9" />

  <!-- Ink "today" marker — the ring focal point -->
  <circle cx="${cx - r - size * 0.06}" cy="${cy}" r="${size * 0.04}" fill="${INK}" />
</svg>`;
}

async function render(svg, file, w, h, opts = {}) {
  const path = join(out, file);
  const pipeline = sharp(Buffer.from(svg)).resize(w, h, {
    fit: 'contain',
    background: opts.transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : PAPER,
  });
  await pipeline.png().toFile(path);
  return path;
}

const fullSvg = fullBleed({ size: 1024, withBackground: true });
const fgSvg = fullBleed({ size: 1024, withBackground: false });

writeFileSync(join(out, 'icon-source.svg'), fullSvg);

const results = await Promise.all([
  render(fullSvg, 'icon.png', 1024, 1024),
  render(fgSvg, 'adaptive-icon.png', 1024, 1024, { transparent: true }),
  render(fullSvg, 'favicon.png', 64, 64),
  render(fgSvg, 'splash-icon.png', 512, 512, { transparent: true }),
]);

for (const r of results) console.log('wrote', r);
