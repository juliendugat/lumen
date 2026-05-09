import { View, type ViewProps } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { spacing as Spacing } from '../theme';

type Gap = keyof typeof Spacing;

type StackProps = ViewProps & {
  direction?: 'row' | 'column';
  gap?: Gap;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
};

export function Stack({
  direction = 'column',
  gap = 'md',
  align,
  justify,
  wrap,
  style,
  children,
  ...rest
}: StackProps) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: direction,
          gap: t.spacing[gap],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
