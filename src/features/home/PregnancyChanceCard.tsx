import { View } from 'react-native';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { Icon } from '@/ui/icons/Icon';
import type { PregnancyChance } from '@/engine/health-signals';

type Props = { chance: PregnancyChance };

/**
 * Coarse pregnancy-chance band. Mirrors the design-study #3 "Predictive
 * Report" pattern. Always paired with the "estimate, not contraception"
 * disclaimer; never shows a precise number.
 */
export function PregnancyChanceCard({ chance }: Props) {
  const t = useTheme();
  if (chance === 'unknown') return null;

  const colors = {
    low: t.palette.lutealSoft,
    moderate: t.palette.follicularSoft,
    high: t.palette.ovulationSoft,
  } as const;
  const labels = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
  } as const;
  const subs = {
    low: 'Outside the estimated fertile window.',
    moderate: 'Inside the estimated fertile window.',
    high: 'Within a couple of days of estimated peak.',
  } as const;

  return (
    <View
      style={{
        backgroundColor: colors[chance],
        borderRadius: t.radii.lg,
        padding: t.spacing.lg,
        flexDirection: 'row',
        gap: t.spacing.md,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          padding: 10,
          borderRadius: t.radii.md,
          backgroundColor: t.palette.paper,
        }}
      >
        <Icon name="heart" size={22} color={t.palette.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          PREGNANCY CHANCE
        </Text>
        <Text variant="bodyStrong">{labels[chance]}</Text>
        <Text variant="caption" color={t.palette.inkSoft}>
          {subs[chance]} Estimate, not contraception.
        </Text>
      </View>
    </View>
  );
}
