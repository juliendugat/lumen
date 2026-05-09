import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Button } from '@/ui/components/Button';
import { useTheme } from '@/ui/ThemeProvider';

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <VStack gap="lg" style={{ marginTop: 48 }}>
          <Text variant="micro" color={t.palette.inkMuted}>
            LUMEN
          </Text>
          <Text variant="display">Quiet, body-literate cycle tracking.</Text>
          <Text variant="body" color={t.palette.inkMuted}>
            Your data stays on this device. No accounts. No ads. Predictions get more
            accurate the more you log — and stay honest about what they don't know.
          </Text>
        </VStack>
        <VStack gap="sm">
          <Button label="Get started" tone="primary" fullWidth onPress={() => router.push('/(onboarding)/last-period')} />
          <Text variant="caption" color={t.palette.inkFaint} align="center">
            Takes about a minute. You can change anything later.
          </Text>
        </VStack>
      </View>
    </Screen>
  );
}
