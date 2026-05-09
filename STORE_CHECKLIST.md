# Lumen — Store Submission Checklist

End-to-end path from "Windows machine, no Mac" to "Lumen on a real iPhone via TestFlight". Mirror process for Google Play included at the end.

---

## Phase 0 — One-off accounts (do this first)

These have lead times. Start them while you're scaffolding so they're ready when the build is.

- [ ] **Apple Developer Program** — $99/year, https://developer.apple.com/programs/. Sign in with the Apple ID you want to publish under. Activation email arrives in **24-48 hours**.
- [ ] **Expo account** — free, https://expo.dev. Note your `username` (it goes in `app.json` as `owner`).
- [ ] **Google Play Console** *(only when you're ready for Android)* — $25 one-off, https://play.google.com/console.
- [ ] **Public privacy-policy URL.** App stores require one. Easiest: enable GitHub Pages on this repo and serve `PRIVACY.md`. Note the resulting URL (e.g. `https://<you>.github.io/lumen/privacy.html`) — you'll paste it into both stores.

---

## Phase 1 — Local dev tooling

```sh
npm install --legacy-peer-deps
npm install -g eas-cli
eas login          # uses your Expo username
```

Confirm everything still passes:
```sh
npm run typecheck
npm test
```

Both should be green before continuing.

---

## Phase 2 — Wire up `app.json` and `eas.json`

Open `app.json` and fill in:

- `expo.owner` — your Expo username (e.g. `"julien96"`).
- `expo.extra.eas.projectId` — leave empty for now; `eas init` will fill it.

Open `eas.json` and fill in the `submit.production.ios` block:

- `appleId` — the Apple ID email you enrolled with.
- `ascAppId` — the App Store Connect app ID. You'll get this in Phase 4 after creating the App Store listing.
- `appleTeamId` — found at https://developer.apple.com/account → "Membership details" → Team ID (10 chars).

For Android, the `serviceAccountKeyPath` requires a Google Play service account JSON; defer until Phase 7.

Then:
```sh
eas init               # creates the EAS project, writes projectId into app.json
eas credentials        # interactive; pick iOS → managed → let it generate the cert + provisioning profile
```

EAS does the certificate dance for you. No need to touch the Apple Developer portal manually.

---

## Phase 3 — First build (TestFlight-bound)

```sh
eas build --platform ios --profile preview
```

What this does:
- Builds on EAS's macOS workers (free tier: ~10-30 min wait + ~10 min build; priority: ~5 min wait + ~10 min build).
- Outputs an `.ipa` artifact, downloadable from the build page.
- The `preview` profile sets `BABEL_ENV=production` so console.log is stripped.

Watch the build:
- Console URL is printed when the command starts.
- Same info at https://expo.dev/accounts/<owner>/projects/lumen/builds.

If the build fails on first attempt, the most common causes:
- **Credentials**: re-run `eas credentials` and let EAS regenerate.
- **`react-native-worklets` peer issue**: bump to `--legacy-peer-deps` in `eas.json`'s `npm` config (already accounted for).
- **iOS deployment target**: SDK 54 targets iOS 15.1; should be fine.

---

## Phase 4 — App Store Connect listing

1. Go to https://appstoreconnect.apple.com → My Apps → "+".
2. Platform: iOS · Name: **Lumen** · Primary language: English · Bundle ID: pick **com.lumen.app** from the dropdown (it appears once Apple Developer activates and EAS has registered it via `eas build:configure`) · SKU: `lumen-001`.
3. Once created, the app's "ASC App ID" appears in the URL (`/apps/<id>/`). Paste that into `eas.json` `submit.production.ios.ascAppId`.
4. Fill in metadata (you can do this while Phase 3 builds):
   - **Subtitle**: "Quiet, body-literate cycle tracking"
   - **Description**: see "Store description" below.
   - **Keywords**: `period,cycle,tracker,menstrual,fertility,private,offline,calendar,reminder,ovulation`
   - **Support URL**: GitHub repo URL or your support email page.
   - **Marketing URL**: optional.
   - **Privacy Policy URL**: from Phase 0.
   - **Category**: Health & Fitness (primary), Lifestyle (secondary).
   - **Age rating**: 12+ (or 17+ if Sex log is enabled by default; we ship it off so 12+ is correct).
5. **App Privacy** ("Privacy Nutrition Label"):
   - "Data Not Collected" — *select this option*. Lumen genuinely collects nothing. The privacy manifest in `app.json` reflects the same.
6. **App Review Information**:
   - Demo account: not required (no login).
   - Notes: "Lumen stores all data locally. No accounts, no servers. To exercise full functionality, allow notifications and biometrics during onboarding."

---

## Phase 5 — Submit the build to TestFlight

Once Phase 3 build succeeds:

```sh
eas submit --platform ios --latest
```

This uploads the `.ipa` from your latest build to App Store Connect. Apple processes it (~5-15 min) and emails you when ready.

**Once processed:**
1. App Store Connect → Lumen → TestFlight tab.
2. "Internal Testing" → add yourself as a tester (uses your Apple ID).
3. On your iPhone, install **TestFlight** from the App Store. You'll get an email with an "Open in TestFlight" button → install → Lumen launches.

Internal testers (up to 100) skip Apple's review. External testing (up to 10k) requires a beta review (1-2 days). For your QA pass, internal is plenty.

---

## Phase 6 — Iteration loop

For each new build with changes:

```sh
eas build --platform ios --profile preview --auto-submit
```

`--auto-submit` chains a `submit` after the build. New build appears in TestFlight ~30 min later.

App version tracking: `eas.json` has `appVersionSource: "remote"` and `production` has `autoIncrement: true`, so the build number bumps for you. `expo.version` in `app.json` is the user-facing version (`0.2.0`); bump it when you ship a meaningful change.

---

## Phase 7 — Production submission to App Store

When ready for public release (not TestFlight):

```sh
eas build --platform ios --profile production
eas submit --platform ios --latest
```

In App Store Connect → "Distribution" → "Submit for Review". Apple's first-time review usually takes 1-3 days. Common rejection reasons for a period tracker:

- **Health claims** in metadata — keep description neutral, don't claim contraception or pregnancy diagnosis.
- **Missing privacy policy URL** — already covered.
- **Vague crash reports** — covered by ErrorBoundary + diagnostics screen.
- **Onboarding-mandatory permissions** — Lumen requests notifications and biometrics just-in-time; not blocking. Good.

---

## Phase 8 — Android via Google Play (parallel track)

You can do Android any time, no Mac needed and no $99/year — just one $25 fee.

1. Sign up at https://play.google.com/console ($25, lifetime).
2. Create app: name **Lumen**, default language English, app/game = App, free.
3. Generate a service account in Google Cloud → assign Play Console permissions → download JSON → put at `.secrets/google-play-service-account.json` (and add `.secrets/` to `.gitignore`).
4. Build:
   ```sh
   eas build --platform android --profile production
   eas submit --platform android --latest
   ```
5. Internal testing in Play Console, then closed → open → production.

---

## Store description (copy-pasteable)

> **Lumen — quiet, body-literate cycle tracking.**
>
> A calm, private cycle tracker that learns your patterns and stays out of your way.
>
> Lumen stores everything on your device. No accounts. No servers. No analytics. No advertising. Nothing leaves your phone unless you choose to export it.
>
> **What it does**
> • One-tap period logging from the home screen
> • Honest predictions — a window with a confidence band that tightens as Lumen learns your cycle
> • Symptoms, mood, BBT, mucus, sex log (opt-in), medications and reminders
> • Calendar export to iOS Calendar, Google Calendar, Outlook
> • Insights: average cycle length, regularity, symptom patterns over time
> • Doctor PDF report — last 12 months of cycles, symptoms, medications
> • Partner share — a read-only, time-limited snapshot
>
> **Modes for different stages**
> • Standard
> • Teen — friendlier copy and a Learn tab with body-literacy explainers
> • Pregnancy — predictions pause, weeks-pregnant view
> • Perimenopause — wider, honest prediction windows
>
> **Privacy by design**
> • Local-only SQLite database in the app sandbox
> • Optional Face ID / Touch ID / passcode lock
> • Encryption key generated on first launch and stored in the device's secure enclave
> • Calendar export, doctor PDF, partner share — all generated on your phone
> • App Store Privacy Label: Data Not Collected
>
> Lumen is not a contraceptive. Fertility-window estimates are calculations from your cycle pattern, not medical advice.

---

## Reference: file map

- `app.json` — Expo config, bundle ID, splash, plugins, privacy manifest.
- `eas.json` — build profiles + submit credentials.
- `assets/icon.png`, `adaptive-icon.png`, `favicon.png`, `splash-icon.png` — generated by `node scripts/build-icon.mjs`.
- `PRIVACY.md` — public privacy policy. Host this on GitHub Pages or any static host.
- `patches/expo-sqlite+16.0.10.patch` — bug fix; auto-applied by `postinstall`.

---

## Quick reference

| Task | Command |
|---|---|
| First-time setup | `eas init && eas credentials` |
| Dev build (custom client) | `eas build -p ios --profile development` |
| Internal preview | `eas build -p ios --profile preview` |
| Submit latest preview to TestFlight | `eas submit -p ios --latest` |
| Production build | `eas build -p ios --profile production` |
| Build status / logs | https://expo.dev/accounts/&lt;owner&gt;/projects/lumen/builds |

---

## Things that bite first-timers

- **Apple Developer activation lag.** You'll see "pending" for ~24h. Use that time to write store description + screenshots.
- **Bundle ID conflict.** If `com.lumen.app` is already taken (it might be — it's a desirable name), you'll need to pick another. Update `app.json` ios.bundleIdentifier and android.package, then rerun `eas credentials`.
- **Screenshot dimensions.** App Store needs 6.7" iPhone screenshots (1290×2796). Take them on a real device or in Xcode simulator (mac), or use a Figma template — multiple online generators accept any-size images and produce store-ready ones.
- **Beta review for external testers.** Internal testing is instant; if you want a non-developer to test, "External" testing has a 1-2 day Apple review.
- **App name uniqueness.** "Lumen" may collide with an existing iOS app; if App Store Connect rejects the name, fall back to a variant ("Lumen Cycle", "Lumen Period", etc.) or pick a new working name.
