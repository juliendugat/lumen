/**
 * English copy. Treat this file as the source of truth — every other locale
 * is a translation of these strings.
 *
 * Style guide:
 *  - Sentence case for headings ("Next period", not "Next Period").
 *  - Calm, neutral tone. No "amazing", no exclamation marks.
 *  - Use {0}, {1} for positional args. Don't concatenate strings in code.
 */

const en = {
  app: {
    name: 'Lumen',
    tagline: 'Quiet, body-literate cycle tracking.',
  },

  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    done: 'Done',
    saving: 'Saving…',
    loading: 'Loading…',
    yes: 'Yes',
    no: 'No',
  },

  onboarding: {
    welcomeKicker: 'LUMEN',
    welcomeHeadline: 'Quiet, body-literate cycle tracking.',
    welcomeBody:
      "Your data stays on this device. No accounts. No ads. Predictions get more accurate the more you log — and stay honest about what they don't know.",
    getStarted: 'Get started',
    timeNote: 'Takes about a minute. You can change anything later.',

    step1Of3: 'STEP 1 OF 3',
    lastPeriodHeadline: 'When did your last period start?',
    lastPeriodBody:
      'A rough date is fine. You can refine this later, and edit any day from the calendar.',
    skipForNow: 'Skip for now',
    continue: 'Continue',

    step2Of3: 'STEP 2 OF 3',
    cycleLengthHeadline: 'Your typical cycle',
    cycleLengthBody:
      "If you don't know yet, the defaults are fine — Lumen will learn your real numbers from your next few cycles.",
    cycleLengthLabel: 'Cycle length',
    cycleLengthDesc: 'From the first day of one period to the first day of the next.',
    periodLengthLabel: 'Period length',
    periodLengthDesc: 'How many days you typically bleed.',
    days: 'days',

    step3Of3: 'STEP 3 OF 3',
    finishHeadline: 'A few small choices',
    privacyTitle: 'Privacy first',
    privacyBody:
      "Lumen stores your data only on this device. There's no account, no server, and nothing leaves your phone unless you export it.",
    remindersTitle: 'Reminders',
    remindersBody: 'Quiet local notifications: period expected, period late.',
    openLumen: 'Open Lumen',
    settingUp: 'Setting up…',
  },

  home: {
    today: 'TODAY',
    tapForFullLog: 'Tap the ring for full log',
    quickLogTitle: 'QUICK LOG — TODAY',
    customize: 'CUSTOMIZE',
    nextPeriodKicker: 'NEXT PERIOD',
    headlineToday: 'Today',
    headlineTomorrow: 'Tomorrow',
    headlineInDays: 'In {0} days',
    mostLikely: 'Most likely {0}.',
    window: 'Window: {0}.',
    defaultEstimate:
      'Using default 28-day estimate. Predictions tighten after a couple of cycles.',
    fertileKicker: 'FERTILE WINDOW (ESTIMATE)',
    fertileDisclaimer: 'Estimate based on your cycle pattern. Not a contraceptive method.',
    emptyTitle: 'Log your first period to start',
    emptyBody:
      "Tap the ring to log today's flow, symptoms, mood, or notes. Your data stays on this device.",
  },

  log: {
    flow: 'FLOW',
    symptoms: 'SYMPTOMS',
    mood: 'MOOD',
    bbtTitle: 'Basal body temperature (°C)',
    bbtPlaceholder: 'e.g. 36.45',
    bbtDesc: 'Take it first thing in the morning, before getting out of bed.',
    mucusTitle: 'Cervical mucus',
    sexTitle: 'Sex',
    sexToday: 'Sexual activity today',
    sexProtection: 'Protection used',
    notes: 'NOTES',
    notesPlaceholder: 'Anything worth remembering?',
    futureTitle: 'This day is in the future',
    futureBody: "You can't log a day before it's happened. Come back on or after this date.",
  },

  insights: {
    kicker: 'INSIGHTS',
    headline: 'Your patterns',
    avgCycle: 'AVERAGE CYCLE',
    shortest: 'SHORTEST',
    longest: 'LONGEST',
    regularity: 'REGULARITY',
    quiteRegular: 'Quite regular',
    aBitVariable: 'A bit variable',
    cycleLengthsOverTime: 'CYCLE LENGTHS OVER TIME',
    symptomPatterns: 'SYMPTOM PATTERNS',
    moodShare: 'MOOD SHARE',
    bbtLast: 'BBT — LAST CYCLE',
    cycleHistory: 'CYCLE HISTORY',
    notEnoughTitle: 'Not enough data yet',
    notEnoughBody:
      "After a couple of cycles, you'll see averages, regularity, symptom patterns, and BBT trends here.",
  },

  settings: {
    kicker: 'SETTINGS',
    title: 'Lumen',
    sectionMode: 'MODE',
    sectionPrivacy: 'PRIVACY',
    sectionLogging: 'LOGGING OPTIONS',
    sectionReminders: 'REMINDERS',
    sectionShare: 'SHARE & EXPORT',
    sectionWording: 'WORDING',
    sectionAbout: 'ABOUT',
    appLock: 'App lock',
    appLockDesc: 'Require Face ID, Touch ID, or device passcode.',
    privacyPolicy: 'Privacy policy',
    privacyPolicyDesc: "What's on this device, and what isn't sent.",
    exportJson: 'Export all data (JSON)',
    exportJsonDesc: 'Plain JSON. Save somewhere private.',
    deleteAll: 'Delete all data',
    deleteAllDesc: 'Wipe everything from this device.',
    confirmWipeTitle: 'Delete all data?',
    confirmWipeBody:
      'This will erase every cycle, day log, medication, and setting. It cannot be undone.',
    confirmWipeAction: 'Delete everything',
  },

  privacy: {
    title: 'Your data stays here',
    subtitle: 'Plain English. No clauses, no asterisks.',
  },

  errors: {
    cantStart: "Couldn't start",
    futurePeriod: 'Cannot log a period in the future.',
    sharedArrayBufferDev:
      "The browser hasn't enabled SharedArrayBuffer for this page. That's required for the local database. In dev, run npm run web:isolated and open http://localhost:8082 instead of 8081.",
  },
};

export default en;
