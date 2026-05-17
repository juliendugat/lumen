# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Lumen** — local-only cycle-tracker. Expo SDK 54 / React Native 0.81 / React 19 / TypeScript strict. Windows host, no Mac (iOS ships via EAS Build cloud + TestFlight). Live status: in pre-TestFlight; first EAS iOS build has been initiated.

## Commands

```sh
# Install — --legacy-peer-deps is required (expo-router 6 pins react-dom@19.2.x while the rest of SDK 54 is on react@19.1)
npm install --legacy-peer-deps

# Web dev (use this, not `npm run web`)
npm run web:isolated   # starts Metro on 8081 + a Node proxy on 8082 that injects COOP/COEP headers. Open http://localhost:8082.

# Native dev on a real iPhone via Expo Go
npm run start:go       # then scan the QR with the iPhone Camera app
npm run start:tunnel   # same, but through Expo's relay — for when LAN isn't reachable

# Quality gates
npm run typecheck
npm test
npm test -- src/engine/predict.test.ts   # single file

# Asset regeneration (deterministic; safe to run any time)
npm run build:icons          # regenerates icon/adaptive-icon/favicon/splash from scripts/build-icon.mjs
npm run build:screenshots    # needs dev server running; uses Playwright at iPhone 6.7" (1290×2796)

# EAS — first iOS build is interactive (Apple ID + 2FA); subsequent builds can run non-interactive
npm run eas:preview      # TestFlight-bound build, production logging stripped
npm run eas:production   # App Store store-listing build, autoIncrement build number
npm run eas:submit       # uploads latest build to App Store Connect
```

`postinstall` runs `patch-package` — **do not remove**; see "Patches" below.

## Architecture — four layers, top-down

1. **Engine** (`src/engine/`) — pure functions, no React, no DB, no globals. `predict.ts` (recency-weighted mean + 80% confidence band, residual-based σ widening), `phases.ts` (day → phase mapping), `health-signals.ts` (pregnancy chance, variation classification), `trends.ts` (per-cycle stats + symptom-by-phase aggregation), `dates.ts` (ISO date helpers). All tested with vitest. **Single source of truth for prediction math** — never duplicate this in components.

2. **DB** (`src/db/`) — Drizzle ORM over `expo-sqlite`. Schema in `schema.ts`. Hand-written migrations in `migrations.ts` applied at boot from `client.ts`. `repo.ts` is the typed data-access layer + `normalizeSettings()` which sanitises enum values and bridges legacy data (e.g. mapping `standard/teen/pregnancy/perimenopause` → new four-axis values).

3. **Store** (`src/store/cycle.ts`) — Zustand. The *only* thing components consume for cycle/settings state. Composes engine + repo, recomputes prediction + fertile window + cycle day on every `refresh()`.

4. **UI** (`app/` + `src/features/` + `src/ui/`) — Expo Router file-based routes; feature components under `src/features/`; theme tokens + primitives under `src/ui/`. Components must not import from `src/db/` directly — go through `useCycle`.

## Two product axes — they're independent

After the UX review's "Mode" redesign:

- **`LifeMode`** = `cycling | pregnant | perimenopausal | postpartum` — engine axis. Drives what's predicted (pregnant + postpartum disable predictions; perimenopausal floors σ higher for honestly wider bands).
- **`Voice`** = `adult | teen | clinical` — copy axis. Owns terminology (clinical → "menstruation"; adult/teen → "period"). Teen voice surfaces the Learn tab.

A pregnant teen is `lifeMode: 'pregnant'` + `voice: 'teen'`. `getCopy(lifeMode, voice)` returns the right bundle. Migration v4 in `src/db/migrations.ts` mapped legacy single-axis values to the new pair.

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

## Patches

`patches/expo-sqlite+16.0.10.patch` fixes a real upstream bug in `WorkerChannel.ts`: the length prefix is written as `Uint8Array.set(new Uint32Array([length]))`, which only stores the low byte. Results > 255 bytes get truncated → `JSON.parse` fails at position 89 (= 345 & 0xff). Patch swaps it for `new DataView(resultBuffer).setUint32(0, length, true)`. Auto-applied via `postinstall`. **Don't remove.** Web-only path; doesn't affect native.

## Migrations (hand-written, applied at boot)

`src/db/migrations.ts` is the source of truth. Each `Migration { version, sql }` runs in a transaction inside `runMigrations()` (in `src/db/client.ts`). `_migrations` table tracks applied versions.

`stripExistingAlterAddColumns()` filters `ALTER TABLE ... ADD COLUMN` statements against `PRAGMA table_info` at runtime — makes migrations idempotent against a partially-applied state. Adding a new migration: append a `{ version: N+1, sql: '...' }` entry; no schema autogen.

## Stack version gotchas (re-discovery costs time)

- **Reanimated 4** requires the separate `react-native-worklets` package, and `babel.config.js` must reference `'react-native-worklets/plugin'` (not `'react-native-reanimated/plugin'`).
- **`expo-file-system` v19** uses a class-based API: `import { File, Paths } from 'expo-file-system'` then `new File(Paths.cache, name).create()` then `.write(text)`. The legacy `cacheDirectory` / `writeAsStringAsync` exports are gone.
- **`expo-sqlite` on web** loads `wa-sqlite.wasm`. Metro must list `wasm` in `config.resolver.assetExts` (set in `metro.config.js`).
- **`babel-preset-expo`** is a transitive dep but Metro resolves it from the project root → install it as a direct `devDependency` or bundles fail with "Cannot find module 'babel-preset-expo'".
- **`expo-router` 6** pins `react-dom@19.2.x` while the rest of SDK 54 is on `react@19.1`. `npm install --legacy-peer-deps` is required for everything including `npx expo install` (pass `-- --legacy-peer-deps`).

## Test layout

- `src/engine/**/*.test.ts` — pure-logic tests (vitest, node env). 70+ tests covering prediction, learning, phases, fertility, trends, life-modes, edge cases (DST, year boundary, leap day), ICS export, health-signals.
- `vitest.config.ts` aliases `@` → `src/`. No DOM, no React; engine tests never spin up the React Native runtime.
- There is no test runner for components. If you need to test a component, JSDOM has been used as a smoke target (see `scripts/screenshots.mjs` for the Playwright approach we use for marketing screenshots).

## Things explicitly out of scope (per UX review)

- No paywalls or recurring subscriptions.
- No partner *sync* (the existing 14-day signed snapshot stays — it's a privacy-positive differentiator).
- No AI-generated SVG illustrations — the visual identity is too good to dilute. Real iconography is hand-authored in `src/ui/icons/Icon.tsx`.

## Reference docs in repo

- `README.md` — high-level overview + run instructions.
- `STORE_CHECKLIST.md` — end-to-end EAS Build → TestFlight playbook.
- `PRIVACY.md` — privacy policy (also rendered at `docs/privacy.html` for GitHub Pages).
- `APP_REVIEW.md` — App Store reviewer notes to paste at submission.
- `COMPETITIVE_GAPS.md` — Flo/Clue feature gap analysis with 🟢🟡🔵 categorisation.
- `C:\Users\julie\.claude\plans\you-will-build-an-abstract-blanket.md` — the original V1 design plan.
