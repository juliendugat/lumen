import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';

/**
 * Custom inline SVG illustrations. Style: ink-on-paper, soft warm gradients,
 * single accent stroke. Sized in viewBox units; wrap in a View for layout.
 */
export type IllustrationName =
  | 'welcome-moon'
  | 'first-period'
  | 'patterns'
  | 'privacy-keep'
  | 'empty-calendar'
  | 'pregnancy-bloom'
  | 'no-data';

type Props = { name: IllustrationName; width?: number; height?: number };

export function Illustration({ name, width = 280, height = 200 }: Props) {
  const t = useTheme();

  switch (name) {
    case 'welcome-moon':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <Defs>
            <RadialGradient id="moonglow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={t.palette.flowLight} stopOpacity="0.4" />
              <Stop offset="1" stopColor={t.palette.paper} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="140" cy="100" r="90" fill="url(#moonglow)" />
          <Circle cx="140" cy="100" r="58" fill={t.palette.paperEdge} />
          <Path
            d="M180 100 a40 40 0 0 1 -60 33 a32 32 0 1 0 60 -33 z"
            fill={t.palette.flowMedium}
            opacity="0.85"
          />
          <Circle cx="80" cy="40" r="2" fill={t.palette.ink} opacity="0.5" />
          <Circle cx="220" cy="50" r="1.4" fill={t.palette.ink} opacity="0.4" />
          <Circle cx="60" cy="160" r="1.6" fill={t.palette.ink} opacity="0.5" />
          <Circle cx="240" cy="140" r="2.2" fill={t.palette.ink} opacity="0.4" />
        </Svg>
      );

    case 'first-period':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <Defs>
            <LinearGradient id="dropG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.palette.flowLight} />
              <Stop offset="1" stopColor={t.palette.flowMedium} />
            </LinearGradient>
          </Defs>
          <Path
            d="M140 30 c-30 36 -45 60 -45 80 a45 45 0 0 0 90 0 c0 -20 -15 -44 -45 -80 z"
            fill="url(#dropG)"
          />
          <Path
            d="M125 95 q15 -10 30 0"
            stroke={t.palette.paper}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <Path d="M70 170 h140" stroke={t.palette.inkFaint} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </Svg>
      );

    case 'patterns':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <G>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Circle
                key={i}
                cx={50 + i * 36}
                cy={100 + Math.sin(i) * 18}
                r={4 + (i % 3)}
                fill={i % 2 ? t.palette.flowMedium : t.palette.fertile}
                opacity={0.4 + i * 0.08}
              />
            ))}
            <Path
              d="M50 100 Q86 75 122 110 T194 95 T266 105"
              stroke={t.palette.ink}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          </G>
        </Svg>
      );

    case 'privacy-keep':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <Path
            d="M140 30 l60 22 v40 c0 38 -28 64 -60 78 c-32 -14 -60 -40 -60 -78 v-40 z"
            fill={t.palette.paperDeep}
            stroke={t.palette.ink}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <Path
            d="M120 105 l15 15 l30 -32"
            stroke={t.palette.flowMedium}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="140" cy="80" r="3" fill={t.palette.fertile} />
        </Svg>
      );

    case 'empty-calendar':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <G>
            <Path
              d="M70 50 h140 a8 8 0 0 1 8 8 v90 a8 8 0 0 1 -8 8 h-140 a8 8 0 0 1 -8 -8 v-90 a8 8 0 0 1 8 -8 z"
              fill={t.palette.paperDeep}
              stroke={t.palette.inkFaint}
              strokeWidth="1.4"
            />
            <Path d="M62 78 h156" stroke={t.palette.inkFaint} strokeWidth="1.4" />
            <Path d="M92 50 v-12 M188 50 v-12" stroke={t.palette.ink} strokeWidth="2" strokeLinecap="round" />
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3, 4, 5, 6].map((col) => (
                <Circle
                  key={`${row}-${col}`}
                  cx={82 + col * 18}
                  cy={92 + row * 16}
                  r="1.6"
                  fill={t.palette.inkFaint}
                  opacity="0.4"
                />
              )),
            )}
          </G>
        </Svg>
      );

    case 'pregnancy-bloom':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <Defs>
            <RadialGradient id="bloom" cx="0.5" cy="0.55" r="0.5">
              <Stop offset="0" stopColor={t.palette.fertile} stopOpacity="0.7" />
              <Stop offset="1" stopColor={t.palette.paper} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="140" cy="110" r="80" fill="url(#bloom)" />
          <Path
            d="M140 60 q35 20 35 50 a35 35 0 1 1 -70 0 q0 -30 35 -50 z"
            fill={t.palette.paperDeep}
            stroke={t.palette.ink}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <Path
            d="M125 110 q15 10 30 0"
            stroke={t.palette.fertilePeak}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx="140" cy="110" r="3" fill={t.palette.flowMedium} />
        </Svg>
      );

    case 'no-data':
      return (
        <Svg width={width} height={height} viewBox="0 0 280 200">
          <Circle cx="140" cy="100" r="50" stroke={t.palette.inkFaint} strokeWidth="1.4" fill="none" strokeDasharray="3 5" />
          <Path d="M120 100 q20 -16 40 0" stroke={t.palette.inkFaint} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <Circle cx="140" cy="100" r="2" fill={t.palette.inkFaint} />
        </Svg>
      );
  }
}
