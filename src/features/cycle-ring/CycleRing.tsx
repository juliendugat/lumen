import { useEffect, useMemo } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/ui/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type RingPhase = 'period' | 'follicular' | 'fertile' | 'luteal' | 'predicted';

export type CycleRingProps = {
  /** 1-based cycle day; null when no cycle has started yet. */
  cycleDay: number | null;
  /** Mean cycle length in days. */
  cycleLength: number;
  /** Period length in days; days 1..periodLength are the period segment. */
  periodLength: number;
  /** Estimated fertile window relative to the cycle (start day, end day, peak day, all 1-based). */
  fertile?: { startDay: number; endDay: number; peakDay: number };
  /** Visual size in points. Default 280. */
  size?: number;
  /** Big label inside the ring (e.g. "Day 4"). */
  centerLabel?: string;
  /** Sub-label under the big label (e.g. "Period — Light"). */
  centerSubLabel?: string;
  /** Tiny label above the big label (e.g. "today"). */
  centerKicker?: string;
};

/**
 * The cycle ring.
 *
 * 360° = full cycle. Segments are drawn as arcs in the order of the cycle:
 *  - Period:   day 1 → periodLength
 *  - Follicular: end of period → fertile start
 *  - Fertile:  fertile.start → fertile.end
 *  - Luteal:   fertile.end → cycleLength
 *
 * A subtle "breathing" animation pulses the marker on the current day. We respect
 * reduced-motion preferences by holding the marker still when not animating.
 */
export function CycleRing({
  cycleDay,
  cycleLength,
  periodLength,
  fertile,
  size = 280,
  centerLabel,
  centerSubLabel,
  centerKicker,
}: CycleRingProps) {
  const t = useTheme();
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const periodEnd = Math.min(periodLength, cycleLength);
  const fert = fertile ?? {
    startDay: Math.max(periodEnd + 1, cycleLength - 19),
    endDay: cycleLength - 11,
    peakDay: cycleLength - 14,
  };

  const segments = useMemo(() => {
    return [
      // Luteal as the ring base — colored softly.
      { fromDay: 1, toDay: cycleLength, color: t.palette.paperEdge, key: 'base' },
      // Follicular (post-period, pre-fertile)
      {
        fromDay: periodEnd + 1,
        toDay: Math.max(periodEnd + 1, fert.startDay - 1),
        color: t.palette.predictedSoft,
        key: 'follicular',
      },
      // Fertile window
      { fromDay: fert.startDay, toDay: fert.endDay, color: t.palette.fertile, key: 'fertile' },
      // Period
      { fromDay: 1, toDay: periodEnd, color: t.palette.flowMedium, key: 'period' },
    ];
  }, [cycleLength, periodEnd, fert.startDay, fert.endDay, t.palette]);

  // Marker position
  const dayForMarker = cycleDay ?? 1;
  const markerAngle = ((dayForMarker - 1) / cycleLength) * 360 - 90;
  const markerX = cx + radius * Math.cos((markerAngle * Math.PI) / 180);
  const markerY = cy + radius * Math.sin((markerAngle * Math.PI) / 180);

  // Breathing scale on the marker; honors OS reduce-motion.
  const scale = useSharedValue(1);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let reduce = false;
      try {
        reduce = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        reduce = false;
      }
      if (cancelled) return;
      if (reduce) {
        scale.value = 1;
        return;
      }
      scale.value = withRepeat(
        withTiming(1.18, { duration: t.motion.breathe, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [scale, t.motion.breathe]);

  const markerProps = useAnimatedProps(() => ({
    r: 8 * scale.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="ringFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.palette.paperEdge} stopOpacity="0.5" />
            <Stop offset="1" stopColor={t.palette.paperEdge} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {segments.map((seg) => (
          <ArcSegment
            key={seg.key}
            cx={cx}
            cy={cy}
            radius={radius}
            stroke={stroke}
            color={seg.color}
            fromDay={seg.fromDay}
            toDay={seg.toDay}
            cycleLength={cycleLength}
          />
        ))}

        {/* Tick at peak fertility for orientation */}
        <PeakTick
          cx={cx}
          cy={cy}
          radius={radius + stroke / 2 + 6}
          color={t.palette.fertilePeak}
          day={fert.peakDay}
          cycleLength={cycleLength}
        />

        {/* Today marker */}
        {cycleDay !== null && (
          <G>
            <Circle
              cx={markerX}
              cy={markerY}
              r={14}
              fill={t.palette.paper}
              stroke={t.palette.ink}
              strokeWidth={1.5}
            />
            <AnimatedCircle
              cx={markerX}
              cy={markerY}
              fill={t.palette.ink}
              animatedProps={markerProps}
            />
          </G>
        )}

        {/* Center text rendered as SVG so it stays crisp inside the ring */}
        {centerKicker && (
          <SvgText
            x={cx}
            y={cy - 30}
            fill={t.palette.inkMuted}
            fontSize={11}
            fontWeight="600"
            textAnchor="middle"
            letterSpacing={2}
          >
            {centerKicker.toUpperCase()}
          </SvgText>
        )}
        {centerLabel && (
          <SvgText
            x={cx}
            y={cy + 8}
            fill={t.palette.ink}
            fontSize={42}
            fontWeight="500"
            textAnchor="middle"
          >
            {centerLabel}
          </SvgText>
        )}
        {centerSubLabel && (
          <SvgText
            x={cx}
            y={cy + 34}
            fill={t.palette.inkSoft}
            fontSize={14}
            textAnchor="middle"
          >
            {centerSubLabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

type ArcProps = {
  cx: number;
  cy: number;
  radius: number;
  stroke: number;
  color: string;
  fromDay: number;
  toDay: number;
  cycleLength: number;
};

function ArcSegment({ cx, cy, radius, stroke, color, fromDay, toDay, cycleLength }: ArcProps) {
  if (toDay < fromDay) return null;
  const startAngle = ((fromDay - 1) / cycleLength) * 360 - 90;
  const endAngle = ((toDay - 1) / cycleLength) * 360 - 90;
  const d = arcPath(cx, cy, radius, startAngle, endAngle);
  return (
    <Path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" />
  );
}

function PeakTick({
  cx,
  cy,
  radius,
  color,
  day,
  cycleLength,
}: {
  cx: number;
  cy: number;
  radius: number;
  color: string;
  day: number;
  cycleLength: number;
}) {
  const angle = ((day - 1) / cycleLength) * 360 - 90;
  const x = cx + radius * Math.cos((angle * Math.PI) / 180);
  const y = cy + radius * Math.sin((angle * Math.PI) / 180);
  return <Circle cx={x} cy={y} r={3} fill={color} />;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
  // Treat very small arcs (< ~1 day) as a single dot
  if (Math.abs(sweep) < 0.1) {
    return `M ${start.x} ${start.y} L ${end.x + 0.01} ${end.y + 0.01}`;
  }
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
