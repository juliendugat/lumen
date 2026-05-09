import { View, ScrollView, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type PropsWithChildren } from 'react';
import { useTheme } from '../ThemeProvider';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}>;

export function Screen({ children, scroll, padded = true, style }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  return (
    <Container
      style={[{ flex: 1, backgroundColor: t.palette.paper }, !scroll && style]}
      contentContainerStyle={
        scroll
          ? [
              {
                padding: padded ? t.spacing.lg : 0,
                paddingTop: insets.top + (padded ? t.spacing.lg : 0),
                paddingBottom: insets.bottom + t.spacing.xxxl,
              },
              style,
            ]
          : undefined
      }
    >
      {scroll ? (
        children
      ) : (
        <View
          style={{
            flex: 1,
            padding: padded ? t.spacing.lg : 0,
            paddingTop: insets.top + (padded ? t.spacing.lg : 0),
          }}
        >
          {children}
        </View>
      )}
    </Container>
  );
}
