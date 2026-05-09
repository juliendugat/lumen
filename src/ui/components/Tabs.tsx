import { Pressable, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type Tab = { value: string; label: string };

type Props = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
};

/**
 * Underlined tabs, like Flo / the design-study tabs in image #4 and #5.
 * Active tab gets an accent underline; inactive labels are muted.
 */
export function Tabs({ tabs, value, onChange }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: t.palette.paperEdge,
      }}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 2,
              borderBottomColor: active ? t.palette.flowMedium : 'transparent',
              marginBottom: -1,
            }}
          >
            <Text
              variant={active ? 'bodyStrong' : 'body'}
              color={active ? t.palette.ink : t.palette.inkMuted}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
