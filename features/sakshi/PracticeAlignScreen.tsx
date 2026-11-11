import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackBar } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { AlignmentRehearsal } from '@/features/onboarding';
import { useSafeBack } from '@/hooks';
import { spacing } from '@/theme';

/** The feel of a lock, tried safely before standing at a real viewpoint. */
export function PracticeAlignScreen() {
  const goBack = useSafeBack('/(main)/sakshi');
  const [locked, setLocked] = useState(false);

  return (
    <Screen>
      <BackBar fallback="/(main)/sakshi" />
      <View style={styles.wrap}>
        <View style={styles.heading}>
          <Text variant="title">Try the alignment</Text>
          <Text variant="body" tone="secondary">
            On site you will hold the phone until the instrument agrees with you. Drag to try it here. Nothing is recorded.
          </Text>
        </View>
        <AlignmentRehearsal onLocked={() => setLocked(true)} />
        <Button label={locked ? 'Done' : 'Skip for now'} variant={locked ? 'primary' : 'quiet'} block onPress={goBack} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: spacing.lg, paddingBottom: spacing.lg },
  heading: { gap: spacing.sm },
});
