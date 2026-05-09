# Lumen

Quiet, body-literate cycle tracking. Local-only, no accounts, no servers.

## Stack

- **Expo SDK 54 / React Native 0.81 / React 19**
- **TypeScript strict**
- **Expo Router** — file-based navigation under `app/`
- **expo-sqlite + Drizzle ORM** — typed local DB, migrations on boot
- **Zustand** — UI state
- **react-native-svg + react-native-reanimated** — animated cycle ring
- **Vitest** — pure-logic tests for the prediction engine

## Run

```sh
npm install --legacy-peer-deps
npm run web:isolated    # browser preview at http://localhost:8082 (recommended)
# npm run web           # plain Metro on 8081 — DB will fail without isolation
# npm run android       # requires Android Studio / EAS Build
# npm run ios           # requires macOS — use EAS for cloud builds
```

**Why `web:isolated`.** `expo-sqlite` on web uses wa-sqlite, which needs
`SharedArrayBuffer`. Browsers only expose `SharedArrayBuffer` when the page is
*cross-origin isolated* (COOP + COEP headers). Expo's dev server doesn't set
those, so we run a small proxy (`scripts/dev-proxy.mjs`) on port 8082 that
forwards to Metro on 8081 and injects the headers. The proxy preserves HMR via
WebSocket upgrade.

`--legacy-peer-deps` is needed because `expo-router` pins `react-dom@19.2.x` while
the rest of the SDK matrix is on `19.1`. They're runtime-compatible.

## Test

```sh
npm test           # vitest, all engine + ICS tests
npm run typecheck  # tsc --noEmit
```

The prediction engine has 30 tests including a synthetic-cycle accuracy harness
(MAE ≤ 1.5 days at 12 history points, ~80 % confidence-band coverage).

## Project layout

```
app/
├── _layout.tsx               root: theme, app-lock, onboarding gate
├── (onboarding)/             welcome → last period → cycle length → finish
├── (tabs)/
│   ├── index.tsx             home: cycle ring + quick-log + next prediction
│   ├── calendar.tsx          month grid with prediction overlays
│   ├── insights.tsx          stats: avg cycle, regularity
│   └── settings.tsx          privacy, lock, exports, delete-all
└── log/[date].tsx            day-detail modal: flow, symptoms, mood, notes

src/
├── engine/                   pure prediction logic (no React, no DB)
│   ├── predict.ts            recency-weighted mean + variance + 80% band
│   ├── learn.ts              σ blending from prediction residuals
│   ├── fertility.ts          luteal-phase-based fertile window estimate
│   ├── dates.ts              ISO-string date helpers
│   └── *.test.ts
├── db/
│   ├── schema.ts             Drizzle table definitions
│   ├── migrations.ts         hand-written, run at boot
│   ├── client.ts             encrypted-ready SQLite client
│   └── repo.ts               typed data-access functions
├── store/
│   ├── cycle.ts              central useCycle hook (composes engine + repo)
│   └── onboarding.ts         transient onboarding state
├── lib/
│   ├── crypto.ts             SecureStore-backed key management
│   ├── biometric-lock.ts     Face ID / Touch ID / passcode
│   ├── notifications.ts      local-only scheduling (no push tokens)
│   └── ics.ts                .ics export
├── features/
│   └── cycle-ring/CycleRing.tsx
└── ui/
    ├── theme.ts              warm-paper / dark palettes, typography, motion
    ├── ThemeProvider.tsx
    ├── components/           Text, Button, Chip, Card, Stack, Screen, …
    └── icons/TabIcon.tsx
```

## Privacy posture

- **No network.** No accounts, no servers, no analytics, no crash reporting.
- **Local SQLite** in the app sandbox. iCloud / Google Drive backup is opted out
  via `app.json` (`usesIcloudStorage: false`, `allowBackup: false`).
- **Encryption-at-rest** is wired for native (key generated at first launch and
  stored in Keychain/Keystore via `expo-secure-store`). The current
  `expo-sqlite` build does not enable SQLCipher; swapping in a SQLCipher-enabled
  build is a straightforward follow-up — `src/db/client.ts` is the only file
  that needs to know about it.
- **App lock** uses `expo-local-authentication`. On web, lock is unavailable
  and the toggle is disabled.
- **Notifications** are local only — no push tokens are ever generated.
- **Export / delete** live one screen away on the Settings tab.

## Web build notes

`expo-sqlite` runs on web via `wa-sqlite` (WASM, IndexedDB-backed). Make sure
`metro.config.js` keeps `wasm` in `assetExts` so the WASM module resolves.

## What's in this build

### V1
- Cycle ring home screen, one-tap log, calendar view with predictions, .ics export, local notifications, biometric lock, JSON export / wipe-all, encryption-key in SecureStore (SQLCipher PRAGMA wired — kicks in on a SQLCipher-enabled native build).
- **Teen mode** — friendlier copy, body-literacy "Learn" tab with 7 illustrated explainers (cycle basics, first periods, cramps, mood, fertile window, iron, privacy). Toggle in Settings → Mode.
- **Privacy policy** in-app screen (Settings → Privacy policy).
- Custom fonts (Fraunces + Inter) loaded via `expo-font` / Google Fonts.
- 38 SVG icons (symptoms, moods, flow, tracking, app actions); 7 hero SVG illustrations.

### V1.5
- **Quick-bar customization** — pick 3-6 chips on the home screen (Settings → Customize quick-bar).
- **Symptom trends** — for each tracked symptom, distribution across cycle days + automatic hotspot detection (≥50% of occurrences in the smallest contiguous window).
- **Medications** — pill / patch / IUD / implant / other. Daily or 21-on-7-off cycle schedules. Local reminders 7 days ahead, rescheduled on edits.
- **Sex & protection log** — opt-in toggle in Settings → Logging options.
- **BBT & cervical mucus** — appear in day-log when fertility tracking is on; BBT chart on the Insights tab.
- **Fertility-awareness mode** — Off / Track / Avoidance / TTC.
- **HealthKit / Health Connect** — abstraction layer (`src/lib/health-sync.ts`) ready to wire to `react-native-health` / `react-native-health-connect` in a custom dev client. UI degrades cleanly when unavailable.

### V2
- **Pregnancy mode** — pauses predictions, shows weeks-pregnant computed from LMP. `/pregnancy-setup` for the LMP picker.
- **Perimenopause mode** — relaxes σ floor and surfaces wider, honest windows.
- **Doctor PDF report** — 12-month cycle summary with stats, per-cycle table, symptom clusters, mood share, medications. `expo-print` on native, print dialog on web.
- **Partner share** — locally-generated, time-limited (14 day) HTML snapshot with sha256 integrity tag. Native: file share. Web: opens in a new tab.
- **Multi-cycle insights dashboard** — average / shortest / longest / regularity, cycle-length bar chart over time, symptom trend bars, mood share bars, BBT line chart, cycle history list.

### Skipped (need macOS / native code beyond scope)
- Apple Watch / Wear OS complications
- iOS / Android home-screen widgets
- Real HealthKit / Health Connect modules (abstraction is in place; just needs the native package added in a custom dev client)

## Shipping

The full path from "Windows machine, no Mac" to "Lumen on a real iPhone via TestFlight" is in [STORE_CHECKLIST.md](./STORE_CHECKLIST.md). High level:

1. Apple Developer Program ($99/yr — start now, takes 24-48h to activate).
2. `npm install -g eas-cli && eas login`.
3. Edit `app.json` — set `expo.owner` and `expo.extra.eas.projectId` (the latter is filled by `eas init`).
4. Edit `eas.json` — fill in `submit.production.ios` block with your Apple ID, ASC App ID, Apple Team ID.
5. `npm run eas:preview` — first cloud build (~30 min).
6. `npm run eas:submit` — pushes to TestFlight.
7. Install TestFlight on iPhone, accept invite, install Lumen.

The `preview` and `production` build profiles set `BABEL_ENV=production`, which strips dev-only `console.log` calls via `babel-plugin-transform-remove-console`.

The privacy policy is in [PRIVACY.md](./PRIVACY.md) — host this on GitHub Pages or any static host and paste the URL into App Store Connect's "Privacy Policy URL" field.

App icon set is generated from `assets/icon-source.svg` via `npm run build:icons`. Edit `scripts/build-icon.mjs` if you want to tweak.

## Roadmap (open follow-ups)

- Screenshots for App Store / Play Store (need a real device or simulator with macOS).
- Real-device accessibility pass (VoiceOver/TalkBack walk-through, Dynamic Type at largest size).
- Custom dev client with SQLCipher-enabled `expo-sqlite` + `react-native-health` + `react-native-health-connect`.
- App-store name verification (Lumen may collide with an existing app).
