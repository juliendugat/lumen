# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Lumen** — local-only cycle tracker. Expo SDK 54 / React Native 0.81 / React 19 / TypeScript strict. Live status: on TestFlight (v0.2.0, build 3).

## Commands

```sh
# Install — .npmrc pins legacy-peer-deps=true so plain `npm install` works
# (required because expo-router 6 pins react-dom@19.2.x while the rest of
#  SDK 54 is on react@19.1; runtime-compatible, peer resolver complains)
npm install

# Web dev (use this, not `npm run web`)
npm run web:isolated   # Metro on 8081 + Node proxy on 8082 that injects COOP/COEP. Open http://localhost:8082.

# Native dev on a real iPhone via Expo Go
npm run start:go       # scan the QR with the iPhone Camera app
npm run start:tunnel   # same, but via Expo's relay — for when LAN isn't reachable

# Native dev in the iOS simulator (Mac only — requires Xcode)
npx expo run:ios       # prebuilds + builds + launches in Simulator

# Quality gates
npm run typecheck
npm test
npm test -- src/engine/predict.test.ts   # single file

# Asset regeneration (deterministic; safe to run any time)
npm run build:icons          # regenerates icon/adaptive-icon/favicon/splash from scripts/build-icon.mjs
npm run build:screenshots    # needs the dev server running; uses Playwright at iPhone 6.7" (1290×2796)

# EAS — credentials + ASC API key are stored on EAS servers, so submits are non-interactive
npm run eas:preview      # TestFlight-bound build (autoIncrement on), production logging stripped
npm run eas:production   # App Store store-listing build, autoIncrement build number
npm run eas:submit       # uploads latest build to App Store Connect / TestFlight
```

`postinstall` runs `patch-package` — **do not remove**; see "Patches" below.

## Architecture — four layers, top-down

1. **Engine** (`src/engine/`) — pure functions, no React, no DB, no globals. `predict.ts` (recency-weighted mean + 80% confidence band, residual-based σ widening), `phases.ts` (day → phase mapping), `health-signals.ts` (pregnancy chance, variation classification), `trends.ts` (per-cycle stats + symptom-by-phase aggregation), `dates.ts` (ISO date helpers). All tested with vitest. **Single source of truth for prediction math** — never duplicate this in components.

2. **DB** (`src/db/`) — Drizzle ORM over `expo-sqlite`. Schema in `schema.ts`. Hand-written migrations in `migrations.ts` applied at boot from `client.ts`. `repo.ts` is the typed data-access layer + `normalizeSettings()` which sanitises enum values and bridges legacy data (e.g. mapping `standard/teen/pregnancy/perimenopause` → new four-axis values).

3. **Store** (`src/store/cycle.ts`) — Zustand. The *only* thing components consume for cycle/settings state. Composes engine + repo, recomputes prediction + fertile window + cycle day on every `refresh()`. Also threads `term` from the active Voice into `rescheduleNotifications()` so local notification titles follow the user's terminology.

4. **UI** (`app/` + `src/features/` + `src/ui/`) — Expo Router file-based routes; feature components under `src/features/`; theme tokens + primitives under `src/ui/`. Components must not import from `src/db/` directly — go through `useCycle`. Components must not hardcode "period"/"menstruation"/etc. — go through `useCopy` (see below).

## Two product axes — they're independent

After the UX review's "Mode" redesign:

- **`LifeMode`** = `cycling | pregnant | perimenopausal | postpartum` — engine axis. Drives what's predicted (pregnant + postpartum disable predictions; perimenopausal floors σ higher for honestly wider bands).
- **`Voice`** = `adult | teen | clinical` — copy axis. Owns terminology and tone (clinical → "menstruation" + no hedging; teen → friendlier phrasings + surfaces the Learn tab).

A pregnant teen is `lifeMode: 'pregnant'` + `voice: 'teen'`. Migration v4 in `src/db/migrations.ts` mapped legacy single-axis values to the new pair.

**Bridge into the UI:** `useCopy()` in `src/copy/useCopy.ts` reads `lifeMode` + `voice` from the store and returns `{ copy, term, Term, termPlural, voice, lifeMode }`. Components use it for both nouns (`term`/`Term`) and tone-sensitive phrases (`copy.predictHeadline`, `copy.expectedSub`, `copy.peakSub`, `copy.fertileLabel`, `copy.fertileSub`, `copy.emptyHomeBody`, `copy.logFirstCta`, `copy.notesPrompt`). Bundles live in `src/copy/copy.ts` (adult/teen/clinical for cycling, plus pregnancy/postpartum/perimenopausal overlays).

## Fertility-tracking setting gates fertility UI

`settings.fertilityMode` defaults to `'off'`. When off, **the calendar hides fertile-window fills + the "Fertile window (est.)" legend item, the home ring hides the peak-fertility dot, and the Insights Fertility tab is removed from the tab bar.** Predicted-period rendering is *not* gated — only the fertile/ovulation surfaces are.

## Privacy contract — architectural

- **No network calls.** No accounts, no servers, no analytics, no push tokens. Adding a feature that requires a backend is out of scope — flag it; don't build it.
- **Local-only SQLite.** Encryption-key is generated on first launch with `expo-crypto`, stored in Keychain/Keystore via `expo-secure-store`. `openDb()` issues `PRAGMA key = "x'<hex>'"` immediately after open — silently no-ops on vanilla expo-sqlite, takes effect when a SQLCipher build is wired in.
- **Notifications are local-only** (no push tokens). `expo-notifications` is configured with no Apple/Google project IDs.
- **iCloud/Google Drive backup is excluded** via `app.json` (`usesIcloudStorage: false`, `allowBackup: false`).
- **The privacy nutrition label is "Data Not Collected"** and it is genuinely true. Any new feature must preserve this.

## Web preview peculiarities

`expo-sqlite` on web uses `wa-sqlite` (WASM + Workers + OPFS). Three knock-ons:

1. **SharedArrayBuffer requires cross-origin isolation** → COOP + COEP response headers. Expo's dev server doesn't set them and Metro's `enhanceMiddleware` is bypassed by `@expo/cli`'s middleware stack. We run a tiny Node reverse proxy (`scripts/dev-proxy.mjs`) on port **8082** that wraps Metro on 8081 and injects the headers. **Always use `npm run web:isolated`**, not `npm run web`. Use http://localhost:8082, not 8081.

2. **OPFS access-handle exclusivity.** Stale handles from prior tabs/HMR runs throw `NoModificationAllowedError`, `Invalid VFS state`, or `Failed to initialize AccessHandlePoolVFS`. `openDb()` retries with backoff; the boot screen detects this family of errors (`isOpfsLockError`) and offers a "Clear & reload" button that wipes OPFS + IndexedDB + localStorage. Native isn't affected.

3. **`?demo=1` URL gate** — `src/dev/demo-seed.ts` wipes and seeds a deterministic 6-month history. Used by `scripts/screenshots.mjs` and for support demos. Activated only on web in `app/_layout.tsx`.

## EAS Build / TestFlight

- **`.npmrc` (committed) sets `legacy-peer-deps=true`** so the cloud `npm ci` resolves the expo-router 6 / react-dom peer conflict the same way local installs do. **Don't remove it** — without it, EAS install fails before the build even starts.
- **`preview` and `production` profiles both set `autoIncrement: true`** so iOS build numbers always bump (App Store Connect rejects duplicate build numbers per version).
- **`submit.production.ios.ascAppId`** is the App Store Connect numeric app ID (`6769160123`). Required for non-interactive submits; interactive `eas submit` would otherwise auto-detect it.
- **App Store Connect API key is stored on EAS servers** (Key ID `YF25GH56XB`, "[Expo] EAS Submit") — not in the repo. That's why `eas:submit` / `--auto-submit-with-profile production` runs hands-free with no `.p8` file locally.
- **One-shot build + submit:** `npx eas-cli build --platform ios --profile preview --auto-submit-with-profile production --non-interactive --no-wait` queues the build and chains the TestFlight upload after it finishes.

## Patches

`patches/expo-sqlite+16.0.10.patch` fixes a real upstream bug in `WorkerChannel.ts`: the length prefix is written as `Uint8Array.set(new Uint32Array([length]))`, which only stores the low byte. Results > 255 bytes get truncated → `JSON.parse` fails at position 89 (= 345 & 0xff). Patch swaps it for `new DataView(resultBuffer).setUint32(0, length, true)`. Auto-applied via `postinstall`. **Don't remove.** Web-only path; doesn't affect native.

## Migrations (hand-written, applied at boot)

`src/db/migrations.ts` is the source of truth. Each `Migration { version, sql }` runs in a transaction inside `runMigrations()` (in `src/db/client.ts`). `_migrations` table tracks applied versions.

`stripExistingAlterAddColumns()` filters `ALTER TABLE ... ADD COLUMN` statements against `PRAGMA table_info` at runtime — makes migrations idempotent against a partially-applied state. Adding a new migration: append a `{ version: N+1, sql: '...' }` entry; no schema autogen.

## Stack version gotchas (re-discovery costs time)

- **Reanimated 4** requires the separate `react-native-worklets` package, and `babel.config.js` must reference `'react-native-worklets/plugin'` (not `'react-native-reanimated/plugin'`).
- **`expo-file-system` v19** uses a class-based API: `import { File, Paths } from 'expo-file-system'` then `new File(Paths.cache, name).create()` then `.write(text)`. The legacy `cacheDirectory` / `writeAsStringAsync` exports are gone.
- **`expo-sqlite` on web** loads `wa-sqlite.wasm`. Metro must list `wasm` in `config.resolver.assetExts` (set in `metro.config.js`).
- **`babel-preset-expo`** is a transitive dep but Metro resolves it from the project root → it's a direct `dependency` pinned to `~54.0.10`. Don't add a second `^55.x` entry in `devDependencies` (npm picks one and SDK-55 bundles wrong on an SDK-54 project).
- **`metro-runtime`** is in `devDependencies` because npm's hoisting can leave it nested-only under `metro/`/`@expo/metro/`, and `@expo/cli` does `require.resolve('metro-runtime/package.json')` from the top-level. Without the explicit entry, `npx expo start` errors before Metro can launch.
- **`expo-router` 6** pins `react-dom@19.2.x` while the rest of SDK 54 is on `react@19.1`. The committed `.npmrc` (`legacy-peer-deps=true`) handles this everywhere — local, EAS, fresh clones.

## Test layout

- `src/engine/**/*.test.ts` — pure-logic tests (vitest, node env). 70+ tests covering prediction, learning, phases, fertility, trends, life-modes, edge cases (DST, year boundary, leap day), ICS export, health-signals.
- `vitest.config.ts` aliases `@` → `src/`. No DOM, no React; engine tests never spin up the React Native runtime.
- There is no test runner for components. If you need to test a component, JSDOM has been used as a smoke target (see `scripts/screenshots.mjs` for the Playwright approach we use for marketing screenshots).

## Things explicitly out of scope (per UX review)

- No paywalls or recurring subscriptions.
- No partner *sync* (the existing 14-day signed snapshot stays — it's a privacy-positive differentiator).
- No AI-generated SVG illustrations in `src/ui/icons/Icon.tsx` — the hand-authored iconography is the visual identity. (A future swap to commissioned/external art is a separate decision; the chip components would also need to switch from SVG `<Icon>` to `<Image>` and add light/dark variants.)

## Reference docs in repo

- `README.md` — high-level overview + run instructions.
- `STORE_CHECKLIST.md` — end-to-end EAS Build → TestFlight playbook.
- `PRIVACY.md` — privacy policy (also rendered at `docs/privacy.html` for GitHub Pages).
- `APP_REVIEW.md` — App Store reviewer notes to paste at submission.
- `COMPETITIVE_GAPS.md` — Flo/Clue feature gap analysis with 🟢🟡🔵 categorisation.
