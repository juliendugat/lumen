import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';
import { repairData, runDiagnostics, type DiagnosticsReport } from '@/db/repo';

export default function Diagnostics() {
  const t = useTheme();
  const router = useRouter();
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setReport(await runDiagnostics());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const repair = async () => {
    setLoading(true);
    try {
      const r = await repairData();
      Alert.alert(
        'Repair complete',
        r.orphansFixed === 0
          ? 'No issues found.'
          : `Fixed ${r.orphansFixed} orphan day(s) — they pointed at a cycle that no longer exists.`,
      );
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const version = Constants.expoConfig?.version ?? '?';

  return (
    <Screen scroll>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text variant="bodyStrong" color={t.palette.inkMuted}>
          ‹ Back
        </Text>
      </Pressable>

      <View style={{ marginTop: t.spacing.lg, marginBottom: t.spacing.lg }}>
        <Text variant="micro" color={t.palette.inkMuted}>DIAGNOSTICS</Text>
        <Text variant="h1">Storage check</Text>
        <Text variant="body" color={t.palette.inkMuted}>
          A quick look at what's actually on this device. Useful for support, or just curiosity.
        </Text>
      </View>

      {report && (
        <VStack gap="md">
          <Card>
            <VStack gap="xs">
              <Text variant="micro" color={t.palette.inkMuted}>APP</Text>
              <Row label="Version" value={`Lumen ${version}`} />
              <Row label="Schema version" value={String(report.schemaVersion)} />
            </VStack>
          </Card>

          <Card>
            <VStack gap="xs">
              <Text variant="micro" color={t.palette.inkMuted}>YOUR DATA</Text>
              <Row label="Cycles logged" value={String(report.cycleCount)} />
              <Row
                label="Oldest cycle"
                value={report.oldestCycle ?? '—'}
              />
              <Row
                label="Newest cycle"
                value={report.newestCycle ?? '—'}
              />
              <Row label="Day entries" value={String(report.loggedDayCount)} />
              <Row label="Prediction records" value={String(report.predictionRecords)} />
              <Row label="Medications" value={String(report.medicationCount)} />
              <Row label="Doses logged" value={String(report.doseCount)} />
            </VStack>
          </Card>

          <Card>
            <VStack gap="xs">
              <Text variant="micro" color={t.palette.inkMuted}>INTEGRITY</Text>
              <Row
                label="Orphan day records"
                value={String(report.orphanDays)}
                tone={report.orphanDays > 0 ? 'warning' : 'ok'}
              />
              <Text variant="caption" color={t.palette.inkFaint}>
                Orphans are day logs whose cycle was deleted. The app handles them safely;
                "Repair" detaches them from their missing cycle so they don't show stale references.
              </Text>
            </VStack>
          </Card>

          <Button
            label={loading ? 'Working…' : 'Run repair'}
            tone="secondary"
            fullWidth
            onPress={repair}
            disabled={loading}
          />

          <Text variant="caption" color={t.palette.inkFaint} align="center" style={{ marginTop: t.spacing.md }}>
            Nothing on this screen leaves your device.
          </Text>
        </VStack>
      )}
    </Screen>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warning' }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
      <Text variant="body" color={t.palette.inkMuted}>{label}</Text>
      <Text
        variant="bodyStrong"
        color={tone === 'warning' ? t.palette.warning : t.palette.ink}
      >
        {value}
      </Text>
    </View>
  );
}
