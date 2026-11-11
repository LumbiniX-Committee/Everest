import { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { diagnostics } from '@/services';
import { colors, spacing } from '@/theme';

/**
 * The last line before a blank screen. A render error shows a way back into the
 * app instead of a white page, and is recorded for the crash report.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    void diagnostics.recordCrash(error, { fatal: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text variant="title" center>
          Something went wrong
        </Text>
        <Text variant="body" tone="secondary" center>
          Your records are safe on this phone. Try again to go back into the app.
        </Text>
        <Button label="Try again" onPress={() => this.setState({ failed: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
});
