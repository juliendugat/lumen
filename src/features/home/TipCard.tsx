import { View } from 'react-native';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { Icon } from '@/ui/icons/Icon';
import { tipForDate } from '@/copy/daily-tips';
import { todayISO } from '@/engine/dates';

/**
 * A single calm one-liner of body-literacy text that rotates daily, indexed
 * by today's date so it stays stable across re-renders and devices.
 */
export function TipCard() {
  const t = useTheme();
  const tip = tipForDate(todayISO());
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.lg,
        backgroundColor: t.palette.paperDeep,
        borderRadius: t.radii.lg,
      }}
    >
      <Icon name="sparkle" size={18} color={t.palette.fertilePeak} />
      <View style={{ flex: 1 }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          TIP OF THE DAY
        </Text>
        <Text variant="caption" color={t.palette.inkSoft}>
          {tip.text}
        </Text>
      </View>
    </View>
  );
}
