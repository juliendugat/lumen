import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_NAME = 'lumen.db.key';

/**
 * Cross-platform key store. On native we use SecureStore (Keychain/Keystore).
 * On web SecureStore is unavailable, so we fall back to AsyncStorage —
 * web builds are dev/preview only; production native builds get hardware-backed
 * storage and (in a follow-up) SQLCipher.
 */
async function getItem(name: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(name);
  }
  return SecureStore.getItemAsync(name);
}

async function setItem(name: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(name, value);
    return;
  }
  await SecureStore.setItemAsync(name, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

async function deleteItem(name: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(name);
    return;
  }
  await SecureStore.deleteItemAsync(name);
}

/**
 * Get-or-create the database encryption key. Hex-encoded 32 bytes (256 bit).
 * Used by SQLCipher when we wire it in for native builds. On web it's stored
 * but unused (no encryption-at-rest available to wa-sqlite/IndexedDB).
 */
export async function getOrCreateDbKey(): Promise<string> {
  const existing = await getItem(KEY_NAME);
  if (existing) return existing;
  const bytes = await Crypto.getRandomBytesAsync(32);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await setItem(KEY_NAME, hex);
  return hex;
}

export async function destroyDbKey(): Promise<void> {
  await deleteItem(KEY_NAME);
}
