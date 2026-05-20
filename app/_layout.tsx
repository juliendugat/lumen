import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  View,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/ui/ThemeProvider';
import { openDb, isOpfsLockError } from '@/db/client';
import { runDemoSeed } from '@/dev/demo-seed';
import { getOrCreateDbKey } from '@/lib/crypto';
import { useCycle } from '@/store/cycle';
import { isLockAvailable, unlock } from '@/lib/biometric-lock';
import { Button } from '@/ui/components/Button';
import { Text } from '@/ui/components/Text';
import { useAppFonts } from '@/ui/fonts';
import { ErrorBoundary } from '@/ui/ErrorBoundary';

export default function RootLayout() {
  // Honor the user's Appearance preference. 'system' (or unset) → follow the
  // OS; 'light'/'dark' → force that palette via ThemeProvider's override.
  const themeMode = useCycle((s) => s.settings?.themeMode);
  const override = themeMode === 'light' ? 'light' : themeMode === 'dark' ? 'dark' : undefined;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider override={override}>
          <ErrorBoundary>
            <Bootstrap />
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Bootstrap() {
  const t = useTheme();
  const fonts = useAppFonts();
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const refresh = useCycle((s) => s.refresh);
  const settings = useCycle((s) => s.settings);

  // Auth-prompt mutex: while a Face ID / Touch ID prompt is on-screen, the
  // app transitions through 'inactive' and back to 'active', which would
  // otherwise trigger the AppState re-lock below and immediately re-lock the
  // user the moment they successfully authenticate. We set this true around
  // the unlock() call to gate that re-lock.
  const unlocking = useRef(false);
  // Track the last AppState so we only re-lock on a real background→active
  // round-trip — not on inactive→active (which is what iOS uses for system
  // overlays like Face ID, Control Centre, the multitasking switcher).
  const lastAppState = useRef<AppStateStatus>('active');

  // Boot: open DB, ensure key, hydrate state
  useEffect(() => {
    (async () => {
      try {
        // Fail fast with a friendly message on a non-isolated dev page.
        if (
          Platform.OS === 'web' &&
          typeof (globalThis as { SharedArrayBuffer?: unknown }).SharedArrayBuffer === 'undefined'
        ) {
          throw new Error(
            'SharedArrayBuffer is not defined — open http://localhost:8082 (npm run web:isolated), not 8081.',
          );
        }
        await getOrCreateDbKey();
        await openDb();
        // Dev-only demo seed via ?demo=1. Wipes & repopulates with deterministic
        // sample data so screenshots & demos stay reproducible. No-op outside web.
        if (Platform.OS === 'web') {
          const search =
            (globalThis as { location?: { search?: string } }).location?.search ?? '';
          if (search.includes('demo=1')) {
            await runDemoSeed();
          }
        }
        await refresh();
        setBooted(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[Lumen boot]', e);
        const stack = e instanceof Error && e.stack ? '\n' + e.stack.split('\n').slice(0, 4).join('\n') : '';
        setBootError(
          (e instanceof Error ? e.message : String(e)) + stack,
        );
      }
    })();
  }, [refresh]);

  // App-lock: prompt when foregrounding if enabled
  useEffect(() => {
    if (!booted) return;
    if (!settings?.lockEnabled) return;

    let mounted = true;
    (async () => {
      const avail = await isLockAvailable();
      if (!avail) return;
      setLocked(true);
    })();

    const sub = AppState.addEventListener('change', async (state) => {
      const prev = lastAppState.current;
      lastAppState.current = state;
      // Skip re-lock while a Face ID / Touch ID prompt is on-screen.
      if (unlocking.current) return;
      // Only re-lock on a real background → active round-trip (i.e. user
      // came back from the home screen / app switcher). 'inactive' → 'active'
      // covers transient overlays — Control Centre, Face ID prompt, etc.
      if (state === 'active' && prev === 'background' && settings.lockEnabled) {
        const avail = await isLockAvailable();
        if (avail && mounted) setLocked(true);
      }
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [booted, settings?.lockEnabled]);

  const handleUnlock = async () => {
    unlocking.current = true;
    try {
      const r = await unlock('Unlock Lumen');
      if (r.ok) setLocked(false);
    } finally {
      // Clear after a short tail so any AppState 'active' event that fires
      // *after* the prompt dismisses still sees unlocking=true and bails.
      setTimeout(() => {
        unlocking.current = false;
      }, 800);
    }
  };

  if (bootError) {
    const opfsLocked = isOpfsLockError(bootError);
    const sabMissing = bootError.includes('SharedArrayBuffer');
    return (
      <FullScreen background={t.palette.paper}>
        <View style={{ maxWidth: 480, alignItems: 'center', gap: 16 }}>
          <Text variant="h1" align="center">
            Couldn't start
          </Text>
          {sabMissing ? (
            <Text variant="body" color={t.palette.inkMuted} align="center">
              The browser hasn't enabled SharedArrayBuffer for this page. That's
              required for the local database. In dev, run{' '}
              <Text variant="bodyStrong">npm run web:isolated</Text> and open{' '}
              <Text variant="bodyStrong">http://localhost:8082</Text> instead of 8081.
            </Text>
          ) : opfsLocked ? (
            <>
              <Text variant="body" color={t.palette.inkMuted} align="center">
                Lumen's local database is locked by another tab or by a previous
                session that's still releasing. Close any other Lumen tabs, or tap
                below to clear local data and reload.
              </Text>
              {Platform.OS === 'web' && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Button
                    label="Reload"
                    tone="secondary"
                    onPress={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (globalThis as any).location?.reload?.();
                    }}
                  />
                  <Button
                    label="Clear & reload"
                    tone="primary"
                    onPress={async () => {
                      try {
                        await clearWebStorage();
                      } finally {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (globalThis as any).location?.reload?.();
                      }
                    }}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <ScrollView
                style={{ maxHeight: 300, alignSelf: 'stretch' }}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                <Text
                  variant="caption"
                  color={t.palette.inkMuted}
                  align="left"
                  selectable
                  style={{
                    fontFamily:
                      Platform.OS === 'web' ? 'ui-monospace, Menlo, monospace' : undefined,
                  }}
                >
                  {bootError}
                </Text>
              </ScrollView>
              {Platform.OS === 'web' && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Button
                    label="Reload"
                    tone="secondary"
                    onPress={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (globalThis as any).location?.reload?.();
                    }}
                  />
                  <Button
                    label="Wipe & reload"
                    tone="danger"
                    onPress={async () => {
                      try {
                        await clearWebStorage();
                      } finally {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (globalThis as any).location?.reload?.();
                      }
                    }}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </FullScreen>
    );
  }

  if (!booted || !fonts.ready) {
    return (
      <FullScreen background={t.palette.paper}>
        <ActivityIndicator color={t.palette.ink} />
      </FullScreen>
    );
  }

  if (locked) {
    return <LockGate onUnlock={handleUnlock} />;
  }

  return <Routes />;
}

/**
 * Full-viewport container that's robust against flex-context bugs.
 * Uses absolute positioning rather than flex: 1 so it always covers the
 * window even if a parent provider doesn't propagate flex correctly on web.
 */
function FullScreen({
  children,
  background,
}: {
  children: React.ReactNode;
  background: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Wipe OPFS + IndexedDB for the current origin. Used by the recovery button
 * when wa-sqlite hits a `NoModificationAllowedError` because a stale handle
 * is still held (typically after a hot-reload in dev).
 */
async function clearWebStorage(): Promise<void> {
  if (Platform.OS !== 'web') return;
  const g = globalThis as unknown as {
    navigator?: {
      storage?: {
        getDirectory?: () => Promise<{
          removeEntry: (name: string, opts?: { recursive?: boolean }) => Promise<void>;
          values?: () => AsyncIterable<{ name: string; kind: string }>;
        }>;
      };
    };
    indexedDB?: {
      databases?: () => Promise<Array<{ name?: string }>>;
      deleteDatabase: (name: string) => IDBOpenDBRequest;
    };
  };
  // Wipe OPFS
  try {
    const root = await g.navigator?.storage?.getDirectory?.();
    if (root && typeof (root as { values?: unknown }).values === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const it = (root as any).values() as AsyncIterable<{ name: string }>;
      for await (const entry of it) {
        try {
          await root.removeEntry(entry.name, { recursive: true });
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  // Wipe IndexedDB
  try {
    if (g.indexedDB?.databases) {
      const dbs = await g.indexedDB.databases();
      for (const d of dbs) {
        if (d.name) g.indexedDB.deleteDatabase(d.name);
      }
    }
  } catch {
    /* ignore */
  }
  // Wipe localStorage (AsyncStorage on web persists here)
  try {
    const ls = (globalThis as { localStorage?: { clear: () => void } }).localStorage;
    ls?.clear();
  } catch {
    /* ignore */
  }
  // Wipe sessionStorage just in case
  try {
    const ss = (globalThis as { sessionStorage?: { clear: () => void } }).sessionStorage;
    ss?.clear();
  } catch {
    /* ignore */
  }
}

function LockGate({ onUnlock }: { onUnlock: () => Promise<void> | void }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.palette.paper,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 24,
      }}
    >
      <Text variant="display" align="center">
        Lumen
      </Text>
      <Text variant="body" color={t.palette.inkMuted} align="center">
        Unlock to continue
      </Text>
      <Button
        label="Unlock"
        onPress={() => {
          void onUnlock();
        }}
      />
    </View>
  );
}

function Routes() {
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const settings = useCycle((s) => s.settings);

  // Onboarding gate: redirect to /onboarding if not done.
  useEffect(() => {
    if (!settings) return;
    const inOnboarding = segments[0] === '(onboarding)';
    if (!settings.onboardedAt && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (settings.onboardedAt && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [settings, segments, router]);

  return (
    <>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.palette.paper },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="log/[date]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="customize-quickbar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="medications/index" />
        <Stack.Screen name="medications/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="pregnancy-setup" options={{ presentation: 'modal' }} />
        <Stack.Screen name="diagnostics" />
        <Stack.Screen name="cycle-defaults" />
      </Stack>
    </>
  );
}
