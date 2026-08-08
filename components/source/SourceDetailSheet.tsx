import { Linking, StyleSheet, View } from 'react-native';

import { BottomSheet, Button, Divider, MetaRow, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { SOURCE_KIND_LABELS, type Citation, type Source } from '@/types';

export type SourceDetailSheetProps = {
  source: Source | null;
  citation?: Citation;
  onClose: () => void;
};

/**
 * A source in full.
 *
 * A sheet rather than a route, deliberately. Sources are cited from both Tīrtha
 * and Dhamma, so a route would either be duplicated per surface or force a tab
 * switch mid-read — and §43 says a step that needs no distinct task should not
 * become a screen. Reading a citation is part of reading the thing that cited
 * it.
 */
export function SourceDetailSheet({ source, citation, onClose }: SourceDetailSheetProps) {
  return (
    <BottomSheet
      visible={source != null}
      onClose={onClose}
      title={source?.title ?? 'Source'}
      subtitle={source ? SOURCE_KIND_LABELS[source.kind] : undefined}
      scroll
    >
      {source ? (
        <View style={styles.body}>
          <View style={styles.meta}>
            <MetaRow label="Attribution" value={source.attribution} mono={false} />
            {source.date ? <MetaRow label="Date" value={source.date} /> : null}
            {source.reference ? (
              <MetaRow label="Reference" value={source.reference} mono={false} />
            ) : null}
            {citation?.locator ? <MetaRow label="Cited at" value={citation.locator} /> : null}
          </View>

          {source.caveat ? (
            <>
              <Divider />
              <View style={styles.block}>
                <Text variant="label" tone="seeking" uppercase>
                  What this does not settle
                </Text>
                <Text variant="body" tone="secondary">
                  {source.caveat}
                </Text>
              </View>
            </>
          ) : null}

          {source.url ? (
            <>
              <Divider />
              {/*
                Only rendered when the record actually carries a URL. A "read
                the original" button that resolves nowhere is worse than no
                button on a screen whose purpose is that claims can be checked.
              */}
              <Button
                label="Read the original"
                variant="secondary"
                onPress={() => {
                  const url = source.url;
                  if (url) void Linking.openURL(url).catch(() => undefined);
                }}
                accessibilityHint="Opens the source outside the app"
              />
            </>
          ) : (
            <>
              <Divider />
              <Text variant="caption" tone="muted">
                No online edition is linked. The reference above is what to look for.
              </Text>
            </>
          )}
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  meta: { gap: spacing.xxs },
  block: { gap: spacing.sm },
});
