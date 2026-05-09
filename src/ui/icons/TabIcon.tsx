import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = { name: 'ring' | 'calendar' | 'chart' | 'gear' | 'book' | 'pill'; color: string; size?: number };

export function TabIcon({ name, color, size = 24 }: Props) {
  switch (name) {
    case 'ring':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" fill="none" />
          <Circle cx="12" cy="3" r="1.6" fill={color} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="5" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.6" fill="none" />
          <Path d="M3 10 H21" stroke={color} strokeWidth="1.6" />
          <Path d="M8 3 V7 M16 3 V7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </Svg>
      );
    case 'chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M4 18 L9 13 L13 16 L20 8"
            stroke={color}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="20" cy="8" r="1.6" fill={color} />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" fill="none" />
          <Path
            d="M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.5 5.5 L7 7 M17 17 L18.5 18.5 M5.5 18.5 L7 17 M17 7 L18.5 5.5"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'book':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M4 5 q4 -1 8 1 q4 -2 8 -1 v13 q-4 -1 -8 1 q-4 -2 -8 -1 z"
            stroke={color}
            strokeWidth="1.6"
            fill="none"
            strokeLinejoin="round"
          />
          <Path d="M12 6 v13" stroke={color} strokeWidth="1.6" />
        </Svg>
      );
    case 'pill':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="9" width="18" height="6" rx="3" stroke={color} strokeWidth="1.6" fill="none" />
          <Path d="M12 9 V15" stroke={color} strokeWidth="1.6" />
        </Svg>
      );
  }
}
