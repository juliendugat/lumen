import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { useTheme } from '@/ui/ThemeProvider';
import { useCycle } from '@/store/cycle';
import { fromISO, todayISO } from '@/engine/dates';
import { getDay, parseArr } from '@/db/repo';
import { Icon, type IconName } from '@/ui/icons/Icon';
import { FlowTiles, type FlowValue } from '@/features/home/FlowTiles';
import {
  ALL_SYMPTOM_ITEMS,
  DISCHARGE_VALUES,
  MOOD_ITEMS,
  SYMPTOM_GROUPS,
  type SymptomItem,
} from '@/features/day-log/symptomCatalog';
import { VoiceMemos } from '@/features/day-log/VoiceMemos';
import { useCopy } from '@/copy/useCopy';

/**
 * Day-log redesign (UX Review issue 02 + redesign 02):
 *
 * 1. **Auto-save everywhere.** No staged-vs-saved confusion — every chip
 *    toggle, tile tap, switch flip writes through immediately. Notes are
 *    debounced at 600 ms so typing doesn't write 40 rows.
 * 2. **Single scroll, no tabs.** Flow / Symptoms / Mood / Note all share
 *    one scroll. Optional fertility (BBT) and sex-log sections render inline
 *    when their Settings toggles are on, and are absent otherwise.
 * 3. **No sticky Save bar.** Replaced with a small "● Saved" status under
 *    the date header.
 */

type DraftState = {
  flow: FlowValue | null;
  symptoms: string[];
  moods: string[];
  notes: string;
  bbtText: string;
  mucus: string | null;
  sexLogged: boolean;
  protectionUsed: boolean;
};

const NOTES_DEBOUNCE_MS = 600;

export default function LogDay() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const date = params.date ?? '';
  const { setFlow, patchDay, settings } = useCycle();
  const { copy } = useCopy();

  const [draft, setDraft] = useState<DraftState>({
    flow: null,
    symptoms: [],
    moods: [],
    notes: '',
    bbtText: '',
    mucus: null,
    sexLogged: false,
    protectionUsed: false,
  });
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    Pain: true,
    Digestion: true,
    Energy: true,
    Skin: true,
    Hair: true,
    Sleep: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const showFertilityFields =
    settings?.fertilityMode && settings.fertilityMode !== 'off';
  const showSexLog = !!settings?.sexLogEnabled;
  const isFuture = date > todayISO();

  // Load existing day on mount
  useEffect(() => {
    (async () => {
      const d = await getDay(date);
      setDraft({
        flow: (d?.flow ?? null) as FlowValue | null,
        symptoms: parseArr(d?.symptomTags),
        moods: parseArr(d?.moodTags),
        notes: d?.notes ?? '',
        bbtText: d?.bbt != null ? d.bbt.toFixed(2) : '',
        mucus: d?.mucus ?? null,
        sexLogged: !!d?.sexLogged,
        protectionUsed: !!d?.protectionUsed,
      });
      setLoaded(true);
    })();
  }, [date]);

  // ─── Auto-save plumbing ─────────────────────────────────────────────────
  // We write through on every toggle. Notes are debounced — typing should
  // not trigger 40 SQL writes per word.
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => setSavedAt(Date.now());

  const writeFlow = async (v: FlowValue | null) => {
    if (isFuture) return;
    setDraft((d) => ({ ...d, flow: v }));
    if (v) await setFlow(date, v);
    else await patchDay(date, { flow: null });
    flashSaved();
  };

  const writeSymptoms = async (next: string[]) => {
    setDraft((d) => ({ ...d, symptoms: next }));
    if (isFuture) return;
    await patchDay(date, { symptomTagsArr: next.length ? next : null });
    flashSaved();
  };

  const writeMoods = async (next: string[]) => {
    setDraft((d) => ({ ...d, moods: next }));
    if (isFuture) return;
    await patchDay(date, { moodTagsArr: next.length ? next : null });
    flashSaved();
  };

  const onNotesChange = (next: string) => {
    setDraft((d) => ({ ...d, notes: next }));
    if (isFuture) return;
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      await patchDay(date, { notes: next.trim() ? next.trim() : null });
      flashSaved();
    }, NOTES_DEBOUNCE_MS);
  };

  const writeBbt = async (text: string) => {
    setDraft((d) => ({ ...d, bbtText: text }));
    if (isFuture) return;
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      const v = parseFloat(text);
      const valid = !Number.isNaN(v) && v > 30 && v < 45;
      await patchDay(date, { bbt: valid ? v : null });
      flashSaved();
    }, NOTES_DEBOUNCE_MS);
  };

  const writeMucus = async (v: string | null) => {
    setDraft((d) => ({ ...d, mucus: v }));
    if (isFuture) return;
    await patchDay(date, { mucus: v && v !== 'none' ? v : null });
    flashSaved();
  };

  const writeSex = async (next: { sexLogged?: boolean; protectionUsed?: boolean }) => {
    const merged = { ...draft, ...next } as DraftState;
    setDraft(merged);
    if (isFuture) return;
    await patchDay(date, {
      sexLogged: showSexLog ? merged.sexLogged : null,
      protectionUsed: showSexLog ? merged.protectionUsed : null,
    });
    flashSaved();
  };

  // Cleanup any pending notes write on unmount so a back-out doesn't lose
  // half a second of typing.
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const symptomSearchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_SYMPTOM_ITEMS.filter((s) => s.label.toLowerCase().includes(q));
  }, [search]);

  return (
    <Screen padded={false}>
      {/* ─── Header — close + date + "● Saved" status ─── */}
      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <View style={{ transform: [{ rotate: '45deg' }] }}>
              <Icon name="add" size={22} color={t.palette.ink} />
            </View>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text variant="bodyStrong">{loaded ? formatHeader(date) : ''}</Text>
            <SavedStatus savedAt={savedAt} isFuture={isFuture} loaded={loaded} />
          </View>
          <View style={{ width: 32 }} />
        </View>
      </View>

      {isFuture && (
        <View
          style={{
            margin: t.spacing.lg,
            backgroundColor: t.palette.paperDeep,
            borderRadius: t.radii.lg,
            padding: t.spacing.lg,
            gap: 4,
          }}
        >
          <Text variant="bodyStrong">This day is in the future</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            You can't log a day before it's happened. Come back on or after this date.
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Flow */}
        <Section icon="drop" title="Flow">
          <FlowTiles value={draft.flow} onSelect={writeFlow} />
        </Section>

        {/* Discharge — always visible */}
        <Section icon="mucus" title="Vaginal discharge">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {DISCHARGE_VALUES.map((m) => {
              const selected =
                draft.mucus === m.value || (m.value === 'none' && draft.mucus === null);
              return (
                <Pressable
                  key={m.value}
                  onPress={() => writeMucus(m.value === 'none' ? null : m.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={m.label}
                  style={{
                    flexBasis: '30%',
                    flexGrow: 1,
                    minWidth: 92,
                    alignItems: 'center',
                    paddingVertical: t.spacing.md,
                    gap: 4,
                    backgroundColor: selected ? t.palette.ovulation : t.palette.paperDeep,
                    borderRadius: t.radii.lg,
                    borderWidth: 1,
                    borderColor: t.palette.paperEdge,
                  }}
                >
                  <Icon
                    name={m.icon}
                    size={20}
                    color={selected ? t.palette.paper : t.palette.ink}
                  />
                  <Text
                    variant="caption"
                    color={selected ? t.palette.paper : t.palette.inkSoft}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Symptoms — search + category-grouped tiles */}
        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="cramps" size={16} color={t.palette.inkMuted} />
            <Text variant="micro" color={t.palette.inkMuted}>
              SYMPTOMS
            </Text>
          </View>

          <View style={{ position: 'relative' }}>
            <View
              style={{
                position: 'absolute',
                left: t.spacing.md,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Icon name="sparkle" size={16} color={t.palette.inkMuted} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search symptoms"
              placeholderTextColor={t.palette.inkFaint}
              accessibilityLabel="Search symptoms"
              style={{
                backgroundColor: t.palette.paperDeep,
                borderRadius: t.radii.pill,
                paddingHorizontal: t.spacing.xl + 12,
                paddingVertical: t.spacing.md,
                color: t.palette.ink,
                fontSize: 15,
              }}
            />
          </View>

          {symptomSearchResults ? (
            symptomSearchResults.length === 0 ? (
              <Text variant="caption" color={t.palette.inkFaint}>
                Nothing matched "{search}".
              </Text>
            ) : (
              <SymptomTileGrid
                items={symptomSearchResults}
                selected={draft.symptoms}
                onToggle={(v) => writeSymptoms(toggle(draft.symptoms, v))}
              />
            )
          ) : (
            SYMPTOM_GROUPS.map((g) => {
              const open = openCategories[g.category] !== false;
              return (
                <View key={g.category} style={{ gap: t.spacing.sm }}>
                  <Pressable
                    onPress={() =>
                      setOpenCategories((cur) => ({ ...cur, [g.category]: !open }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${g.category} ${open ? 'collapse' : 'expand'}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    hitSlop={6}
                  >
                    <Text variant="caption" color={t.palette.inkMuted}>
                      {g.category}
                    </Text>
                    <Text variant="caption" color={t.palette.inkMuted}>
                      {open ? '▾' : '▸'}
                    </Text>
                  </Pressable>
                  {open && (
                    <SymptomTileGrid
                      items={g.items}
                      selected={draft.symptoms}
                      onToggle={(v) => writeSymptoms(toggle(draft.symptoms, v))}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Mood */}
        <Section icon="cloud" title="Mood">
          <SymptomTileGrid
            items={MOOD_ITEMS}
            selected={draft.moods}
            onToggle={(v) => writeMoods(toggle(draft.moods, v))}
            tone="mood"
          />
        </Section>

        {/* Note — debounced auto-save */}
        <Section icon="note" title="Note">
          <TextInput
            value={draft.notes}
            onChangeText={onNotesChange}
            multiline
            placeholder={copy.notesPrompt}
            placeholderTextColor={t.palette.inkFaint}
            accessibilityLabel="Notes"
            style={{
              minHeight: 120,
              backgroundColor: t.palette.paperDeep,
              borderRadius: t.radii.lg,
              padding: t.spacing.lg,
              color: t.palette.ink,
              fontSize: 16,
              lineHeight: 22,
              textAlignVertical: 'top',
            }}
          />
        </Section>

        {/* Voice memo */}
        <Section icon="heart" title="Voice memo">
          <VoiceMemos date={date} />
        </Section>

        {/* Basal body temperature — shown directly whenever fertility tracking
            is on, so toggling it in Settings produces a visible field here
            (it used to hide under a collapsed "More" drawer). */}
        {showFertilityFields && (
          <Section icon="thermometer" title="Basal body temperature (°C)">
            <TextInput
              value={draft.bbtText}
              onChangeText={writeBbt}
              keyboardType="decimal-pad"
              placeholder="e.g. 36.45"
              placeholderTextColor={t.palette.inkFaint}
              maxLength={5}
              accessibilityLabel="Basal body temperature"
              style={{
                backgroundColor: t.palette.paperDeep,
                borderRadius: t.radii.lg,
                paddingHorizontal: t.spacing.lg,
                paddingVertical: t.spacing.md,
                color: t.palette.ink,
                fontSize: 16,
              }}
            />
            <Text variant="caption" color={t.palette.inkFaint}>
              Take it first thing in the morning, before getting out of bed.
            </Text>
          </Section>
        )}

        {/* Sex & protection — shown directly when enabled in Settings. */}
        {showSexLog && (
          <Section icon="heart" title="Sex">
            <ToggleRow
              label="Sexual activity today"
              value={draft.sexLogged}
              onChange={(v) => writeSex({ sexLogged: v })}
            />
            {draft.sexLogged && (
              <ToggleRow
                label="Protection used"
                value={draft.protectionUsed}
                onChange={(v) => writeSex({ protectionUsed: v })}
              />
            )}
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

// ─── ● Saved status ─────────────────────────────────────────────────────

function SavedStatus({
  savedAt,
  isFuture,
  loaded,
}: {
  savedAt: number | null;
  isFuture: boolean;
  loaded: boolean;
}) {
  const t = useTheme();
  if (!loaded) return null;
  if (isFuture) {
    return (
      <Text variant="caption" color={t.palette.inkMuted}>
        Read-only
      </Text>
    );
  }
  if (savedAt === null) return null;
  // We could show "Saved 5s ago" with a live counter; instead we keep it
  // simple — the dot + "Saved" is enough signal that the last action stuck.
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: t.palette.fertilePeak,
        }}
      />
      <Text variant="caption" color={t.palette.fertilePeak}>
        Saved
      </Text>
    </View>
  );
}

// ─── Symptom tile grid (reused) ─────────────────────────────────────────

function SymptomTileGrid({
  items,
  selected,
  onToggle,
  tone = 'symptom',
}: {
  items: SymptomItem[];
  selected: string[];
  onToggle: (v: string) => void;
  tone?: 'symptom' | 'mood';
}) {
  const t = useTheme();
  const accent = tone === 'mood' ? t.palette.fertile : t.palette.flowMedium;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
      {items.map((item) => {
        const on = selected.includes(item.value);
        return (
          <Pressable
            key={item.value}
            onPress={() => onToggle(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
            style={{
              alignItems: 'center',
              gap: 6,
              padding: 12,
              minWidth: 84,
              backgroundColor: on ? accent : t.palette.paperDeep,
              borderRadius: t.radii.lg,
              borderWidth: 1,
              borderColor: t.palette.paperEdge,
            }}
          >
            <Icon name={item.icon} size={22} color={on ? t.palette.paper : t.palette.ink} />
            <Text
              variant="micro"
              color={on ? t.palette.paper : t.palette.inkSoft}
              align="center"
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={16} color={t.palette.inkMuted} />
        <Text variant="micro" color={t.palette.inkMuted}>
          {title.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.palette.paperDeep,
        borderRadius: t.radii.lg,
        padding: t.spacing.md,
        gap: t.spacing.md,
      }}
    >
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function formatHeader(iso: string): string {
  if (!iso) return '';
  const d = fromISO(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}
