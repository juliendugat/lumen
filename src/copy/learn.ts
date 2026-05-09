/**
 * Body-literacy explainers used in the Learn tab (visible in teen mode).
 * Plain language, neutral tone, no "you should" — just what's happening.
 */

import { type IconName } from '@/ui/icons/Icon';

export type LearnArticle = {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  body: string[];
};

export const articles: LearnArticle[] = [
  {
    id: 'cycle-basics',
    icon: 'flower',
    title: 'What is a menstrual cycle?',
    summary: "It's not just the bleeding part. The whole month is the cycle.",
    body: [
      "A menstrual cycle is the rhythm of changes the body goes through every month or so. It's counted from the first day of one period to the first day of the next.",
      "Most cycles are between 21 and 35 days. They're often irregular for the first couple of years after periods start — that's normal.",
      "Inside the cycle, there are roughly four phases: the period (bleeding), the follicular phase (your body preps an egg), ovulation (egg is released), and the luteal phase (your body waits to see if the egg was fertilised).",
    ],
  },
  {
    id: 'first-period',
    icon: 'drop',
    title: 'The first few periods',
    summary: 'They can be unpredictable for a while. That part is normal.',
    body: [
      "When periods first start, the cycle is often irregular — sometimes a few weeks, sometimes a few months. The body is figuring out a rhythm.",
      "Bleeding can vary too: light, heavy, brown, clotty. All of that can be normal.",
      "If something feels seriously off — really heavy bleeding, severe pain, periods that stop entirely after starting — it's worth talking to a doctor or someone you trust.",
    ],
  },
  {
    id: 'cramps',
    icon: 'cramps',
    title: 'Why cramps happen',
    summary: 'The uterus is squeezing. Here’s what helps.',
    body: [
      "Cramps come from the uterus contracting to shed its lining. Hormones called prostaglandins drive this — more prostaglandins, stronger cramps.",
      "What can help: a heating pad on the lower belly, gentle movement, painkillers like ibuprofen if appropriate for you, staying warm and hydrated.",
      "If pain stops you doing normal things every cycle, that's worth a doctor's visit — sometimes it points to something specific like endometriosis.",
    ],
  },
  {
    id: 'mood',
    icon: 'cloud',
    title: 'Mood across the cycle',
    summary: 'Energy, focus, and feelings shift with hormones.',
    body: [
      "Hormones change through the cycle — estrogen rises and falls, then progesterone rises and falls. That can shift mood, energy, sleep, hunger and skin.",
      "A common pattern: more energy mid-cycle, more sensitive or low in the few days before a period. Logging mood for a few cycles often makes a clear pattern visible.",
      "If mood crashes hard every month and disrupts life, that's sometimes called PMDD — talk to a doctor if it sounds like you.",
    ],
  },
  {
    id: 'fertile-window',
    icon: 'leaf',
    title: 'Fertile window — what it means',
    summary: 'A few days each cycle when pregnancy is possible.',
    body: [
      "Each cycle there's a window of about 5–6 days when getting pregnant is possible. It's the days leading up to ovulation, plus the day after.",
      "Apps estimate this from your cycle pattern — but ovulation timing can shift, especially in the first few years and around stress, illness, or travel.",
      "Estimated fertile windows are NOT a contraceptive method. If you're sexually active and don't want to be pregnant, talk to a doctor or trusted adult about birth-control options.",
    ],
  },
  {
    id: 'follicular',
    icon: 'sun',
    title: 'The follicular phase',
    summary: 'After the period, before ovulation. Energy builds.',
    body: [
      "After your period ends, the body starts preparing an egg for release. This is the follicular phase. Estrogen rises steadily, and many people notice their energy, mood, and skin improve through it.",
      "Cycle days roughly 6 to 13 in a 28-day cycle, though it stretches for longer cycles.",
      "It's a good time for harder workouts and demanding work if your body welcomes them — though listen to yourself first, not the chart.",
    ],
  },
  {
    id: 'ovulation',
    icon: 'flower',
    title: 'Ovulation',
    summary: "An egg is released. The day or two of peak fertility.",
    body: [
      "Around the middle of the cycle, the ovary releases an egg into the fallopian tube. Estrogen peaks, and a sharp rise in luteinising hormone triggers the release.",
      "Some people feel a one-sided twinge (\"mittelschmerz\"), a slight rise in basal body temperature the day after, or notice their cervical mucus becomes clear and stretchy like raw egg white.",
      "The egg lives 12-24 hours; sperm can survive a few days. So the fertile window covers ovulation day and the few days before.",
    ],
  },
  {
    id: 'luteal',
    icon: 'moon',
    title: 'The luteal phase',
    summary: 'Post-ovulation. Progesterone rises. PMS-y feelings can show up.',
    body: [
      "After ovulation, the empty follicle becomes the corpus luteum and starts producing progesterone. The body is preparing in case the egg was fertilised.",
      "Progesterone can dampen mood, raise body temperature slightly, slow digestion, and bring food cravings or breast tenderness in the week before a period.",
      "If pregnancy doesn't happen, progesterone falls, the uterine lining sheds, and the next period starts. The luteal phase is usually 12-14 days — much more consistent than the follicular phase.",
    ],
  },
  {
    id: 'late-period',
    icon: 'flag',
    title: "When a period is late",
    summary: 'Common reasons, and when to talk to a doctor.',
    body: [
      "If a period is a few days later than expected, that's usually within normal variation — especially after stress, travel, illness, big sleep changes, or starting / stopping certain medications.",
      "Lifestyle factors that can shift cycle timing: significant weight change, intense exercise, irregular sleep, recent contraception change, or major emotional stress.",
      "If you've been sexually active without protection, a pregnancy test about 2-3 weeks after the possible conception date is the most reliable check. Earlier tests can give false negatives.",
      "Worth talking to a doctor if: a period is more than a few weeks late, cycles regularly skip or run unpredictably for several months, or you're getting unexplained pain. None of this is a diagnosis — patterns are just clues.",
    ],
  },
  {
    id: 'iron',
    icon: 'sparkle',
    title: 'Bleeding and energy',
    summary: 'Heavier flows can dip your iron levels.',
    body: [
      "Your body loses a small amount of iron each period. If flows are heavy or long, iron stores can drop and leave you feeling tired or out of breath.",
      "Iron-rich foods help: red meat, beans and lentils, leafy greens, fortified cereals, eggs. Vitamin C with iron-rich plant foods helps absorption.",
      "If you're often exhausted, especially around your period, ask a doctor about a ferritin (iron-stores) blood test.",
    ],
  },
  {
    id: 'privacy',
    icon: 'shield',
    title: 'Why privacy matters here',
    summary: 'Your cycle data is private — and Lumen keeps it that way.',
    body: [
      "Period and cycle data is health data. Lumen stores everything on this device only — no accounts, no servers, nothing leaves your phone unless you choose to export it.",
      "If a phone is shared, you can turn on Face ID / Touch ID lock in Settings. Only you can open the app.",
      "If you ever want to wipe the slate clean, Settings → Delete all data does exactly that.",
    ],
  },
];
