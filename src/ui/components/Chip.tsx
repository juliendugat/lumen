import { Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'flow' | 'mood' | 'symptom';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, tone = 'neutral', disabled, style }: ChipProps) {
  const t = useTheme();

  const selectedBg = (() => {
    switch (tone) {
      case 'flow':
        return t.palette.flowMedium;
      case 'mood':
        return t.palette.fertile;
      case 'symptom':
        return t.palette.predicted;
      default:
        return t.palette.ink;
    }
  })();

  const bg = selected ? selectedBg : t.palette.paperDeep;
  const fg = selected ? t.palette.paper : t.palette.inkSoft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: t.spacing.sm + 2,
          paddingHorizontal: t.spacing.lg,
          borderRadius: t.radii.pill,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}
