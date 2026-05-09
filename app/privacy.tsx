import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/ui/components/Screen';
import { Stack as VStack } from '@/ui/components/Stack';
import { Text } from '@/ui/components/Text';
import { Card } from '@/ui/components/Card';
import { Illustration } from '@/ui/illustrations/Illustration';
import { useTheme } from '@/ui/ThemeProvider';

export default function PrivacyScreen() {
  const t = useTheme();
  const router = useRouter();
  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <Text variant="bodyStrong" color={t.palette.inkMuted}>
          ‹ Back
        </Text>
      </Pressable>

      <View style={{ alignItems: 'center', marginVertical: t.spacing.lg }}>
        <Illustration name="privacy-keep" width={220} height={140} />
      </View>

      <Text variant="h1" align="center">
        Your data stays here
      </Text>
      <Text variant="body" color={t.palette.inkMuted} align="center" style={{ marginTop: t.spacing.sm }}>
        Plain English. No clauses, no asterisks.
      </Text>

      <VStack gap="md" style={{ marginTop: t.spacing.xl }}>
        <Item
          title="No accounts. No servers."
          body="Lumen has no sign-in. There are no Lumen servers receiving your data. You don't even need a network connection to use the app."
        />
        <Item
          title="Stored on this device only."
          body="Cycles, day logs, medications, settings — all stored locally in a SQLite database in this app's sandbox. Other apps can't read it."
        />
        <Item
          title="Encryption-ready."
          body="The encryption key is generated on first launch and stored in your device's secure enclave (Keychain on iOS, Keystore on Android). On a future production build, the database file itself is encrypted with this key (SQLCipher)."
        />
        <Item
          title="App lock optional."
          body="You can require Face ID, Touch ID, or your device passcode to open the app. Settings → App lock."
        />
        <Item
          title="Backup is up to you."
          body="Lumen does NOT include the database in iCloud or Google Drive auto-backup. To save a copy, use Settings → Export all data. To move to another device, import that file there."
        />
        <Item
          title="No analytics. No ads. No third parties."
          body="No tracking SDKs, no marketing pixels, no crash reporting. The privacy nutrition label / Data safety form for Lumen reads as 'no data collected' — and that's because nothing is collected."
        />
        <Item
          title="Notifications are local."
          body="Reminders are scheduled with the OS directly. There are no push tokens, so no server is involved when 'Period expected' fires."
        />
        <Item
          title="Calendar export, partner share, doctor PDF."
          body="When you export an .ics, share with a partner, or generate a doctor PDF, the file is created on your phone. Where it goes after that — calendar app, Mail, AirDrop — is your choice."
        />
        <Item
          title="Delete is final."
          body="Settings → Delete all data wipes the database, drops the encryption key, and cancels every scheduled notification. There's no remote copy to delete because there never was one."
        />

        <Card>
          <Text variant="bodyStrong">Want to verify?</Text>
          <Text variant="caption" color={t.palette.inkMuted}>
            On a real device, put Lumen in airplane mode and use it. Nothing breaks. There's nothing to talk to.
          </Text>
        </Card>
      </VStack>
    </Screen>
  );
}

function Item({ title, body }: { title: string; body: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="body" color={t.palette.inkSoft}>
        {body}
      </Text>
    </View>
  );
}
