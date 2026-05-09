import { Component, type ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Text } from './components/Text';
import { Button } from './components/Button';
import { palette, radii, spacing } from './theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Last-resort React error boundary at the root of the app. Catches any
 * render-time crash and shows a recovery screen rather than a white page.
 *
 * Uses bare palette / spacing values (no useTheme) because if the theme
 * provider itself is what threw, this boundary is its only sibling that
 * still works.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error('[Lumen ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const e = this.state.error;
    const stack =
      e instanceof Error && e.stack
        ? e.stack.split('\n').slice(0, 8).join('\n')
        : String(e);

    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.paper,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <View style={{ maxWidth: 480, alignItems: 'center', gap: 16 }}>
          <Text variant="h1" align="center">
            Something broke
          </Text>
          <Text variant="body" color={palette.inkMuted} align="center">
            Lumen hit an unexpected error. Tap below to try again. Your data is safe — nothing was wiped.
          </Text>
          <ScrollView
            style={{
              maxHeight: 240,
              alignSelf: 'stretch',
              backgroundColor: palette.paperDeep,
              borderRadius: radii.md,
              padding: spacing.md,
            }}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            <Text
              variant="caption"
              color={palette.inkMuted}
              selectable
              style={{
                fontFamily:
                  Platform.OS === 'web' ? 'ui-monospace, Menlo, monospace' : undefined,
              }}
            >
              {e.message}
              {'\n'}
              {stack}
            </Text>
          </ScrollView>
          <Button
            label="Try again"
            tone="primary"
            onPress={() => this.setState({ error: null })}
          />
          {Platform.OS === 'web' && (
            <Button
              label="Reload page"
              tone="secondary"
              onPress={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (globalThis as any).location?.reload?.();
              }}
            />
          )}
        </View>
      </View>
    );
  }
}
