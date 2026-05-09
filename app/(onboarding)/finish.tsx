import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';
import { useOnboarding } from '@/store/onboarding';
import { useCycle } from '@/store/cycle';
import { ensurePermission } from '@/lib/notifications';

export default function Finish() {
  const t = useTheme();
  const router = useRouter();
  const ob = useOnboarding();
  const cycle = useCycle();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Apply settings
      await cycle.patchSettings({
        defaultCycleLength: ob.cycleLength,
        defaultPeriodLength: ob.periodLength,
        notifPeriodSoonDays: ob.notificationsOptIn ? 2 : null,
        notifLateDays: ob.notificationsOptIn ? 2 : null,
      });

      // Log first period if user picked one
      if (ob.lastPeriodStart) {
        await cycle.setFlow(ob.lastPeriodStart, 'medium');
      }

      if (ob.notificationsOptIn) {
        await ensurePermission(); // best-effort; ignored on web
      }

      await cycle.finishOnboarding();
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <VStack gap="lg">
        <Text variant="micro" color={t.palette.inkMuted}>
          STEP 3 OF 3
        </Text>
        <Text variant="h1">A few small choices</Text>

        <View
          style={{
            backgroundColor: t.palette.paperDeep,
            borderRadius: t.radii.lg,
            padding: t.spacing.lg,
            gap: t.spacing.md,
          }}
        >
          <Text variant="bodyStrong">Privacy first</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            Lumen stores your data only on this device. There's no account, no
            server, and nothing leaves your phone unless you export it.
          </Text>
        </View>

        <Row
          title="Reminders"
          subtitle="Quiet local notifications: period expected, period late."
          value={ob.notificationsOptIn}
          onChange={(v) => ob.set({ notificationsOptIn: v })}
        />

        <View style={{ height: t.spacing.xl }} />
        <Button label={busy ? 'Setting up…' : 'Open Lumen'} fullWidth onPress={finish} disabled={busy} />
        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Text variant="caption" color={t.palette.inkMuted}>
            ← Back
          </Text>
        </Pressable>
      </VStack>
    </Screen>
  );
}

function Row({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.palette.paperDeep,
        borderRadius: t.radii.lg,
        padding: t.spacing.lg,
        gap: t.spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color={t.palette.inkMuted}>
          {subtitle}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
