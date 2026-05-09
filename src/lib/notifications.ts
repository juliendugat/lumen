import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDaysISO, fromISO, type ISODate } from '@/engine/dates';

/**
 * Lumen notifications — local-only.
 *
 * We tag every notification with an identifier so we can cancel and re-schedule
 * the full set whenever the prediction changes. Three categories:
 *   - period-soon:  "Your period may start in N days"
 *   - period-late:  "Your period is N days late" (anchored on confidence-high)
 *   - fertile-start: "Your fertile window is starting" (opt-in)
 */

export const NOTIF_IDS = {
  periodSoon: 'lumen.period-soon',
  periodLate: 'lumen.period-late',
  fertileStart: 'lumen.fertile-start',
  medication: 'lumen.med',
} as const;

let configured = false;
function configureOnce() {
  if (configured) return;
  if (Platform.OS === 'web') {
    configured = true;
    return;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  configured = true;
}

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unsupported';

export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  configureOnce();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return 'granted';
  if (cur.canAskAgain) return 'denied';
  return 'blocked';
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  configureOnce();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function fireAt(date: Date) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  } as Notifications.NotificationTriggerInput;
}

export type ScheduleParams = {
  predictedStart: ISODate;
  confidenceHigh: ISODate;
  fertileStart?: ISODate;
  periodSoonDays?: number; // e.g. 2 → "starts in 2 days"
  lateDays?: number; // e.g. 2 → "2 days late"
  fertileEnabled?: boolean;
};

async function cancelAll(prefixes: readonly string[]) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((s) => prefixes.some((p) => s.identifier.startsWith(p)))
      .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)),
  );
}

export async function rescheduleNotifications(params: ScheduleParams): Promise<void> {
  if (Platform.OS === 'web') return;
  configureOnce();
  await cancelAll(Object.values(NOTIF_IDS));

  const granted = await ensurePermission();
  if (!granted) return;

  const fireHour = 9; // 09:00 local

  if (params.periodSoonDays && params.periodSoonDays > 0) {
    const fireDay = addDaysISO(params.predictedStart, -params.periodSoonDays);
    const at = atLocalTime(fireDay, fireHour);
    if (at.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIF_IDS.periodSoon}.${fireDay}`,
        content: {
          title: 'Period expected soon',
          body: `Your period is likely to start around ${humanDate(params.predictedStart)}.`,
        },
        trigger: fireAt(at),
      });
    }
  }

  if (params.lateDays && params.lateDays > 0) {
    const fireDay = addDaysISO(params.predictedStart, params.lateDays);
    const at = atLocalTime(fireDay, fireHour);
    if (at.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIF_IDS.periodLate}.${fireDay}`,
        content: {
          title: 'Period running late',
          body: `It's ${params.lateDays} days past the expected start. Tap to log.`,
        },
        trigger: fireAt(at),
      });
    }
  }

  if (params.fertileEnabled && params.fertileStart) {
    const at = atLocalTime(params.fertileStart, fireHour);
    if (at.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIF_IDS.fertileStart}.${params.fertileStart}`,
        content: {
          title: 'Fertile window starting',
          body: 'Estimated fertile window begins today. Estimate, not contraception.',
        },
        trigger: fireAt(at),
      });
    }
  }
}

export async function cancelAllLumenNotifications(): Promise<void> {
  await cancelAll(Object.values(NOTIF_IDS));
}

/**
 * Reschedule medication reminders for the next 7 days. Each scheduled instance
 * is identified by `{NOTIF_IDS.medication}.{medId}.{ISO date}.{HH:MM}` so we can
 * cancel the whole set on update.
 */
export async function rescheduleMedReminders(
  meds: Array<{
    id: string;
    name: string;
    schedule:
      | { kind: 'daily'; times: string[] }
      | { kind: 'cycle'; activeDays: number; breakDays: number; times: string[] }
      | { kind: 'asNeeded' }
      | null;
    startedAt: string | null;
    stoppedAt: string | null;
    active: boolean;
  }>,
): Promise<void> {
  if (Platform.OS === 'web') return;
  configureOnce();
  await cancelAll([NOTIF_IDS.medication]);
  const granted = await ensurePermission();
  if (!granted) return;

  const now = new Date();
  for (let dOff = 0; dOff < 7; dOff++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dOff);
    for (const m of meds) {
      if (!m.active || !m.schedule) continue;
      let times: string[] = [];
      if (m.schedule.kind === 'daily') {
        times = m.schedule.times;
      } else if (m.schedule.kind === 'cycle') {
        if (!m.startedAt) continue;
        const startMs = new Date(m.startedAt).getTime();
        const dayMs = day.getTime();
        const elapsed = Math.floor((dayMs - startMs) / 86_400_000);
        if (elapsed < 0) continue;
        const cycleLen = m.schedule.activeDays + m.schedule.breakDays;
        const inCycleDay = elapsed % cycleLen;
        if (inCycleDay >= m.schedule.activeDays) continue;
        times = m.schedule.times;
      }
      for (const time of times) {
        const [hStr, minStr] = time.split(':');
        const h = parseInt(hStr, 10);
        const min = parseInt(minStr, 10);
        if (Number.isNaN(h) || Number.isNaN(min)) continue;
        const fire = new Date(day);
        fire.setHours(h, min, 0, 0);
        if (fire.getTime() < Date.now() + 60_000) continue;
        const iso = day.toISOString().slice(0, 10);
        await Notifications.scheduleNotificationAsync({
          identifier: `${NOTIF_IDS.medication}.${m.id}.${iso}.${time}`,
          content: {
            title: `Time: ${m.name}`,
            body: 'Tap to log the dose.',
          },
          trigger: fireAt(fire),
        });
      }
    }
  }
}

function atLocalTime(iso: ISODate, hour: number): Date {
  const d = fromISO(iso);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function humanDate(iso: ISODate): string {
  const d = fromISO(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
