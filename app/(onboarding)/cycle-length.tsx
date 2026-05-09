import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { NumberStepper } from '@/ui/components/NumberStepper';
import { useTheme } from '@/ui/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { View } from 'react-native';

export default function CycleLength() {
  const t = useTheme();
  const router = useRouter();
  const { cycleLength, periodLength, set } = useOnboarding();

  return (
    <Screen scroll>
      <VStack gap="lg">
        <Text variant="micro" color={t.palette.inkMuted}>
          STEP 2 OF 3
        </Text>
        <Text variant="h1">Your typical cycle</Text>
        <Text variant="body" color={t.palette.inkMuted}>
          If you don't know yet, the defaults are fine — Lumen will learn your real
          numbers from your next few cycles.
        </Text>

        <View style={{ marginTop: t.spacing.lg, gap: t.spacing.md }}>
          <Text variant="bodyStrong">Cycle length</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            From the first day of one period to the first day of the next.
          </Text>
          <NumberStepper
            value={cycleLength}
            onChange={(n) => set({ cycleLength: n })}
            min={20}
            max={45}
            unit="days"
          />
        </View>

        <View style={{ marginTop: t.spacing.xl, gap: t.spacing.md }}>
          <Text variant="bodyStrong">Period length</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            How many days you typically bleed.
          </Text>
          <NumberStepper
            value={periodLength}
            onChange={(n) => set({ periodLength: n })}
            min={1}
            max={10}
            unit="days"
          />
        </View>

        <View style={{ height: t.spacing.xl }} />
        <Button
          label="Continue"
          fullWidth
          onPress={() => router.push('/(onboarding)/finish')}
        />
      </VStack>
    </Screen>
  );
}
