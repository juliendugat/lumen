import { Pressable, View } from 'react-native';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { Icon, type IconName } from '@/ui/icons/Icon';

export type FlowValue = 'spotting' | 'light' | 'medium' | 'heavy';

const TILES: Array<{ value: FlowValue; label: string; icon: IconName }> = [
  { value: 'spotting', label: 'Spotting', icon: 'spotting' },
  { value: 'light', label: 'Light', icon: 'drop-light' },
  { value: 'medium', label: 'Medium', icon: 'drop' },
  { value: 'heavy', label: 'Heavy', icon: 'drop-heavy' },
];

type Props = {
  value: FlowValue | null;
  onSelect: (v: FlowValue | null) => void;
  size?: 'sm' | 'md';
};

/**
 * Tile-style flow logger. Replaces the chip-row with bigger, visual,
 * less-ambiguous tiles (matches Flo / Clue / mockup style: image #4 page 1).
 *
 * Tap the same tile twice to clear (toggles).
 */
export function FlowTiles({ value, onSelect, size = 'md' }: Props) {
  const t = useTheme();
  const tileSize = size === 'sm' ? 64 : 80;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: t.spacing.sm,
      }}
    >
      {TILES.map((tile) => {
        const selected = value === tile.value;
        return (
          <Pressable
            key={tile.value}
            onPress={() => onSelect(selected ? null : tile.value)}
            accessibilityRole="button"
            accessibilityLabel={`${tile.label} flow`}
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: t.spacing.md,
              minHeight: tileSize,
              backgroundColor: selected ? t.palette.flowMedium : t.palette.paperDeep,
              borderRadius: t.radii.lg,
              opacity: pressed ? 0.85 : 1,
              borderWidth: selected ? 0 : 1,
              borderColor: t.palette.paperEdge,
            })}
          >
            <Icon
              name={tile.icon}
              size={size === 'sm' ? 22 : 26}
              color={selected ? t.palette.paper : t.palette.flowMedium}
            />
            <Text
              variant="caption"
              color={selected ? t.palette.paper : t.palette.inkSoft}
            >
              {tile.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
