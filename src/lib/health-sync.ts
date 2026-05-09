import { Platform } from 'react-native';

/**
 * Health-sync abstraction.
 *
 * Real implementations would call:
 *  - iOS: HealthKit via `react-native-health` or `expo-health`
 *  - Android: Health Connect via `react-native-health-connect`
 *
 * Both packages require a custom native build (EAS or prebuild). Until that
 * native build is wired up, this module provides:
 *  - a stable JS API the app can call
 *  - clear `unavailable` results on web and on the standard Expo Go runtime
 *
 * This keeps the UI honest — the user sees "not available on this build"
 * rather than fake data.
 */

export type HealthSample = {
  date: string; // ISO date
  bbt?: number;
  flow?: 'spotting' | 'light' | 'medium' | 'heavy' | null;
  sleepMinutes?: number;
  steps?: number;
};

export type SyncResult =
  | { ok: true; imported: number; exported: number }
  | { ok: false; reason: 'unavailable' | 'denied' | 'error'; message?: string };

/**
 * Whether health sync can run on the current build.
 * Returns false on web and on builds without the native module.
 */
export async function isHealthSyncAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  // Probe for the native module; in this scaffold no native module is
  // bundled, so this always returns false. Once a custom dev client is
  // built with `react-native-health` (iOS) or `react-native-health-connect`
  // (Android), replace this with the appropriate availability check.
  return false;
}

export async function requestPermissions(): Promise<{ ok: boolean }> {
  if (!(await isHealthSyncAvailable())) return { ok: false };
  // Replace with platform-specific requestAuthorization() once wired.
  return { ok: false };
}

export async function syncFromHealth(): Promise<SyncResult> {
  if (!(await isHealthSyncAvailable())) return { ok: false, reason: 'unavailable' };
  // Real impl would:
  //  - read MenstrualFlow, BasalBodyTemperature, Sleep, ActiveEnergy
  //  - upsert into our days table
  return { ok: false, reason: 'unavailable' };
}

export async function syncToHealth(_samples: HealthSample[]): Promise<SyncResult> {
  if (!(await isHealthSyncAvailable())) return { ok: false, reason: 'unavailable' };
  // Real impl would write MenstrualFlow / BasalBodyTemperature samples back.
  return { ok: false, reason: 'unavailable' };
}
