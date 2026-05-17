import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon, type IconName } from '@/ui/icons/Icon';
import { useCycle } from '@/store/cycle';
import { isLockAvailable } from '@/lib/biometric-lock';
import { generateIcs } from '@/lib/ics';
import { addDaysISO } from '@/engine/dates';
import { destroyDbKey } from '@/lib/crypto';
import { cancelAllLumenNotifications, getPermissionStatus, type PermissionStatus } from '@/lib/notifications';
import { exportDoctorReport } from '@/lib/doctor-report';
import { shareWithPartner } from '@/lib/partner-share';
import { isHealthSyncAvailable, syncFromHealth } from '@/lib/health-sync';

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const { settings, prediction, fertile, patchSettings, exportData, wipe } = useCycle();
  const [busy, setBusy] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>('unsupported');
  // Health sync only exists when a custom dev client has the native module
  // bundled. Otherwise the row is a dead-end — hide it rather than showing
  // an alert "Not available on this build" every time the user taps it.
  const [healthAvailable, setHealthAvailable] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getPermissionStatus();
      if (alive) setNotifStatus(s);
      const hs = await isHealthSyncAvailable();
      if (alive) setHealthAvailable(hs);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const remindersEnabled =
    (settings?.notifPeriodSoonDays ?? 0) > 0 ||
    (settings?.notifLateDays ?? 0) > 0 ||
    !!settings?.notifFertileWindow;
  const showNotifWarning =
    remindersEnabled && (notifStatus === 'denied' || notifStatus === 'blocked');

  if (!settings) return null;

  const lifeMode = settings.lifeMode as 'cycling' | 'pregnant' | 'perimenopausal' | 'postpartum';
  const voice = (settings.voice ?? 'adult') as 'adult' | 'teen' | 'clinical';

  const toggleLock = async (next: boolean) => {
    if (next) {
      const avail = await isLockAvailable();
      if (!avail) {
        Alert.alert(
          'Lock not available',
          'Set up Face ID, Touch ID, or a device passcode in your phone settings first.',
        );
        return;
      }
    }
    await patchSettings({ lockEnabled: next });
  };

  const exportJson = async () => {
    if (busy) return;
    setBusy('json');
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      await shareText(json, `lumen-export-${data.exportedAt}.json`, 'application/json');
    } finally {
      setBusy(null);
    }
  };

  const exportIcs = async () => {
    if (busy || !prediction) return;
    setBusy('ics');
    try {
      const forecasts = [];
      let s = prediction.expectedStart;
      let e = prediction.expectedEnd;
      let lo = prediction.confidenceLow;
      let hi = prediction.confidenceHigh;
      for (let i = 0; i < 6; i++) {
        forecasts.push({
          predictedStart: s,
          predictedEnd: e,
          confidenceLow: lo,
          confidenceHigh: hi,
          fertileStart: fertile?.start ? addDaysISO(fertile.start, prediction.cycleLength * i) : undefined,
          fertileEnd: fertile?.end ? addDaysISO(fertile.end, prediction.cycleLength * i) : undefined,
        });
        s = addDaysISO(s, prediction.cycleLength);
        e = addDaysISO(e, prediction.cycleLength);
        lo = addDaysISO(lo, prediction.cycleLength);
        hi = addDaysISO(hi, prediction.cycleLength);
      }
      const ics = generateIcs(forecasts, { calendarName: 'Lumen — Cycle' });
      await shareText(ics, 'lumen.ics', 'text/calendar');
    } finally {
      setBusy(null);
    }
  };

  const exportDoctor = async () => {
    if (busy) return;
    setBusy('doctor');
    try {
      await exportDoctorReport();
    } finally {
      setBusy(null);
    }
  };

  const sharePartner = async () => {
    if (busy) return;
    setBusy('partner');
    try {
      await shareWithPartner(14);
    } finally {
      setBusy(null);
    }
  };

  const tryHealthSync = async () => {
    if (busy) return;
    setBusy('health');
    try {
      const ok = await isHealthSyncAvailable();
      if (!ok) {
        Alert.alert(
          'Not available on this build',
          'Health sync needs a custom Lumen build with the Health module enabled. The web preview and Expo Go don’t support it.',
        );
        await patchSettings({ healthSyncEnabled: false });
        return;
      }
      const r = await syncFromHealth();
      if (r.ok) {
        Alert.alert('Sync complete', `${r.imported} samples imported, ${r.exported} exported.`);
        await patchSettings({ healthSyncEnabled: true });
      } else {
        Alert.alert('Sync unavailable', r.message ?? 'Could not sync.');
      }
    } finally {
      setBusy(null);
    }
  };

  const confirmWipe = () => {
    Alert.alert(
      'Delete all data?',
      'This will erase every cycle, day log, medication, and setting. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setBusy('wipe');
            try {
              await cancelAllLumenNotifications();
              await wipe();
              await destroyDbKey();
              // Settings.onboardedAt is null again after wipe — kick the
              // router to onboarding so the user gets a fresh setup flow.
              router.replace('/(onboarding)');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <VStack gap="xl">
        <View style={{ marginTop: t.spacing.md }}>
          <Text variant="micro" color={t.palette.inkMuted}>SETTINGS</Text>
          <Text variant="h1">Lumen</Text>
        </View>

        {/* ─── YOU ─── Life stage + Voice + Reminders + Quick-bar.
            The most-touched preferences live at the top. */}
        <Section title="You">
          <SegmentedRow
            title="Life stage"
            options={[
              { value: 'cycling', label: 'Cycling' },
              { value: 'pregnant', label: 'Pregnant' },
              { value: 'perimenopausal', label: 'Perimeno' },
              { value: 'postpartum', label: 'Postpartum' },
            ]}
            value={lifeMode}
            onChange={(v) => {
              if (v === 'pregnant') {
                router.push('/pregnancy-setup');
                return;
              }
              patchSettings({ lifeMode: v });
            }}
          />
          {lifeMode === 'pregnant' && (
            <Hint>Cycle predictions are paused. Home shows weeks-pregnant.</Hint>
          )}
          {lifeMode === 'perimenopausal' && (
            <Hint>Variability is wider; predictions show wider windows and don't pretend to be precise.</Hint>
          )}
          {lifeMode === 'postpartum' && (
            <Hint>Predictions paused while cycles return. Resumes once Lumen has logged data.</Hint>
          )}

          <SegmentedRow
            title="Voice"
            options={[
              { value: 'adult', label: 'Adult' },
              { value: 'teen', label: 'Teen' },
              { value: 'clinical', label: 'Clinical' },
            ]}
            value={voice}
            onChange={(v) => {
              // Voice owns terminology: clinical → "menstruation",
              // others → "period". Stored alongside for backwards compat.
              patchSettings({
                voice: v,
                terminology: v === 'clinical' ? 'menstruation' : 'period',
              });
            }}
          />
          {voice === 'teen' && (
            <Hint>Friendlier copy and a Learn tab with body-literacy explainers.</Hint>
          )}
          {voice === 'clinical' && (
            <Hint>Precise terminology ("menstruation", "ovulation"). No hedging.</Hint>
          )}

          {showNotifWarning && (
            <View
              style={{
                marginHorizontal: t.spacing.lg,
                marginVertical: t.spacing.sm,
                padding: t.spacing.md,
                borderRadius: t.radii.md,
                backgroundColor: t.palette.paper,
                borderWidth: 1,
                borderColor: t.palette.warning,
              }}
            >
              <Text variant="bodyStrong" color={t.palette.warning}>
                Notifications are off in your phone settings
              </Text>
              <Text variant="caption" color={t.palette.inkMuted}>
                Lumen has reminders enabled but the OS has them blocked.
              </Text>
            </View>
          )}
          <Row
            icon="flag"
            title="Period expected"
            subtitle="Notify a couple of days before."
            right={
              <Switch
                value={(settings.notifPeriodSoonDays ?? 0) > 0}
                onValueChange={(v) => patchSettings({ notifPeriodSoonDays: v ? 2 : null })}
              />
            }
          />
          <Row
            icon="flag"
            title="Period late"
            subtitle="Notify a couple of days past expected."
            right={
              <Switch
                value={(settings.notifLateDays ?? 0) > 0}
                onValueChange={(v) => patchSettings({ notifLateDays: v ? 2 : null })}
              />
            }
          />
          <Row
            icon="leaf"
            title="Fertile window starting"
            subtitle="Estimate, not contraception."
            right={
              <Switch
                value={settings.notifFertileWindow}
                onValueChange={(v) => patchSettings({ notifFertileWindow: v })}
              />
            }
          />
        </Section>

        {/* ─── LOGGING ─── Fertility, sex log, meds, defaults. */}
        <Section title="Logging">
          <RowAction
            icon="flower"
            title="Cycle defaults"
            subtitle={`${settings.defaultCycleLength}-day cycle, ${settings.defaultPeriodLength}-day period.`}
            onPress={() => router.push('/cycle-defaults')}
          />
          <SegmentedRow
            title="Fertility tracking"
            options={[
              { value: 'off', label: 'Off' },
              { value: 'tracking', label: 'Track' },
              { value: 'avoidance', label: 'Avoid' },
              { value: 'conception', label: 'TTC' },
            ]}
            value={settings.fertilityMode}
            onChange={(v) => patchSettings({ fertilityMode: v })}
          />
          {settings.fertilityMode !== 'off' && (
            <Hint>BBT and cervical mucus appear in the day log. Estimates are not contraception.</Hint>
          )}
          <Row
            icon="heart"
            title="Sex & protection log"
            subtitle="Adds an opt-in section in the day log."
            right={
              <Switch
                value={settings.sexLogEnabled}
                onValueChange={(v) => patchSettings({ sexLogEnabled: v })}
              />
            }
          />
          <RowAction
            icon="pill"
            title="Medications"
            subtitle="Pill, IUD, implant, anything else. Reminders included."
            onPress={() => router.push('/medications')}
          />
        </Section>

        {/* ─── PRIVACY & DATA ─── App lock, exports, policy. All non-
            destructive. Delete-all moved to its own danger zone. */}
        <Section title="Privacy & data">
          <Row
            icon="lock"
            title="App lock"
            subtitle="Require Face ID, Touch ID, or device passcode."
            right={
              <Switch
                value={settings.lockEnabled}
                onValueChange={toggleLock}
                disabled={Platform.OS === 'web'}
              />
            }
          />
          <RowAction
            icon="note"
            title="Privacy policy"
            subtitle="What's on this device, and what isn't sent."
            onPress={() => router.push('/privacy')}
          />
          <RowAction
            icon="export"
            title="Calendar export (.ics)"
            subtitle="Next 6 predicted periods + fertile windows."
            onPress={exportIcs}
            busy={busy === 'ics'}
            disabled={!prediction}
          />
          <RowAction
            icon="note"
            title="Doctor report (PDF)"
            subtitle="Last 12 months: cycle stats, symptoms, medications."
            onPress={exportDoctor}
            busy={busy === 'doctor'}
          />
          <RowAction
            icon="heart"
            title="Share with partner"
            subtitle="A read-only snapshot, expires in 14 days."
            onPress={sharePartner}
            busy={busy === 'partner'}
          />
          <RowAction
            icon="export"
            title="Export all data (JSON)"
            subtitle="Plain JSON. Save somewhere private."
            onPress={exportJson}
            busy={busy === 'json'}
          />
          {healthAvailable && (
            <RowAction
              icon="sparkle"
              title="Health sync"
              subtitle="HealthKit / Health Connect"
              onPress={tryHealthSync}
              busy={busy === 'health'}
            />
          )}
        </Section>

        {/* ─── DANGER ZONE ─── Destructive actions, visually segregated
            so they don't read as peer to "Export". */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="micro" color={t.palette.error}>
            DANGER ZONE
          </Text>
          <Card
            padded={false}
            style={{
              borderWidth: 1,
              borderColor: t.palette.error,
              backgroundColor: t.palette.paper,
            }}
          >
            <RowAction
              icon="trash"
              title="Delete all data"
              subtitle="Wipe everything from this device. Cannot be undone."
              onPress={confirmWipe}
              danger
              busy={busy === 'wipe'}
            />
          </Card>
        </View>

        {/* Version string with long-press to open diagnostics. Most users
            never need diagnostics; debug users will find it. */}
        <Pressable
          onLongPress={() => router.push('/diagnostics')}
          accessibilityRole="text"
          accessibilityHint="Long-press to open diagnostics"
          delayLongPress={600}
        >
          <Text
            variant="caption"
            color={t.palette.inkFaint}
            align="center"
            style={{ paddingVertical: t.spacing.lg }}
          >
            Lumen 0.2 · local-only cycle tracking
          </Text>
        </Pressable>
      </VStack>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <VStack gap="sm">
      <Text variant="micro" color={t.palette.inkMuted}>
        {title.toUpperCase()}
      </Text>
      <Card padded={false}>
        <View style={{ paddingVertical: t.spacing.xs }}>{children}</View>
      </Card>
    </VStack>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.md,
      }}
    >
      {icon && (
        <View
          style={{
            padding: 8,
            borderRadius: t.radii.md,
            backgroundColor: t.palette.paper,
          }}
        >
          <Icon name={icon} size={18} color={t.palette.ink} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle && (
          <Text variant="caption" color={t.palette.inkMuted}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

function RowAction({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  busy,
  disabled,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  busy?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!busy || !!disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.md,
        opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
      })}
    >
      {icon && (
        <View
          style={{
            padding: 8,
            borderRadius: t.radii.md,
            backgroundColor: t.palette.paper,
          }}
        >
          <Icon name={icon} size={18} color={danger ? t.palette.error : t.palette.ink} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={danger ? t.palette.error : t.palette.ink}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color={t.palette.inkMuted}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text variant="caption" color={t.palette.inkMuted}>
        {busy ? '…' : '›'}
      </Text>
    </Pressable>
  );
}

function SegmentedRow({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.md,
        gap: t.spacing.sm,
      }}
    >
      <Text variant="bodyStrong">{title}</Text>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: t.palette.paper,
          borderRadius: t.radii.pill,
          padding: 4,
          gap: 4,
        }}
      >
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === o.value }}
            accessibilityLabel={o.label}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: t.radii.pill,
              backgroundColor: value === o.value ? t.palette.ink : 'transparent',
            }}
          >
            <Text
              variant="caption"
              color={value === o.value ? t.palette.paper : t.palette.inkSoft}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text
      variant="caption"
      color={t.palette.inkFaint}
      style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.md }}
    >
      {children}
    </Text>
  );
}

async function shareText(text: string, filename: string, mime: string) {
  if (Platform.OS === 'web') {
    const w = window as unknown as { document: Document };
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = w.document.createElement('a');
    a.href = url;
    a.download = filename;
    w.document.body.appendChild(a);
    a.click();
    w.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: mime });
  }
}
