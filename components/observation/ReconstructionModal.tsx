import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, Text } from '@/components/ui';
import { ThenNowCompare, EvidenceTierLabel } from '@/components/thennow';
import { plateImages, plateMeta, nowImageForSite, type PlateId } from '@/data/plates';
import { colors, radii, spacing } from '@/theme';

export type ReconstructionModalProps = {
  visible: boolean;
  siteId: string;
  siteName: string;
  userPhotoUri?: string;
  onClose: () => void;
};

/**
 * Digital Heritage Reconstruction Viewer Modal.
 *
 * Provides a draggable visual wipe comparison (`ThenNowCompare`) between 1899 ASI historical/reconstructed
 * plates and current state.
 */
export function ReconstructionModal({
  visible,
  siteId,
  siteName,
  userPhotoUri,
  onClose,
}: ReconstructionModalProps) {
  // Select default historical plate based on siteId
  const defaultPlateId: PlateId =
    siteId === 'maya-devi-temple'
      ? 'maya-devi-temple.mukherji-1899-plan'
      : siteId === 'puskarini'
        ? 'puskarini.earthen-pond-pre1930s'
        : 'ashokan-pillar.1899-south';

  const meta = plateMeta[defaultPlateId];
  const historicalImage = plateImages[defaultPlateId];
  const modernImage = userPhotoUri || nowImageForSite(siteId);

  const thenPanel = {
    image: historicalImage,
    date: meta.year ? `c. ${meta.year}` : 'Historical Archive',
    tier: meta.evidenceTier,
    placeholderNote: meta.caption,
  };

  const nowPanel = {
    image: modernImage,
    date: userPhotoUri ? 'Your Capture' : 'Present Day',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <Chip label="DIGITAL RECONSTRUCTION" selected />
            <Text variant="title" style={styles.siteTitle}>
              {siteName}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Instructions */}
        <Text variant="caption" tone="secondary" center style={styles.hint}>
          Drag the vertical divider left or right to wipe between the historical archive and today's state.
        </Text>

        {/* Draggable Wipe Frame */}
        <View style={styles.compareFrame}>
          <ThenNowCompare then={thenPanel} now={nowPanel} aspectRatio={4 / 3} />
        </View>

        {/* Plate Metadata Footer */}
        {meta ? (
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <EvidenceTierLabel tier={meta.evidenceTier} />
              {meta.year ? (
                <Text variant="mono" tone="sandstone">
                  {meta.year}
                </Text>
              ) : null}
            </View>
            <Text variant="body" style={styles.captionText}>
              {meta.caption}
            </Text>
            <Text variant="caption" tone="muted">
              Source: {meta.attribution}
            </Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.footer}>
          <Button label="Done" block onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleBlock: {
    gap: spacing.xxs,
  },
  siteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.sandstone,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  hint: {
    paddingHorizontal: spacing.sm,
  },
  compareFrame: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.base,
    borderRadius: radii.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  footer: {
    marginTop: 'auto',
  },
});
