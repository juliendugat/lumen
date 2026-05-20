import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { Icon, type IconName } from '@/ui/icons/Icon';
import { getTrendDays, parseArr, getDay } from '@/db/repo';
import { useCycle } from '@/store/cycle';
import { todayISO } from '@/engine/dates';
import { ALL_SYMPTOM_ITEMS } from '@/features/day-log/symptomCatalog';

export type LearnedSymptom = { value: string; label: string; icon: IconName; count: number };

/** Minimum number of distinct learned symptoms before we surface the card. */
export const RECENTLY_TRACKED_MIN = 3;

/**
 * Learns the user's top-4 most-tracked symptoms over the last ~90 days.
 * Shared between {@link RecentlyTracked} (which renders them) and the home
 * "More for today" drawer (which counts them for its badge) so the two never
 * disagree about whether the card is visible.
 */
export function useLearnedSymptoms(): LearnedSymptom[] {
  const [learned, setLearned] = useState<LearnedSymptom[]>([]);
  useEffect(() => {
    (async () => {
      const days = await getTrendDays();
      const recent = days.slice(-90);
      const counts = new Map<string, number>();
      for (const d of recent) {
        for (const s of d.symptoms ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
      }
      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([value, count]) => {
          const item = ALL_SYMPTOM_ITEMS.find((s) => s.value === value);
          return {
            value,
            count,
            label: item?.label ?? value,
            icon: (item?.icon ?? 'sparkle') as IconName,
          };
        });
      setLearned(sorted);
    })();
  }, []);
  return learned;
}

/**
 * "What are you feeling today?" — Flo dashboard pattern. Surfaces the user's
 * top 4 recently-tracked symptoms as one-tap toggle cards.
 *
 * `learned` is supplied by the parent (via {@link useLearnedSymptoms}) so the
 * drawer badge and this card share a single source of truth. Returns null when
 * the user hasn't tracked enough symptoms yet.
 */
export function RecentlyTracked({
  todaySymptoms,
  learned,
}: {
  todaySymptoms: string[];
  learned: LearnedSymptom[];
}) {
  const t = useTheme();
  const { patchDay } = useCycle();
  const [today, setToday] = useState<string[]>(todaySymptoms);

  useEffect(() => setToday(todaySymptoms), [todaySymptoms]);

  if (learned.length < RECENTLY_TRACKED_MIN) return null; // not enough signal

  const isOn = (v: string) => today.includes(v);
  const toggle = async (v: string) => {
    const isoToday = todayISO();
    const day = await getDay(isoToday);
    const current = parseArr(day?.symptomTags);
    const next = current.includes(v)
      ? current.filter((x) => x !== v)
      : [...current, v];
    setToday(next);
    await patchDay(isoToday, { symptomTagsArr: next });
  };

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="micro" color={t.palette.inkMuted}>
        WHAT ARE YOU FEELING?
      </Text>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        {learned.map((l) => {
          const on = isOn(l.value);
          return (
            <Pressable
              key={l.value}
              onPress={() => toggle(l.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Toggle ${l.label}`}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: 6,
                paddingVertical: t.spacing.md,
                backgroundColor: on ? t.palette.flowMedium : t.palette.paperDeep,
                borderRadius: t.radii.lg,
                borderWidth: 1,
                borderColor: t.palette.paperEdge,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon name={l.icon} size={22} color={on ? t.palette.paper : t.palette.ink} />
              <Text
                variant="micro"
                color={on ? t.palette.paper : t.palette.inkSoft}
                align="center"
              >
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
