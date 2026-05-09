import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { useCycle } from '@/store/cycle';
import { DEFAULT_QUICK_BAR, parseQuickBar, QUICK_ACTIONS } from '@/features/quick-bar/quickBar';

const MAX = 6;
const MIN = 3;

export default function CustomizeQuickBar() {
  const t = useTheme();
  const router = useRouter();
  const { settings, patchSettings } = useCycle();
  const [picks, setPicks] = useState<string[]>(parseQuickBar(settings?.quickBarConfig));
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => {
    setPicks((cur) => {
      if (cur.includes(id)) {
        if (cur.length <= MIN) return cur;
        return cur.filter((x) => x !== id);
      }
      if (cur.length >= MAX) return cur;
      return [...cur, id];
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      await patchSettings({ quickBarConfig: JSON.stringify(picks) });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setPicks(DEFAULT_QUICK_BAR);
  };

  const grouped = {
    Flow: QUICK_ACTIONS.filter((a) => a.kind === 'flow'),
    Symptoms: QUICK_ACTIONS.filter((a) => a.kind === 'symptom'),
    Mood: QUICK_ACTIONS.filter((a) => a.kind === 'mood'),
    Tracking: QUICK_ACTIONS.filter((a) => ['bbt', 'mucus', 'sex', 'note'].includes(a.kind)),
  };

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cancel and go back">
          <Text variant="bodyStrong">Cancel</Text>
        </Pressable>
        <Text variant="bodyStrong">Quick-bar</Text>
        <Pressable onPress={reset} hitSlop={12} accessibilityRole="button">
          <Text variant="bodyStrong" color={t.palette.inkMuted}>
            Reset
          </Text>
        </Pressable>
      </View>

      <View style={{ marginVertical: t.spacing.lg }}>
        <Text variant="caption" color={t.palette.inkMuted}>
          Pick {MIN}–{MAX} chips to show under the cycle ring on the home screen.
          {' '}({picks.length} selected)
        </Text>
      </View>

      <VStack gap="lg">
        {(Object.entries(grouped) as Array<[string, typeof QUICK_ACTIONS]>).map(([title, items]) => (
          <View key={title}>
            <Text variant="micro" color={t.palette.inkMuted} style={{ marginBottom: t.spacing.sm }}>
              {title.toUpperCase()}
            </Text>
            <Card padded={false}>
              {items.map((a, i) => (
                <Pressable
                  key={a.id}
                  onPress={() => toggle(a.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: picks.includes(a.id) }}
                  accessibilityLabel={a.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: t.spacing.lg,
                    paddingVertical: t.spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.palette.paperEdge,
                  }}
                >
                  <View
                    style={{
                      padding: 8,
                      borderRadius: t.radii.md,
                      backgroundColor: t.palette.paper,
                      marginRight: t.spacing.md,
                    }}
                  >
                    <Icon name={a.icon} size={20} color={t.palette.ink} />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {a.label}
                  </Text>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: picks.includes(a.id) ? t.palette.ink : t.palette.paperEdge,
                      backgroundColor: picks.includes(a.id) ? t.palette.ink : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {picks.includes(a.id) && <Icon name="check" size={16} color={t.palette.paper} />}
                  </View>
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
      </VStack>

      <View style={{ height: t.spacing.xl }} />
      <Button label={busy ? 'Saving…' : 'Save'} fullWidth onPress={save} disabled={busy} />
    </Screen>
  );
}
