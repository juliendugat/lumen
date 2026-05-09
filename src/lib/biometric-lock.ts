import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type LockResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'no-enrollment' | 'cancelled' | 'failed' };

/**
 * Returns true if the device can do any biometric/PIN authentication.
 * Web always returns false; the lock UI just disables itself there.
 */
export async function isLockAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const hasHw = await LocalAuthentication.hasHardwareAsync();
    if (!hasHw) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch {
    return false;
  }
}

export async function unlock(reason = 'Unlock Lumen'): Promise<LockResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'unsupported' };
  const hasHw = await LocalAuthentication.hasHardwareAsync();
  if (!hasHw) return { ok: false, reason: 'unsupported' };
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return { ok: false, reason: 'no-enrollment' };
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use device passcode',
  });
  if (result.success) return { ok: true };
  if (result.error === 'user_cancel' || result.error === 'system_cancel') {
    return { ok: false, reason: 'cancelled' };
  }
  return { ok: false, reason: 'failed' };
}
