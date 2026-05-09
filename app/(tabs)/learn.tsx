import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { useTheme } from '@/ui/ThemeProvider';
import { Icon } from '@/ui/icons/Icon';
import { articles, type LearnArticle } from '@/copy/learn';

export default function Learn() {
  const t = useTheme();
  const params = useLocalSearchParams<{ article?: string }>();
  const [open, setOpen] = useState<LearnArticle | null>(null);

  // Deep-link: open a specific article when ?article=<id> is in the route.
  useEffect(() => {
    if (!params.article) return;
    const a = articles.find((x) => x.id === params.article);
    if (a) setOpen(a);
  }, [params.article]);

  if (open) {
    return (
      <Screen scroll>
        <Pressable onPress={() => setOpen(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to articles">
          <Text variant="bodyStrong" color={t.palette.inkMuted}>
            ‹ Back
          </Text>
        </Pressable>
        <View style={{ marginTop: t.spacing.lg, gap: t.spacing.lg }}>
          <View
            style={{
              alignSelf: 'flex-start',
              padding: t.spacing.md,
              borderRadius: t.radii.lg,
              backgroundColor: t.palette.paperDeep,
            }}
          >
            <Icon name={open.icon} size={32} color={t.palette.ink} />
          </View>
          <Text variant="h1">{open.title}</Text>
          <Text variant="body" color={t.palette.inkMuted}>
            {open.summary}
          </Text>
          <View style={{ height: 1, backgroundColor: t.palette.paperEdge, marginVertical: t.spacing.md }} />
          {open.body.map((p, i) => (
            <Text key={i} variant="body" color={t.palette.inkSoft}>
              {p}
            </Text>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ marginTop: t.spacing.md, marginBottom: t.spacing.lg }}>
        <Text variant="micro" color={t.palette.inkMuted}>
          LEARN
        </Text>
        <Text variant="h1">Body literacy</Text>
        <Text variant="body" color={t.palette.inkMuted}>
          Plain explanations of what's happening across a cycle. No quizzes, no judgement.
        </Text>
      </View>

      <VStack gap="md">
        {articles.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setOpen(a)}
            accessibilityRole="button"
            accessibilityLabel={a.title}
          >
            {({ pressed }) => (
              <Card style={{ opacity: pressed ? 0.8 : 1 }}>
                <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      padding: 10,
                      borderRadius: t.radii.md,
                      backgroundColor: t.palette.paper,
                    }}
                  >
                    <Icon name={a.icon} size={22} color={t.palette.ink} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="bodyStrong">{a.title}</Text>
                    <Text variant="caption" color={t.palette.inkMuted}>
                      {a.summary}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </Pressable>
        ))}
      </VStack>

      {/* Filler so ScrollView has room past the tab bar */}
      <ScrollView style={{ height: 0 }} />
    </Screen>
  );
}
