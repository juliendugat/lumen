import { Pressable, View } from 'react-native';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { addDaysISO, todayISO, type ISODate, fromISO } from '@/engine/dates';

type Props = {
  /** ISO date currently focused. Default: today. */
  selected?: ISODate;
  /** Number of days to show; default 7 centred on today (today is rightmost). */
  days?: number;
  /** Map of ISO date -> phase color (or null). Used for coloured dots beneath day numbers. */
  dots?: Map<string, string | null>;
  onSelect?: (date: ISODate) => void;
};

/**
 * 7-day strip with selectable day pills, like Flo / Clue / the design study.
 * Today is rightmost (cannot tap the future). Dots under each day reflect
 * logged-period or fertile state when supplied.
 */
export function WeekStrip({ selected, days = 7, dots, onSelect }: Props) {
  const t = useTheme();
  const today = todayISO();
  const items: Array<{ iso: ISODate; dayNum: number; weekLetter: string }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = addDaysISO(today, -i);
    const d = fromISO(iso);
    items.push({
      iso,
      dayNum: d.getDate(),
      weekLetter: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
    });
  }
  const sel = selected ?? today;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
      accessibilityRole="tablist"
    >
      {items.map((it) => {
        const isSelected = it.iso === sel;
        const isToday = it.iso === today;
        const dot = dots?.get(it.iso) ?? null;

        return (
          <Pressable
            key={it.iso}
            onPress={() => onSelect?.(it.iso)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={fromISO(it.iso).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            hitSlop={6}
            style={{
              alignItems: 'center',
              gap: 6,
              paddingVertical: 4,
              flex: 1,
            }}
          >
            <Text
              variant="micro"
              color={isSelected ? t.palette.ink : t.palette.inkFaint}
              style={{ letterSpacing: 1 }}
            >
              {isToday ? 'TODAY' : it.weekLetter}
            </Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isSelected ? t.palette.ink : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant="bodyStrong"
                color={isSelected ? t.palette.paper : t.palette.ink}
              >
                {it.dayNum}
              </Text>
            </View>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: dot ?? 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
