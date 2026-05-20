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
  /**
   * Number of cycles the user has logged. Drives the visual confidence ramp:
   *   0 cycles → ring is dotted outline only, fertile arc replaced with a "?"
   *   1 cycle  → 60% opacity, single confidence band
   *   2 cycles → 80% opacity
   *   3+       → full strength
   * Defaults to a large number when omitted (don't dim if the caller doesn't
   * know — saves us breaking older callers).
   */
  cyclesLogged?: number;
  /**
   * Whether to draw the peak-fertility (ovulation) dot. Gated on the user's
   * fertility-tracking setting — off by default, so non-fertility users don't
   * get an ovulation marker they never asked for. Defaults to true.
   */
  showPeak?: boolean;
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
  cyclesLogged = 999,
  showPeak = true,
}: CycleRingProps) {
  const t = useTheme();
  const stroke = 14;
  // The today marker is a circle of radius `markerR` riding on the ring's
  // centreline. It extends `markerR - stroke/2` pixels past the ring's outer
  // edge (the "marker overhang"). If the ring's outer edge sits at the SVG
  // canvas boundary, the marker's outer pixels get clipped by the viewBox —
  // visible as a missing slice on whichever side of the dot is closest to
  // the canvas edge (changes with cycle day). Shrink the ring radius by the
  // overhang so the marker always renders fully inside the canvas.
  const markerR = 14;
  const markerStroke = 1.5;
  const markerOverhang = Math.max(0, markerR + markerStroke / 2 - stroke / 2);
  const radius = (size - stroke) / 2 - markerOverhang;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const periodEnd = Math.min(periodLength, cycleLength);
  const fert = fertile ?? {
    startDay: Math.max(periodEnd + 1, cycleLength - 19),
    endDay: cycleLength - 11,
    peakDay: cycleLength - 14,
  };

  // Phase segments. The base ring (full circumference, paperEdge) is rendered
  // separately as a Circle below — Path arcs can't represent a 360° sweep.
  //
  // The four phases each get a distinct token so the ring reads at-a-glance:
  //   period       — terracotta (flowMedium)
  //   follicular   — honey       (follicular)
  //   fertile      — sage        (fertile)
  //   luteal       — sage-grey   (luteal)
  // Previously follicular used `predictedSoft` and luteal was the paperEdge
  // base, which made the ring read as "two phases" at a glance. The honey/sage
  // tokens already existed in theme.ts and just weren't being used here.
  const segments = useMemo(() => {
    return [
      // Follicular (post-period, pre-fertile) — honey
      {
        fromDay: periodEnd + 1,
        toDay: Math.max(periodEnd + 1, fert.startDay - 1),
        color: t.palette.follicular,
        key: 'follicular',
      },
      // Fertile window — sage
      { fromDay: fert.startDay, toDay: fert.endDay, color: t.palette.fertile, key: 'fertile' },
      // Luteal (post-fertile, pre-next-period) — sage-grey
      {
        fromDay: fert.endDay + 1,
        toDay: cycleLength,
        color: t.palette.luteal,
        key: 'luteal',
      },
      // Period — terracotta
      { fromDay: 1, toDay: periodEnd, color: t.palette.flowMedium, key: 'period' },
    ];
  }, [cycleLength, periodEnd, fert.startDay, fert.endDay, t.palette]);

  // Marker position — anchor at the *centre* of the cycle-day slot so the
  // dot visually sits "on" day N rather than on the boundary between N-1 and N.
  const dayForMarker = cycleDay ?? 1;
  const markerAngle = ((dayForMarker - 0.5) / cycleLength) * 360 - 90;
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

  // Confidence ramp: until the user has logged ≥ 3 cycles, the ring earns its
  // colour. 0 cycles renders as a dotted outline only (everything else hidden)
  // so we don't pretend to predict a fertile window from a default-28 guess.
  // Matches the "first-cycle screen lies politely" issue from the UX review.
  const confidence: 'none' | 'low' | 'medium' | 'full' =
    cyclesLogged <= 0
      ? 'none'
      : cyclesLogged === 1
      ? 'low'
      : cyclesLogged === 2
      ? 'medium'
      : 'full';
  const segOpacity =
    confidence === 'none' ? 0 : confidence === 'low' ? 0.6 : confidence === 'medium' ? 0.8 : 1;
  const baseStyle =
    confidence === 'none'
      ? { dasharray: '4 8' as const, opacity: 0.45 }
      : { dasharray: undefined, opacity: 1 };

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="ringFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.palette.paperEdge} stopOpacity="0.5" />
            <Stop offset="1" stopColor={t.palette.paperEdge} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Base ring — full circumference. Dotted when we have no data so the
            ring doesn't pretend to be a full-color prediction. */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={t.palette.paperEdge}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={baseStyle.dasharray}
          opacity={baseStyle.opacity}
        />

        {/* Zero-data state — instead of painting phase arcs from a guess, drop
            a single labelled "?" tick where the fertile peak *might* be once
            the user has logged a period. This honours the "honest about what we
            don't know" stance of the whole product. */}
        {confidence === 'none' && (
          <SvgText
            x={cx + radius + 12}
            y={cy + 4}
            fill={t.palette.inkFaint}
            fontSize={18}
            fontWeight="600"
            textAnchor="start"
          >
            ?
          </SvgText>
        )}

        {confidence !== 'none' && segments.map((seg) => (
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
            opacity={segOpacity}
          />
        ))}

        {/* Tick at peak fertility for orientation — only when we have data and
            the user is tracking fertility. Drawn on the ring centreline so it
            reads as part of the fertile arc rather than a floating pin. */}
        {confidence !== 'none' && showPeak && (
          <PeakTick
            cx={cx}
            cy={cy}
            radius={radius}
            color={t.palette.fertilePeak}
            bgColor={t.palette.paper}
            day={fert.peakDay}
            cycleLength={cycleLength}
          />
        )}

        {/* Today marker */}
        {cycleDay !== null && (
          <G>
            <Circle
              cx={markerX}
              cy={markerY}
              r={markerR}
              fill={t.palette.paper}
              stroke={t.palette.ink}
              strokeWidth={markerStroke}
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
  opacity?: number;
};

function ArcSegment({ cx, cy, radius, stroke, color, fromDay, toDay, cycleLength, opacity = 1 }: ArcProps) {
  if (toDay < fromDay) return null;
  // Each cycle day owns a slot of width 360/cycleLength degrees. A segment
  // "day X to day Y inclusive" must span (Y - X + 1) slots, so the start
  // angle anchors at the *start* of day X and the end angle at the *end*
  // of day Y (i.e. the start of day Y+1). Using `(toDay - 1) / cycleLength`
  // here would clip one day off the visual arc and leave a gap before the
  // next segment.
  const startAngle = ((fromDay - 1) / cycleLength) * 360 - 90;
  const endAngle = (toDay / cycleLength) * 360 - 90;
  const d = arcPath(cx, cy, radius, startAngle, endAngle);
  // strokeLinecap="round" makes each segment overlap its neighbour by half
  // the stroke width — this hides any sub-pixel rendering gap where two
  // segments meet. Later-drawn segments cover the earlier overlap.
  return (
    <Path
      d={d}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    />
  );
}

function PeakTick({
  cx,
  cy,
  radius,
  color,
  bgColor,
  day,
  cycleLength,
}: {
  cx: number;
  cy: number;
  radius: number;
  color: string;
  bgColor: string;
  day: number;
  cycleLength: number;
}) {
  const angle = ((day - 0.5) / cycleLength) * 360 - 90;
  const x = cx + radius * Math.cos((angle * Math.PI) / 180);
  const y = cy + radius * Math.sin((angle * Math.PI) / 180);
  // A coloured dot inside a paper "halo" so the ovulation peak reads clearly
  // against any segment — including the sage fertile arc it usually sits on,
  // where a flat dot would blend in. Sits on the ring centreline, not outside,
  // so it never looks like a stray pin at the edge of the ring.
  return (
    <G>
      <Circle cx={x} cy={y} r={5.5} fill={bgColor} />
      <Circle cx={x} cy={y} r={3} fill={color} />
    </G>
  );
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
