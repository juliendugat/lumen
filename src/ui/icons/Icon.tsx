import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';

/**
 * Single Icon component with a tag-style API. All icons are 24×24 by default,
 * stroked at 1.6, currentColor-friendly via the `color` prop. They render
 * crisply at any size and respect the app theme.
 */
export type IconName =
  // Symptoms
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'breast'
  | 'fatigue'
  | 'acne'
  | 'backache'
  | 'nausea'
  | 'cravings'
  | 'insomnia'
  // Moods
  | 'happy'
  | 'calm'
  | 'anxious'
  | 'irritable'
  | 'low'
  | 'energetic'
  | 'sad'
  | 'focused'
  // Flow
  | 'drop'
  | 'drop-light'
  | 'drop-heavy'
  | 'spotting'
  // Tracking
  | 'pill'
  | 'thermometer'
  | 'mucus'
  | 'heart'
  | 'shield'
  // App
  | 'export'
  | 'lock'
  | 'note'
  | 'flag'
  | 'trash'
  | 'add'
  | 'check'
  | 'arrow-right'
  | 'sparkle'
  | 'flower'
  | 'leaf'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'star';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color, strokeWidth = 1.6 }: IconProps) {
  const t = useTheme();
  const c = color ?? t.palette.ink;
  const sw = strokeWidth;

  const child = (() => {
    switch (name) {
      // ─── Symptoms ──────────────────────────────────────────────────
      case 'cramps':
        return (
          <G>
            <Path d="M5 12 Q9 6 12 12 T19 12" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d="M5 16 Q9 10 12 16 T19 16" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" opacity="0.5" />
          </G>
        );
      case 'headache':
        return (
          <G>
            <Path d="M7 17 v-3 a5 5 0 0 1 10 0 v3" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M5 17 h14" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M9 7 l-1 -2 M15 7 l1 -2 M12 6 v-2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          </G>
        );
      case 'bloating':
        return (
          <G>
            <Circle cx="12" cy="13" r="6" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M9 11 a1.5 1.5 0 0 0 0 3 M15 11 a1.5 1.5 0 0 1 0 3" stroke={c} strokeWidth={sw} fill="none" />
          </G>
        );
      case 'breast':
        return (
          <G>
            <Path d="M5 9 Q5 14 9 16 Q12 18 15 16 Q19 14 19 9 Z" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="12" cy="12" r="1" fill={c} />
          </G>
        );
      case 'fatigue':
        return (
          <G>
            <Circle cx="9" cy="11" r="1" fill={c} />
            <Circle cx="15" cy="11" r="1" fill={c} />
            <Path d="M8 16 q4 -2 8 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d="M14 5 h6 l-6 4 h6" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
          </G>
        );
      case 'acne':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="9" cy="10" r="1" fill={c} />
            <Circle cx="15" cy="10" r="1" fill={c} />
            <Circle cx="11" cy="15" r="1" fill={c} />
            <Circle cx="14" cy="14" r="0.7" fill={c} />
          </G>
        );
      case 'backache':
        return (
          <G>
            <Path d="M12 4 v16" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M9 7 h6 M9 11 h6 M9 15 h6 M9 19 h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M16 12 q3 0 3 3" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'nausea':
        return (
          <G>
            <Path d="M7 9 q5 -3 10 0 v8 q-5 3 -10 0 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
            <Path d="M9 12 q3 -2 6 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'cravings':
        return (
          <G>
            <Path d="M12 5 c-4 0 -7 3 -7 7 c0 5 7 7 7 7 s7 -2 7 -7 c0 -4 -3 -7 -7 -7 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
            <Path d="M9 11 q3 -3 6 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'insomnia':
        return (
          <G>
            <Path d="M19 14 a8 8 0 0 1 -10 -10 a7 7 0 1 0 10 10 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
            <Path d="M14 6 l3 0 l-3 3 l3 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );

      // ─── Moods ─────────────────────────────────────────────────────
      case 'happy':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="9" cy="11" r="0.8" fill={c} />
            <Circle cx="15" cy="11" r="0.8" fill={c} />
            <Path d="M9 14 q3 3 6 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'calm':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M8 11 h2 M14 11 h2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M9 15 h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          </G>
        );
      case 'anxious':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="9" cy="11" r="0.8" fill={c} />
            <Circle cx="15" cy="11" r="0.8" fill={c} />
            <Path d="M8 16 q1 -1 2 0 q1 1 2 0 q1 -1 2 0 q1 1 2 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'irritable':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M7 10 l3 1 M17 10 l-3 1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M9 16 q3 -2 6 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'low':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="9" cy="11" r="0.8" fill={c} />
            <Circle cx="15" cy="11" r="0.8" fill={c} />
            <Path d="M9 16 q3 -2 6 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'sad':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="9" cy="11" r="0.8" fill={c} />
            <Circle cx="15" cy="11" r="0.8" fill={c} />
            <Path d="M9 17 q3 -3 6 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
          </G>
        );
      case 'energetic':
        return (
          <G>
            <Path d="M13 3 L6 13 h5 l-1 8 l7 -10 h-5 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
          </G>
        );
      case 'focused':
        return (
          <G>
            <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="12" cy="12" r="1" fill={c} />
          </G>
        );

      // ─── Flow ──────────────────────────────────────────────────────
      case 'drop':
        return (
          <Path
            d="M12 4 C7 11 5 14 5 17 a7 7 0 0 0 14 0 c0 -3 -2 -6 -7 -13 z"
            stroke={c}
            strokeWidth={sw}
            fill="none"
            strokeLinejoin="round"
          />
        );
      case 'drop-light':
        return (
          <Path
            d="M12 8 C9 12 8 14 8 16 a4 4 0 0 0 8 0 c0 -2 -1 -4 -4 -8 z"
            stroke={c}
            strokeWidth={sw}
            fill="none"
            strokeLinejoin="round"
          />
        );
      case 'drop-heavy':
        return (
          <G>
            <Path
              d="M12 4 C7 11 5 14 5 17 a7 7 0 0 0 14 0 c0 -3 -2 -6 -7 -13 z"
              fill={c}
            />
          </G>
        );
      case 'spotting':
        return (
          <G>
            <Circle cx="9" cy="9" r="1.5" fill={c} />
            <Circle cx="15" cy="13" r="1.5" fill={c} />
            <Circle cx="11" cy="16" r="1" fill={c} />
          </G>
        );

      // ─── Tracking ──────────────────────────────────────────────────
      case 'pill':
        return (
          <G>
            <Rect x="3" y="9" width="18" height="6" rx="3" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M12 9 v6" stroke={c} strokeWidth={sw} />
          </G>
        );
      case 'thermometer':
        return (
          <G>
            <Path d="M14 4 a2 2 0 0 0 -4 0 v10 a3 3 0 1 0 4 0 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
            <Circle cx="12" cy="17" r="1.4" fill={c} />
          </G>
        );
      case 'mucus':
        return (
          <G>
            <Path d="M5 12 q3 -4 7 0 q4 4 7 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
            <Path d="M5 16 q3 -3 7 0 q4 3 7 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" opacity="0.5" />
          </G>
        );
      case 'heart':
        return (
          <Path
            d="M12 20 s-7 -4 -7 -10 a4 4 0 0 1 7 -2 a4 4 0 0 1 7 2 c0 6 -7 10 -7 10 z"
            stroke={c}
            strokeWidth={sw}
            fill="none"
            strokeLinejoin="round"
          />
        );
      case 'shield':
        return (
          <Path
            d="M12 3 l8 3 v5 c0 5 -4 9 -8 10 c-4 -1 -8 -5 -8 -10 v-5 z"
            stroke={c}
            strokeWidth={sw}
            fill="none"
            strokeLinejoin="round"
          />
        );

      // ─── App ───────────────────────────────────────────────────────
      case 'export':
        return (
          <G>
            <Path d="M12 4 v11 M8 8 l4 -4 l4 4" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5 14 v5 h14 v-5" stroke={c} strokeWidth={sw} fill="none" />
          </G>
        );
      case 'lock':
        return (
          <G>
            <Rect x="5" y="11" width="14" height="9" rx="2" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M8 11 v-3 a4 4 0 0 1 8 0 v3" stroke={c} strokeWidth={sw} fill="none" />
          </G>
        );
      case 'note':
        return (
          <G>
            <Path d="M5 4 h11 l3 3 v13 h-14 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
            <Path d="M8 10 h8 M8 14 h8 M8 18 h5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          </G>
        );
      case 'flag':
        return (
          <G>
            <Path d="M5 4 v17" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M5 5 q4 -2 8 0 q4 2 6 0 v8 q-2 2 -6 0 q-4 -2 -8 0 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
          </G>
        );
      case 'trash':
        return (
          <G>
            <Path d="M5 7 h14" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M9 7 v-2 h6 v2" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M6 7 l1 13 h10 l1 -13" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
          </G>
        );
      case 'add':
        return (
          <Path d="M12 5 v14 M5 12 h14" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        );
      case 'check':
        return (
          <Path d="M5 13 l4 4 l10 -10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        );
      case 'arrow-right':
        return (
          <G>
            <Path d="M5 12 h14 M14 7 l5 5 l-5 5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </G>
        );
      case 'sparkle':
        return (
          <G>
            <Path d="M12 4 l1.5 4.5 L18 10 l-4.5 1.5 L12 16 l-1.5 -4.5 L6 10 l4.5 -1.5 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
            <Circle cx="18" cy="17" r="1" fill={c} />
            <Circle cx="6" cy="17" r="0.7" fill={c} />
          </G>
        );
      case 'flower':
        return (
          <G>
            <Circle cx="12" cy="12" r="2" fill={c} />
            <Circle cx="12" cy="6" r="3" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="12" cy="18" r="3" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="6" cy="12" r="3" stroke={c} strokeWidth={sw} fill="none" />
            <Circle cx="18" cy="12" r="3" stroke={c} strokeWidth={sw} fill="none" />
          </G>
        );
      case 'leaf':
        return (
          <Path d="M5 19 q0 -10 14 -14 q-2 14 -14 14 z M5 19 l7 -7" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        );
      case 'sun':
        return (
          <G>
            <Circle cx="12" cy="12" r="4" stroke={c} strokeWidth={sw} fill="none" />
            <Path d="M12 3 v2 M12 19 v2 M3 12 h2 M19 12 h2 M5.5 5.5 l1.5 1.5 M17 17 l1.5 1.5 M5.5 18.5 l1.5 -1.5 M17 7 l1.5 -1.5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          </G>
        );
      case 'moon':
        return (
          <Path d="M19 14 a8 8 0 0 1 -10 -10 a7 7 0 1 0 10 10 z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />
        );
      case 'cloud':
        return (
          <Path
            d="M7 16 a4 4 0 0 1 0 -8 a5 5 0 0 1 9 -1 a3 3 0 0 1 1 9 z"
            stroke={c}
            strokeWidth={sw}
            fill="none"
            strokeLinejoin="round"
          />
        );
      case 'star':
        return (
          <Path
            d="M12 4 l2.4 5.5 l5.6 0.5 l-4.4 4 l1.4 5.5 l-5 -3 l-5 3 l1.4 -5.5 l-4.4 -4 l5.6 -0.5 z"
            stroke={c}
            strokeWidth={sw}
            fill="none"
            strokeLinejoin="round"
          />
        );
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {child}
    </Svg>
  );
}
