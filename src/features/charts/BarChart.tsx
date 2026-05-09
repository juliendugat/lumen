import { View } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '@/ui/ThemeProvider';

type Props = {
  values: number[];
  /** Optional labels under each bar — should match length of values. */
  labels?: string[];
  width?: number;
  height?: number;
  highlightIndex?: number;
  color?: string;
};

/**
 * Tiny inline SVG bar chart for symptom-by-cycle-day plots.
 * No external deps; renders well at any size.
 */
export function BarChart({ values, labels, width = 280, height = 100, highlightIndex, color }: Props) {
  const t = useTheme();
  const c = color ?? t.palette.flowMedium;
  const max = Math.max(1, ...values);
  const padding = 8;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2 - (labels ? 14 : 0);
  const barW = chartW / values.length;

  return (
    <View>
      <Svg width={width} height={height}>
        <Line
          x1={padding}
          y1={padding + chartH}
          x2={padding + chartW}
          y2={padding + chartH}
          stroke={t.palette.paperEdge}
          strokeWidth="1"
        />
        {values.map((v, i) => {
          const h = (v / max) * (chartH - 4);
          return (
            <Rect
              key={i}
              x={padding + i * barW + 1}
              y={padding + chartH - h}
              width={Math.max(1, barW - 2)}
              height={Math.max(0.5, h)}
              fill={i === highlightIndex ? t.palette.ink : c}
              opacity={i === highlightIndex ? 1 : 0.85}
              rx={1}
            />
          );
        })}
        {labels &&
          labels.map((l, i) =>
            l ? (
              <SvgText
                key={i}
                x={padding + i * barW + barW / 2}
                y={padding + chartH + 12}
                fill={t.palette.inkFaint}
                fontSize={9}
                textAnchor="middle"
              >
                {l}
              </SvgText>
            ) : null,
          )}
      </Svg>
    </View>
  );
}
