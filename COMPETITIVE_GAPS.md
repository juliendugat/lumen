# Competitive feature gap analysis

Lumen vs Flo, Clue, and the design-study mockups. Captured 2026-05-09 after the UI/UX reskin.

Categorisation:
- **🟢 Could ship** — privacy-compatible (local-only), fits Lumen's architecture, would be additive feature work.
- **🟡 Architecture-shift** — would require a backend or break a privacy promise. Listed for completeness; default answer is "no" for Lumen.
- **🔵 Out of scope by design** — features that conflict with Lumen's calm/literate positioning.

Within each section, items are roughly ordered by user-impact-per-effort.

---

## Logging

### 🟢 Vaginal discharge tracking as a first-class category
*Source: design-study #4, page 1.*
Lumen has `mucus` (sticky / creamy / watery / eggwhite) inside the fertility-mode reveal. Flo and the mockup expose it more prominently with No discharge / Spotting / Sticky / Eggwhite as a tile group, separate from menstrual flow. **Gap:** make this a top-level Flow-tab section regardless of fertility mode; broaden values (clotty, brown, etc).

### 🟢 More granular pain-location symptoms
*Source: design-study #4 page 2 — Pain category contains Cramps · Migraine · Leg · Lower back · Joint · Headache.*
Lumen distinguishes Cramps, Headache, Backache, but not Migraine vs Headache, not Leg, not Joint. **Gap:** split Headache/Migraine; add Leg, Joint, Lower back as discrete entries; keep them grouped in the Pain category.

### 🟢 Hair tracking
*Source: design-study #4 + #7 — Hair category with Oily / Dry / Hairloss.*
Hair changes are a real cycle signal (especially on certain contraception). **Gap:** add a Hair category with Oily / Dry / Hairloss / Greasy roots options.

### 🟢 Skin tracking beyond acne
*Source: implicit across apps.* Lumen has Acne only. **Gap:** add Dry skin, Oily skin, Breakouts on chin/back, Sensitive skin.

### 🟢 Voice memo journal entries
*Source: design-study #4 page 3.*
Lumen has a text-only journal. Voice memos are useful for capturing nuance hands-free. **Gap:** add `expo-av` recording with local file storage; transcribe later (optional, on-device with whisper.cpp once mature, otherwise just playback).

### 🟢 Symptom search bar (already done in reskin)
*Source: design-study #4 page 2.* ✅ Implemented.

### 🟢 Tabbed log: Flow / Symptoms / Journal (already done in reskin)
✅ Implemented.

### 🟡 "What are you feeling today?" — recently-tracked surface
*Source: Flo dashboard.* Surfaces 4 recently-tracked symptoms as illustrated cards on the home screen for one-tap re-logging. Compatible with our local-only model. **Gap:** add a "recently tracked" learned surface that picks the user's top 4 symptoms over the last N cycles.

### 🟢 Day-of-week / contextual trigger tracking
*Source: Flo's "Period Phase started on", "Next Ovulation in".* Lumen shows current cycle day; doesn't surface "which phase started when" as a separate fact. **Gap:** small predictive-report card under the ring showing key event dates.

---

## Predictions & insights

### 🟢 Multi-month "journey" calendar (already done in reskin)
✅ Implemented.

### 🟢 Tabbed insights view (already done in reskin)
✅ Implemented (Overview / Trends / Fertility / Symptoms).

### 🟢 Cycle-phase dot-strip (already done in reskin)
✅ Implemented.

### 🟢 Period actual-vs-expected card (already done in reskin)
✅ Implemented.

### 🟢 Cycle-rhythm line chart over time (already done)
*Source: design-study #6 "On Scroll".* ✅ Implemented (period days + cycle days lines).

### 🟢 Cycle-variation "atypical" warning
*Source: Clue insights.* When variation crosses a threshold (e.g. range > 7 days over last 6 cycles), surface a soft warning: "Cycles vary more than expected — patterns may be worth discussing with a doctor." **Gap:** add a threshold + UI flag; copy already drafted in `reinforcing()`.

### 🟢 Symptom-by-cycle-phase donut chart
*Source: design-study #7 — "Hair loss x14: Period x5, Follicular x3, Ovulation x6, Luteal x0".*
Lumen now shows phase-segmented symptom bars (in the reskin), but a donut + per-phase counts gives more legibility. **Gap:** add a small donut + counts per symptom.

### 🟢 Pregnancy-chance text label on home
*Source: design-study #3 — "Chances of Pregnancy: Low / Moderate / High".*
Could be derived from fertile-window position. Frame carefully — must NOT imply contraceptive efficacy. **Gap:** add a copy-controlled "Pregnancy chance: Low/Moderate/High" line under the headline, with the same "estimate, not contraception" disclaimer.

### 🟢 Upcoming fertile windows preview (already done in reskin)
✅ Implemented (3 upcoming windows on Fertility tab).

### 🟢 Fertility timeline progress bar with peak marker (already done in reskin)
✅ Implemented.

### 🟢 Reinforcing-copy messages (already done in reskin)
✅ Implemented (`reinforcing()` helper used across Insights).

---

## Education / content

### 🟢 Self-care / educational cards on home (already done in reskin)
✅ Implemented (state-aware Self-Care card pulls from Learn).

### 🟢 Phase-explainer "Learn more about the luteal phase"
*Source: Clue dashboard — small inline link with lock icon.*
Lumen has a Learn tab and inline Learn links in the home headline. **Gap:** expand articles list to cover each phase (Follicular, Ovulation, Luteal) explicitly; add deep links from the cycle ring to the relevant article.

### 🟢 "Self-care after a missed/late period" content
*Source: Flo's "Your late period" educational card.* Lumen surfaces "About late periods" via Learn. **Gap:** write a dedicated late-period article with practical context (when to test, when to see a doctor, common reasons).

### 🟢 Body-literacy quiz / progressive learning
*Source: implicit Flo "Your daily insights" ribbon.* Could be done locally. **Gap:** add a "today's tip" rotation pulling from Learn articles, surfaced once per day.

### 🔵 Pregnancy-specific weekly content ("This week your baby is…")
Flo bundles this. Out of scope for Lumen unless we deliberately reposition; would balloon content scope. **Recommendation:** defer indefinitely; if pregnancy-mode users ask for it, partner with an open content provider rather than write it ourselves.

---

## Visual design

### 🟢 Custom illustrated symptom avatars
*Source: Flo, design-studies #3/#4/#7.* Cute little character drawings (cramps person hugging belly, hair-loss person clutching hair, etc) that warm up the chips.
Lumen uses single-color line SVG icons. **Gap:** commission or generate a 30-asset illustration set in a Lumen-specific style (warm-paper background, terracotta + sage palette, ink linework). High visual impact, but holds up the app's visual identity unless done with a clear style guide.

### 🟢 Tile-style logging (already done in reskin for flow)
✅ Implemented for Flow + Mucus + Symptoms in Day-log.

### 🟢 Color-coded per-day dots in the calendar
*Source: design-study #5.* Lumen shades the whole day cell. Their approach uses a small colored dot under the day number, which gives a different at-a-glance shape. **Gap:** consider as an A/B option; current approach is also valid.

---

## Habits / wellness adjacencies

### 🟢 Sleep tracking integration
*Source: implicit across apps; Apple Health.* Lumen has a HealthKit/Health Connect abstraction but no UI for sleep. **Gap:** when Health sync is wired, surface "Sleep this cycle: avg 7h 12m" on Insights and correlate with mood/symptoms.

### 🟢 Activity / step tracking integration
*Source: same as sleep.* **Gap:** same as above — surface activity averages once Health sync is real.

### 🟢 Water intake / hydration log
*Source: not in attached set, but standard adjacency.* Cheap to build. **Gap:** add a daily water-glass counter. Low-priority unless users ask.

### 🔵 Workout suggestions / exercises
Flo and Clue do this. Out of scope — Lumen isn't a fitness app and the editorial cost is non-trivial.

### 🔵 Recipes / nutrition guides
Same as above.

---

## Privacy-incompatible features ("would need a backend")

### 🟡 Partner share — live, not snapshot
*Source: Flo "Partner" tab.* Flo's partner sees real-time updates. Lumen does a 14-day signed snapshot.
**Cost:** real backend, accounts on both sides, sync, partner permissioning.
**Recommendation:** the snapshot model is a clear privacy-positive differentiator. Don't change.

### 🟡 Secret Chats / Messages
*Source: Flo bottom-bar tabs.* Anonymous community / direct messaging.
**Cost:** servers, moderation, abuse handling, real-name verification, regulatory exposure.
**Recommendation:** absolutely not in scope for Lumen.

### 🟡 Cloud account / multi-device sync
*Source: implicit.* Currently users export/import JSON to move devices.
**Cost:** end-to-end-encrypted sync would require a thin backend with zero-knowledge design (think: Standard Notes' approach). Doable but architecturally significant; would need `encryption.md` and a key-derivation flow.
**Recommendation:** ship V1 without; revisit if it becomes the #1 user request. Mention that family/multi-device support is via the existing JSON export/import flow.

### 🟡 Push notifications
*Source: implicit.* Lumen uses local notifications only. A handful of features (e.g. doctor-appointment reminders, partner-acknowledgement push) would benefit from server-pushed messages.
**Recommendation:** keep it local. The current notification surface is enough.

### 🟡 Cycle data sharing with researchers
*Source: Clue's research partnerships.* Genuine science benefit, but requires a backend + consent flow + de-identification pipeline.
**Recommendation:** out of scope for V1; could revisit once Lumen has scale.

### 🟡 In-app community / Q&A
*Source: Flo "Secret Chats".* Same answer as Messages.

---

## Monetisation / business model patterns

### 🔵 Premium subscription paywall
*Source: Clue "Unlock my analysis", Flo Premium.* Both apps gate the most useful insights behind a paywall.
**Recommendation:** Lumen's positioning is clean & private, not freemium-with-paywall-friction. If we ever monetise, prefer:
- One-time pro unlock for a feature pack (no recurring billing), or
- Explicit donation-supported, no paywalls anywhere

Defer the decision until we have a user base.

### 🟡 Sales banners on home ("93% off today")
*Source: Clue.* Antithetical to Lumen's calm positioning. **Recommendation:** never.

### 🟡 Affiliate "Time for a pregnancy test?" cards linking to product
*Source: Flo.* Same as above.

---

## Already in Lumen that these apps don't have (worth marketing)

These are differentiators worth highlighting in store copy, the landing page, and onboarding:

- **Genuinely local-only data**, with privacy nutrition label "Data Not Collected".
- **Confidence band on predictions** (a window, not a fake-precise date).
- **Honest perimenopause mode** with deliberately wider windows.
- **Doctor PDF report** generated entirely on-device, no upload.
- **Time-limited, locally-signed partner share** — sender controls expiry, no account on either side.
- **Teen mode + Learn tab** with body-literacy explainers.
- **Lumen aesthetic** (warm paper + ink + Fraunces + terracotta) is more distinctive than Flo's pink-corporate or Clue's clinical-grey.
- **Confidence-calibrated copy** ("Your rhythm is steady" / "A bit variable, which is normal" / "Cycles vary a fair bit") — not pretending to be more certain than the data warrants.
- **Calendar export to .ics** — file-based, works with any calendar app, no integration handshake.

---

## Suggested priority order if you implement these later

If/when you decide to close gaps, this is roughly the order I'd tackle them:

1. **Vaginal discharge as a top-level Flow section** + **more granular pain symptoms** + **Hair / Skin categories** (one PR, ~half a day).
2. **Pregnancy-chance text on home** (~2 hours; copy-careful).
3. **Symptom-by-phase donut chart** (~2 hours; reuses existing trend data).
4. **Cycle-variation atypical warning** (~1 hour; threshold + copy).
5. **Voice-memo journal entries** (~half a day; expo-av, file storage, simple playback).
6. **Phase-specific Learn articles + deep-link from ring** (~half a day; content + wiring).
7. **Custom illustrated symptom avatars** (large undertaking — defer until you have a designer or generate a coherent set).

Skip everything in the 🟡 and 🔵 sections unless the project's positioning intentionally shifts.
