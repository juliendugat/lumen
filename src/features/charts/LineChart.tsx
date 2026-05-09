import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/ui/ThemeProvider';

type Props = {
  values: Array<number | null>;
  width?: number;
  height?: number;
  color?: string;
  yMin?: number;
  yMax?: number;
};

export function LineChart({ values, width = 280, height = 140, color, yMin, yMax }: Props) {
  const t = useTheme();
  const c = color ?? t.palette.fertilePeak;
  const points = values.map((v, i) => ({ x: i, y: v }));
  const present = points.filter((p) => p.y !== null) as Array<{ x: number; y: number }>;
  if (present.length === 0) {
    return (
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }} />
    );
  }
  const lo = yMin ?? Math.min(...present.map((p) => p.y));
  const hi = yMax ?? Math.max(...present.map((p) => p.y));
  const span = hi - lo || 1;
  const pad = 12;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const xFor = (i: number) => pad + (i / Math.max(1, values.length - 1)) * w;
  const yFor = (v: number) => pad + h - ((v - lo) / span) * h;

  let d = '';
  let started = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null) {
      started = false;
      continue;
    }
    const x = xFor(i);
    const y = yFor(v);
    d += `${started ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    started = true;
  }

  return (
    <View>
      <Svg width={width} height={height}>
        <Line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke={t.palette.paperEdge}
          strokeWidth="1"
        />
        <Path d={d} stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {present.map((p, i) => (
          <Circle key={i} cx={xFor(p.x)} cy={yFor(p.y)} r={2.5} fill={c} />
        ))}
        <SvgText x={pad} y={pad + 4} fill={t.palette.inkFaint} fontSize="9">
          {hi.toFixed(2)}
        </SvgText>
        <SvgText x={pad} y={height - pad - 2} fill={t.palette.inkFaint} fontSize="9">
          {lo.toFixed(2)}
        </SvgText>
      </Svg>
    </View>
  );
}
