import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';

type CardProps = ViewProps & { style?: ViewStyle; padded?: boolean };

export function Card({ children, style, padded = true, ...rest }: CardProps) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t.palette.paperDeep,
          borderRadius: t.radii.lg,
          padding: padded ? t.spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
