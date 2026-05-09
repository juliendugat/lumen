import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/ui/ThemeProvider';
import { Text } from '@/ui/components/Text';
import { Icon } from '@/ui/icons/Icon';
import { articles } from '@/copy/learn';
import type { HomeState } from './headline';

type Props = { state: HomeState };

/**
 * Contextual self-care card that surfaces a relevant Learn article based
 * on the current cycle state. Mirrors the design-study pattern (image #3,
 * "Self Care section for Empathy & Education").
 *
 * Returns null when there's no useful article to show (e.g. no-data state).
 */
export function SelfCareCard({ state }: Props) {
  const t = useTheme();
  const router = useRouter();
  const articleId = pickArticleFor(state);
  if (!articleId) return null;
  const article = articles.find((a) => a.id === articleId);
  if (!article) return null;

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/learn')}
      accessibilityRole="button"
      accessibilityLabel={`Read: ${article.title}`}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: t.palette.follicularSoft,
            borderRadius: t.radii.lg,
            padding: t.spacing.lg,
            flexDirection: 'row',
            gap: t.spacing.md,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <View
            style={{
              padding: 10,
              borderRadius: t.radii.md,
              backgroundColor: t.palette.paper,
            }}
          >
            <Icon name={article.icon} size={22} color={t.palette.ink} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="micro" color={t.palette.inkMuted}>
              SELF-CARE
            </Text>
            <Text variant="bodyStrong">{article.title}</Text>
            <Text variant="caption" color={t.palette.inkMuted}>
              {article.summary}
            </Text>
          </View>
          <Icon name="arrow-right" size={18} color={t.palette.inkMuted} />
        </View>
      )}
    </Pressable>
  );
}

function pickArticleFor(state: HomeState): string | null {
  switch (state.kind) {
    case 'period':
      return 'cramps';
    case 'late':
      return 'cycle-basics';
    case 'expected-soon':
      return 'iron';
    case 'fertile':
      return 'fertile-window';
    case 'follicular':
      return 'mood';
    case 'luteal':
      return 'mood';
    case 'no-data':
      return null;
  }
}
