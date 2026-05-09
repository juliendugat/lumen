import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { typography as Typography } from '../theme';

type Variant = keyof typeof Typography;

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color, align, style, children, ...rest }: TextProps) {
  const t = useTheme();
  const v = t.typography[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          color: color ?? t.palette.ink,
          textAlign: align,
          ...(v as object),
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
