import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { Tabs } from '@/ui/components/Tabs';
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

type TabKey = 'flow' | 'symptoms' | 'journal';

export default function LogDay() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const date = params.date ?? '';
  const { setFlow, patchDay, settings } = useCycle();

  const [tab, setTab] = useState<TabKey>('flow');
  const [flow, setFlowState] = useState<FlowValue | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [bbtText, setBbtText] = useState('');
  const [mucus, setMucus] = useState<string | null>(null);
  const [sexLogged, setSexLogged] = useState(false);
  const [protectionUsed, setProtectionUsed] = useState(false);
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    Pain: true,
    Digestion: true,
    Energy: true,
    Skin: true,
    Sleep: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const showFertilityFields =
    settings?.fertilityMode && settings.fertilityMode !== 'off';
  const showSexLog = !!settings?.sexLogEnabled;
  const isFuture = date > todayISO();

  useEffect(() => {
    (async () => {
      const d = await getDay(date);
      setFlowState((d?.flow ?? null) as FlowValue | null);
      setSymptoms(parseArr(d?.symptomTags));
      setMoods(parseArr(d?.moodTags));
      setNotes(d?.notes ?? '');
      setBbtText(d?.bbt != null ? d.bbt.toFixed(2) : '');
      setMucus(d?.mucus ?? null);
      setSexLogged(!!d?.sexLogged);
      setProtectionUsed(!!d?.protectionUsed);
      setLoaded(true);
    })();
  }, [date]);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const save = async () => {
    if (saving || isFuture) return;
    setSaving(true);
    try {
      if (flow) {
        await setFlow(date, flow);
      } else {
        await patchDay(date, { flow: null });
      }
      const bbt = parseFloat(bbtText);
      await patchDay(date, {
        symptomTagsArr: symptoms.length ? symptoms : null,
        moodTagsArr: moods.length ? moods : null,
        notes: notes.trim() ? notes.trim() : null,
        bbt: !Number.isNaN(bbt) && bbt > 30 && bbt < 45 ? bbt : null,
        mucus: mucus && mucus !== 'none' ? mucus : null,
        sexLogged: showSexLog ? sexLogged : null,
        protectionUsed: showSexLog ? protectionUsed : null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const symptomSearchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_SYMPTOM_ITEMS.filter((s) => s.label.toLowerCase().includes(q));
  }, [search]);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel and close"
          >
            <View style={{ transform: [{ rotate: '45deg' }] }}>
              <Icon name="add" size={20} color={t.palette.ink} />
            </View>
          </Pressable>
          <Text variant="bodyStrong">{loaded ? formatHeader(date) : ''}</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={{ marginTop: t.spacing.md }}>
        <Tabs
          tabs={[
            { value: 'flow', label: 'Flow' },
            { value: 'symptoms', label: 'Symptoms' },
            { value: 'journal', label: 'Journal' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
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
          paddingBottom: t.spacing.xxxl + 80,
          gap: t.spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'flow' && (
          <FlowTab
            flow={flow}
            onFlow={setFlowState}
            mucus={mucus}
            onMucus={setMucus}
            bbtText={bbtText}
            onBbt={setBbtText}
            sexLogged={sexLogged}
            onSexLogged={setSexLogged}
            protectionUsed={protectionUsed}
            onProtectionUsed={setProtectionUsed}
            showFertilityFields={!!showFertilityFields}
            showSexLog={showSexLog}
          />
        )}

        {tab === 'symptoms' && (
          <SymptomsTab
            symptoms={symptoms}
            moods={moods}
            search={search}
            onSearchChange={setSearch}
            results={symptomSearchResults}
            openCategories={openCategories}
            onToggleCategory={(cat) =>
              setOpenCategories((cur) => ({ ...cur, [cat]: !cur[cat] }))
            }
            onToggleSymptom={(v) => setSymptoms(toggle(symptoms, v))}
            onToggleMood={(v) => setMoods(toggle(moods, v))}
          />
        )}

        {tab === 'journal' && (
          <JournalTab notes={notes} onChange={setNotes} date={date} />
        )}
      </ScrollView>

      <View
        style={{
          padding: t.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: t.palette.paperEdge,
          backgroundColor: t.palette.paper,
        }}
      >
        <Button
          label={saving ? 'Saving…' : isFuture ? 'Day is in the future' : 'Save'}
          fullWidth
          onPress={save}
          disabled={!loaded || saving || isFuture}
        />
      </View>
    </Screen>
  );
}

// ─── Flow tab ─────────────────────────────────────────────────────────────

function FlowTab(props: {
  flow: FlowValue | null;
  onFlow: (v: FlowValue | null) => void;
  mucus: string | null;
  onMucus: (v: string | null) => void;
  bbtText: string;
  onBbt: (v: string) => void;
  sexLogged: boolean;
  onSexLogged: (v: boolean) => void;
  protectionUsed: boolean;
  onProtectionUsed: (v: boolean) => void;
  showFertilityFields: boolean;
  showSexLog: boolean;
}) {
  const t = useTheme();

  return (
    <VStack gap="xl">
      <Section icon="drop" title="Period">
        <FlowTiles value={props.flow} onSelect={props.onFlow} />
      </Section>

      {/* Vaginal discharge — top-level, always visible (Flo / design-study #4 pattern). */}
      <Section icon="mucus" title="Vaginal discharge">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
          {DISCHARGE_VALUES.map((m) => {
            const selected =
              props.mucus === m.value ||
              (m.value === 'none' && props.mucus === null);
            return (
              <Pressable
                key={m.value}
                onPress={() => props.onMucus(m.value === 'none' ? null : m.value)}
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

      {props.showFertilityFields && (
        <>
          <Section icon="thermometer" title="Basal body temperature (°C)">
            <TextInput
              value={props.bbtText}
              onChangeText={props.onBbt}
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

        </>
      )}

      {props.showSexLog && (
        <Section icon="heart" title="Sex">
          <ToggleRow
            label="Sexual activity today"
            value={props.sexLogged}
            onChange={props.onSexLogged}
          />
          {props.sexLogged && (
            <ToggleRow
              label="Protection used"
              value={props.protectionUsed}
              onChange={props.onProtectionUsed}
            />
          )}
        </Section>
      )}
    </VStack>
  );
}

// ─── Symptoms tab ─────────────────────────────────────────────────────────

function SymptomsTab(props: {
  symptoms: string[];
  moods: string[];
  search: string;
  onSearchChange: (s: string) => void;
  results: SymptomItem[] | null;
  openCategories: Record<string, boolean>;
  onToggleCategory: (cat: string) => void;
  onToggleSymptom: (v: string) => void;
  onToggleMood: (v: string) => void;
}) {
  const t = useTheme();

  return (
    <VStack gap="lg">
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
          value={props.search}
          onChangeText={props.onSearchChange}
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

      {props.results ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            RESULTS
          </Text>
          {props.results.length === 0 ? (
            <Text variant="caption" color={t.palette.inkFaint}>
              Nothing matched "{props.search}".
            </Text>
          ) : (
            <SymptomTileGrid
              items={props.results}
              selected={props.symptoms}
              onToggle={props.onToggleSymptom}
            />
          )}
        </View>
      ) : (
        <>
          {SYMPTOM_GROUPS.map((g) => {
            const open = props.openCategories[g.category] !== false;
            return (
              <View key={g.category} style={{ gap: t.spacing.sm }}>
                <Pressable
                  onPress={() => props.onToggleCategory(g.category)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${g.category} ${open ? 'collapse' : 'expand'}`}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  hitSlop={6}
                >
                  <Text variant="micro" color={t.palette.inkMuted}>
                    {g.category.toUpperCase()}
                  </Text>
                  <Text variant="caption" color={t.palette.inkMuted}>
                    {open ? '▾' : '▸'}
                  </Text>
                </Pressable>
                {open && (
                  <SymptomTileGrid
                    items={g.items}
                    selected={props.symptoms}
                    onToggle={props.onToggleSymptom}
                  />
                )}
              </View>
            );
          })}

          <View style={{ gap: t.spacing.sm, marginTop: t.spacing.md }}>
            <Text variant="micro" color={t.palette.inkMuted}>
              MOOD
            </Text>
            <SymptomTileGrid
              items={MOOD_ITEMS}
              selected={props.moods}
              onToggle={props.onToggleMood}
              tone="mood"
            />
          </View>
        </>
      )}
    </VStack>
  );
}

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

// ─── Journal tab ──────────────────────────────────────────────────────────

function JournalTab({
  notes,
  onChange,
  date,
}: {
  notes: string;
  onChange: (s: string) => void;
  date: string;
}) {
  const t = useTheme();
  return (
    <VStack gap="lg">
      <View style={{ gap: t.spacing.sm }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          NOTE
        </Text>
        <TextInput
          value={notes}
          onChangeText={onChange}
          multiline
          placeholder="Anything to add?"
          placeholderTextColor={t.palette.inkFaint}
          accessibilityLabel="Notes"
          style={{
            minHeight: 160,
            backgroundColor: t.palette.paperDeep,
            borderRadius: t.radii.lg,
            padding: t.spacing.lg,
            color: t.palette.ink,
            fontSize: 16,
            lineHeight: 22,
            textAlignVertical: 'top',
          }}
        />
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          VOICE MEMO
        </Text>
        <VoiceMemos date={date} />
      </View>
    </VStack>
  );
}

// ─── shared ───────────────────────────────────────────────────────────────

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
