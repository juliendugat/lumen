import { View } from 'react-native';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { buildPhaseStrip, phaseDefaultsFor, type CyclePhase } from '@/engine/phases';

type Props = {
  cycleLength: number;
  periodLength: number;
  /** 1-based; pass null to omit the highlight dot. */
  currentDay?: number | null;
  /** When supplied, marks `currentDay` with a circle outline. */
  highlightCurrent?: boolean;
  /** Override fertile window (days 1-based). Default: derived from cycleLength. */
  fertileStart?: number;
  fertileEnd?: number;
  fertilePeak?: number;
  /** Width to fill. Defaults to flex layout. */
  width?: number;
  /** Bar height — paper version is 18, compact is 10. */
  barHeight?: number;
  /** Use compact dots (no peak marker, no current ring) for inline use in cards. */
  compact?: boolean;
};

/**
 * Horizontal cycle-phase strip: each cycle day is a colored "dot" (a tall
 * pill, like the segments in pictures #6 and #7). Phases are color-coded
 * (period red · follicular honey · ovulation teal · luteal sage).
 *
 * The most distinctive UI element borrowed from Flo / Clue / the design
 * studies — gives at-a-glance shape to a whole cycle.
 */
export function PhaseStrip({
  cycleLength,
  periodLength,
  currentDay,
  highlightCurrent,
  fertileStart,
  fertileEnd,
  fertilePeak,
  width,
  barHeight = 18,
  compact = false,
}: Props) {
  const t = useTheme();
  const defaults = phaseDefaultsFor(cycleLength, periodLength);
  const days = buildPhaseStrip({
    cycleLength: defaults.cycleLength,
    periodLength,
    fertileStart: fertileStart ?? defaults.fertileStart,
    fertileEnd: fertileEnd ?? defaults.fertileEnd,
    fertilePeak: fertilePeak ?? defaults.fertilePeak,
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        width,
      }}
      accessibilityRole="image"
      accessibilityLabel={
        currentDay
          ? `Cycle day ${currentDay} of ${days.length}`
          : `Cycle of ${days.length} days`
      }
    >
      {days.map((info, i) => {
        const day = i + 1;
        const isCurrent = currentDay === day;
        const color = colorFor(info.phase, info.peak, t.palette);
        const ringW = compact ? 4 : 6;

        if (isCurrent && highlightCurrent && !compact) {
          // Render a slightly larger highlighted segment
          return (
            <View
              key={day}
              style={{
                flex: 1,
                height: barHeight + 4,
                backgroundColor: color,
                borderRadius: barHeight,
                borderWidth: 1.5,
                borderColor: t.palette.ink,
              }}
            />
          );
        }
        return (
          <View
            key={day}
            style={{
              flex: 1,
              height: barHeight,
              backgroundColor: color,
              borderRadius: barHeight,
              opacity: dayInPast(day, currentDay) ? 1 : 0.45,
              minWidth: ringW,
            }}
          />
        );
      })}
    </View>
  );
}

function dayInPast(day: number, currentDay?: number | null): boolean {
  if (currentDay == null) return true;
  return day <= currentDay;
}

function colorFor(phase: CyclePhase, peak: boolean, palette: ReturnType<typeof useTheme>['palette']) {
  if (peak) return palette.ovulation;
  switch (phase) {
    case 'period':
      return palette.flowMedium;
    case 'follicular':
      return palette.follicular;
    case 'ovulation':
      return palette.ovulation;
    case 'luteal':
      return palette.luteal;
  }
}

/** Legend row to pair with the strip on Insights. */
export function PhaseLegend() {
  const t = useTheme();
  const items: Array<{ label: string; color: string }> = [
    { label: 'Period', color: t.palette.flowMedium },
    { label: 'Follicular', color: t.palette.follicular },
    { label: 'Ovulation', color: t.palette.ovulation },
    { label: 'Luteal', color: t.palette.luteal },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: it.color,
            }}
          />
          <Text variant="micro" color={t.palette.inkMuted}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
