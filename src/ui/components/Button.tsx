import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type Tone = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  tone?: Tone;
  fullWidth?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
};

export function Button({ label, tone = 'primary', fullWidth, style, disabled, ...rest }: ButtonProps) {
  const t = useTheme();

  const bg = (() => {
    if (disabled) return t.palette.paperEdge;
    switch (tone) {
      case 'primary':
        return t.palette.ink;
      case 'secondary':
        return t.palette.paperDeep;
      case 'ghost':
        return 'transparent';
      case 'danger':
        return t.palette.error;
    }
  })();

  const fg = (() => {
    if (disabled) return t.palette.inkMuted;
    switch (tone) {
      case 'primary':
        return t.palette.paper;
      case 'secondary':
        return t.palette.ink;
      case 'ghost':
        return t.palette.ink;
      case 'danger':
        return t.palette.paper;
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: t.spacing.md + 2,
          paddingHorizontal: t.spacing.xl,
          borderRadius: t.radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: pressed ? 0.85 : 1,
          borderWidth: tone === 'ghost' ? 1 : 0,
          borderColor: tone === 'ghost' ? t.palette.paperEdge : 'transparent',
        },
        style,
      ]}
    >
      <Text variant="bodyStrong" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}
