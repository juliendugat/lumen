import { Pressable, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  unit?: string;
};

export function NumberStepper({ value, onChange, min = 1, max = 99, unit }: Props) {
  const t = useTheme();
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.lg,
        padding: t.spacing.md,
        backgroundColor: t.palette.paperDeep,
        borderRadius: t.radii.lg,
        alignSelf: 'flex-start',
      }}
    >
      <StepBtn onPress={dec} disabled={value <= min} label="−" />
      <View style={{ minWidth: 80, alignItems: 'center' }}>
        <Text variant="h2">{value}</Text>
        {unit && (
          <Text variant="caption" color={t.palette.inkMuted}>
            {unit}
          </Text>
        )}
      </View>
      <StepBtn onPress={inc} disabled={value >= max} label="+" />
    </View>
  );
}

function StepBtn({ onPress, disabled, label }: { onPress: () => void; disabled?: boolean; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.palette.paper,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text variant="h2">{label}</Text>
    </Pressable>
  );
}
