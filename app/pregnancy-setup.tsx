import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { DatePickerInline } from '@/ui/components/DatePickerInline';
import { useTheme } from '@/ui/ThemeProvider';
import { useCycle } from '@/store/cycle';
import { Illustration } from '@/ui/illustrations/Illustration';
import { toISO } from '@/engine/dates';

export default function PregnancySetup() {
  const t = useTheme();
  const router = useRouter();
  const { settings, lastStart, patchSettings } = useCycle();
  const [picked, setPicked] = useState<Date | null>(
    settings?.pregnancyLmpDate
      ? new Date(settings.pregnancyLmpDate)
      : lastStart
      ? new Date(lastStart)
      : null,
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      await patchSettings({
        lifeMode: 'pregnancy',
        pregnancyStartDate: toISO(new Date()),
        pregnancyLmpDate: toISO(picked),
      });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <Text variant="bodyStrong" color={t.palette.inkMuted}>
          ‹ Back
        </Text>
      </Pressable>
      <View style={{ alignItems: 'center', marginVertical: t.spacing.lg }}>
        <Illustration name="pregnancy-bloom" width={220} height={160} />
      </View>
      <Text variant="h1" align="center">
        Pregnancy mode
      </Text>
      <Text variant="body" color={t.palette.inkMuted} align="center">
        Pick the first day of your last menstrual period (LMP). Lumen pauses cycle predictions
        and shows weeks-pregnant from that date.
      </Text>
      <View style={{ marginTop: t.spacing.xl }}>
        <DatePickerInline value={picked} onChange={setPicked} maxDaysAgo={300} />
      </View>
      <View style={{ height: t.spacing.xl }} />
      <Button label={busy ? 'Saving…' : 'Turn on pregnancy mode'} fullWidth onPress={save} disabled={!picked || busy} />
    </Screen>
  );
}
