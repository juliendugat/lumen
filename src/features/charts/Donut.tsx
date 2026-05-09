import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/ui/ThemeProvider';

export type DonutSegment = { value: number; color: string; label: string };

type Props = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  /** Big number rendered in the center; pass null to omit. */
  centerLabel?: string | null;
};

/**
 * Donut chart for phase-segmented symptom counts (mirrors design-study #7
 * — "Hair loss x14: Period x5, Follicular x3, Ovulation x6, Luteal x0").
 * Pure SVG, no external chart library.
 */
export function Donut({ segments, size = 120, strokeWidth = 14, centerLabel }: Props) {
  const t = useTheme();
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={t.palette.paperEdge}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation={-90} originX={cx} originY={cy}>
          {total > 0 &&
            segments.map((s, i) => {
              if (s.value === 0) return null;
              const segLen = (s.value / total) * circumference;
              const dashArray = `${segLen} ${circumference - segLen}`;
              const node = (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={dashArray}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += segLen;
              return node;
            })}
        </G>
      </Svg>
      {centerLabel != null && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CenterLabel text={centerLabel} />
        </View>
      )}
    </View>
  );
}

function CenterLabel({ text }: { text: string }) {
  const t = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text: T } = require('react-native');
  return (
    <T
      style={{
        ...t.typography.bodyStrong,
        color: t.palette.ink,
      }}
    >
      {text}
    </T>
  );
}
