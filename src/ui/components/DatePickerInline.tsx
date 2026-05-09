import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays, addMonths, format, isAfter, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type Props = {
  value: Date | null;
  onChange: (d: Date) => void;
  /** Days in the future are not selectable. */
  maxDate?: Date;
  /** Days more than `maxDaysAgo` ago not selectable. Default: 90. */
  maxDaysAgo?: number;
};

/**
 * Inline month-grid date picker. Tappable cells, no native modal — works
 * identically on web and native, looks consistent with the rest of the UI.
 */
export function DatePickerInline({ value, onChange, maxDate, maxDaysAgo = 90 }: Props) {
  const t = useTheme();
  const [cursor, setCursor] = useState<Date>(startOfMonth(value ?? new Date()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = maxDate ?? today;
  const minAllowed = addDays(today, -maxDaysAgo);

  const cells = useMemo(() => buildMonth(cursor), [cursor]);

  return (
    <View style={{ gap: t.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => setCursor(addMonths(cursor, -1))}
          style={{ padding: t.spacing.sm }}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text variant="bodyStrong">‹</Text>
        </Pressable>
        <Text variant="bodyStrong">{format(cursor, 'MMMM yyyy')}</Text>
        <Pressable
          onPress={() => {
            const next = addMonths(cursor, 1);
            if (!isAfter(startOfMonth(next), startOfMonth(today))) setCursor(next);
          }}
          style={{ padding: t.spacing.sm }}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text variant="bodyStrong">›</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text
            key={i}
            variant="micro"
            color={t.palette.inkFaint}
            align="center"
            style={{ flex: 1 }}
          >
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isSel = !!value && isSameDay(d, value);
          const tooNew = isAfter(d, max);
          const tooOld = d.getTime() < minAllowed.getTime();
          const disabled = tooNew || tooOld;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={format(d, 'PPP')}
              accessibilityState={{ selected: isSel, disabled }}
              disabled={disabled}
              onPress={() => onChange(d)}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSel ? t.palette.ink : 'transparent',
                  opacity: disabled ? 0.25 : inMonth ? 1 : 0.4,
                }}
              >
                <Text
                  variant="body"
                  color={isSel ? t.palette.paper : t.palette.ink}
                >
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function buildMonth(cursor: Date): Date[] {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  return cells;
}
