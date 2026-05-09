import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { DatePickerInline } from '@/ui/components/DatePickerInline';
import { useTheme } from '@/ui/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { toISO } from '@/engine/dates';

export default function LastPeriod() {
  const t = useTheme();
  const router = useRouter();
  const { lastPeriodStart, set } = useOnboarding();
  const [picked, setPicked] = useState<Date | null>(
    lastPeriodStart ? new Date(lastPeriodStart) : null,
  );

  const next = () => {
    if (picked) set({ lastPeriodStart: toISO(picked) });
    router.push('/(onboarding)/cycle-length');
  };

  return (
    <Screen scroll>
      <VStack gap="lg">
        <Text variant="micro" color={t.palette.inkMuted}>
          STEP 1 OF 3
        </Text>
        <Text variant="h1">When did your last period start?</Text>
        <Text variant="body" color={t.palette.inkMuted}>
          A rough date is fine. You can refine this later, and edit any day from the
          calendar.
        </Text>

        <View style={{ marginTop: t.spacing.md }}>
          <DatePickerInline value={picked} onChange={setPicked} />
        </View>

        <View style={{ height: t.spacing.xl }} />

        <Button label={picked ? 'Continue' : 'Skip for now'} fullWidth onPress={next} />
      </VStack>
    </Screen>
  );
}
