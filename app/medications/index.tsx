import { useEffect, useState, useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { listMedications, logDose, type MedicationView } from '@/db/repo';
import { Illustration } from '@/ui/illustrations/Illustration';
import { rescheduleMedReminders } from '@/lib/notifications';

export default function MedicationsList() {
  const t = useTheme();
  const router = useRouter();
  const [meds, setMeds] = useState<MedicationView[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await listMedications();
      setMeds(list);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Text variant="bodyStrong">‹ Back</Text>
        </Pressable>
        <Text variant="bodyStrong">Medications</Text>
        <Pressable
          onPress={() => router.push('/medications/edit')}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
          hitSlop={12}
        >
          <Icon name="add" size={24} color={t.palette.ink} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: t.spacing.lg, paddingBottom: t.spacing.xxxl, gap: t.spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
      >
        {meds.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: t.spacing.xxl, gap: t.spacing.md }}>
            <Illustration name="no-data" width={200} height={140} />
            <Text variant="bodyStrong" align="center">
              No medications yet
            </Text>
            <Text variant="caption" color={t.palette.inkMuted} align="center">
              Add the pill, an IUD, or other meds. Lumen will remind you to take a dose
              and remember when you started.
            </Text>
            <Button
              label="Add medication"
              onPress={() => router.push('/medications/edit')}
              tone="primary"
              fullWidth
            />
          </View>
        ) : (
          <VStack gap="md">
            {meds.map((m) => (
              <MedRow
                key={m.id}
                med={m}
                onPress={() => router.push(`/medications/edit?id=${m.id}`)}
                onTake={async () => {
                  await logDose(m.id, Date.now());
                  await rescheduleMedReminders(meds);
                  reload();
                }}
              />
            ))}
          </VStack>
        )}
      </ScrollView>
    </Screen>
  );
}

function MedRow({
  med,
  onPress,
  onTake,
}: {
  med: MedicationView;
  onPress: () => void;
  onTake: () => void;
}) {
  const t = useTheme();
  const subtitle = describeSchedule(med);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Edit ${med.name}`}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.85 : 1 }}>
          <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' }}>
            <View
              style={{
                padding: 10,
                borderRadius: t.radii.md,
                backgroundColor: t.palette.paper,
              }}
            >
              <Icon name="pill" size={22} color={t.palette.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{med.name}</Text>
              <Text variant="caption" color={t.palette.inkMuted}>
                {subtitle}
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onTake();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Log dose of ${med.name}`}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: t.palette.ink,
                borderRadius: t.radii.pill,
              }}
            >
              <Text variant="caption" color={t.palette.paper}>
                Took it
              </Text>
            </Pressable>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

function describeSchedule(m: MedicationView): string {
  if (!m.schedule) return m.kind === 'iud' || m.kind === 'implant' ? 'Long-term contraception' : 'No schedule';
  if (m.schedule.kind === 'daily') {
    return `Daily at ${m.schedule.times.join(', ')}`;
  }
  if (m.schedule.kind === 'cycle') {
    return `${m.schedule.activeDays} on / ${m.schedule.breakDays} off — ${m.schedule.times.join(', ')}`;
  }
  return 'As needed';
}
