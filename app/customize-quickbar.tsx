import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { useCycle } from '@/store/cycle';
import {
  DEFAULT_QUICK_BAR,
  parseQuickBar,
  QUICK_ACTIONS,
  type QuickAction,
} from '@/features/quick-bar/quickBar';

const MAX = 10;
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

  const reset = () => setPicks(DEFAULT_QUICK_BAR);

  const grouped = useMemo(
    () => ({
      Symptoms: QUICK_ACTIONS.filter((a) => a.kind === 'symptom'),
      Mood: QUICK_ACTIONS.filter((a) => a.kind === 'mood'),
      Tracking: QUICK_ACTIONS.filter((a) =>
        ['bbt', 'mucus', 'sex', 'note'].includes(a.kind),
      ),
    }),
    [],
  );

  // Counter colour subtly cues "you're at the limit".
  const counterColor =
    picks.length >= MAX
      ? t.palette.warning
      : picks.length <= MIN
      ? t.palette.warning
      : t.palette.inkMuted;

  return (
    <Screen padded={false}>
      {/* Sticky header — Cancel + title + Reset, plus the count + helper. */}
      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: t.palette.paperEdge,
          backgroundColor: t.palette.paper,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
          >
            <Text variant="bodyStrong">Cancel</Text>
          </Pressable>
          <Text variant="bodyStrong">Quick-bar</Text>
          <Pressable
            onPress={reset}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Reset to defaults"
          >
            <Text variant="bodyStrong" color={t.palette.inkMuted}>
              Reset
            </Text>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: t.spacing.sm,
          }}
        >
          <Text variant="caption" color={t.palette.inkMuted}>
            Pick {MIN}–{MAX} chips for the home screen.
          </Text>
          <Text variant="caption" color={counterColor}>
            {picks.length} / {MAX}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: t.spacing.lg,
          paddingBottom: 96, // leave room for the sticky save bar
          gap: t.spacing.lg,
        }}
      >
        {(Object.entries(grouped) as Array<[string, typeof QUICK_ACTIONS]>).map(
          ([title, items]) => (
            <View key={title}>
              <Text
                variant="micro"
                color={t.palette.inkMuted}
                style={{ marginBottom: t.spacing.sm }}
              >
                {title.toUpperCase()}
              </Text>
              <Card padded={false}>
                {items.map((a, i) => (
                  <Row
                    key={a.id}
                    action={a}
                    selected={picks.includes(a.id)}
                    canAdd={picks.length < MAX}
                    canRemove={picks.length > MIN}
                    onToggle={() => toggle(a.id)}
                    isFirst={i === 0}
                  />
                ))}
              </Card>
            </View>
          ),
        )}

        <Text variant="caption" color={t.palette.inkFaint}>
          Flow chips (Spotting / Light / Medium / Heavy) are always shown above the
          quick-bar — no need to add them here.
        </Text>
      </ScrollView>

      {/* Sticky save bar — always reachable without scrolling. */}
      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: t.palette.paperEdge,
          backgroundColor: t.palette.paper,
        }}
      >
        <Button label={busy ? 'Saving…' : 'Save'} fullWidth onPress={save} disabled={busy} />
      </View>
    </Screen>
  );
}

function Row({
  action,
  selected,
  canAdd,
  canRemove,
  onToggle,
  isFirst,
}: {
  action: QuickAction;
  selected: boolean;
  canAdd: boolean;
  canRemove: boolean;
  onToggle: () => void;
  isFirst: boolean;
}) {
  const t = useTheme();
  // A row is interactable unless it would push us over MAX (when adding) or
  // under MIN (when removing).
  const disabled = selected ? !canRemove : !canAdd;

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={action.label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.md,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: t.palette.paperEdge,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          padding: 8,
          borderRadius: t.radii.md,
          backgroundColor: t.palette.paper,
          marginRight: t.spacing.md,
        }}
      >
        <Icon name={action.icon} size={20} color={t.palette.ink} />
      </View>
      <Text variant="body" style={{ flex: 1 }}>
        {action.label}
      </Text>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: selected ? t.palette.ink : t.palette.paperEdge,
          backgroundColor: selected ? t.palette.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Icon name="check" size={16} color={t.palette.paper} />}
      </View>
    </Pressable>
  );
}
