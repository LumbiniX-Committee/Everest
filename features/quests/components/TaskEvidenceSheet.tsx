import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TextInput, View } from 'react-native';

import { Button, Divider, Text } from '@/components/ui';
import { database, questReview } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { QuestReview, QuestSubmission, QuestTask } from '@/types';

export type TaskEvidenceSheetProps = {
  questId: string;
  task: QuestTask;
  existing?: QuestSubmission;
  /** Called once the evidence is saved. The caller ticks the task. */
  onSubmitted: (submission: QuestSubmission) => void;
  onCancel: () => void;
};

/**
 * expo-image-picker is native, and this screen can reach a device that predates
 * it — an over-the-air update carries JavaScript and assets but never native
 * code. A static import would throw during module evaluation there and take the
 * quest screen down with it, so it is required lazily behind an availability
 * check, exactly as expo-notifications and MapLibre are.
 *
 * Where it is absent the task still completes: the photograph is dropped and
 * the note carries the observation. A degraded answer is worth more than a
 * blocked one, and the person is told which they are getting.
 */
type PickerModule = typeof import('expo-image-picker');

let pickerCache: PickerModule | null | undefined;

function loadPicker(): PickerModule | null {
  if (pickerCache !== undefined) return pickerCache;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pickerCache = require('expo-image-picker') as PickerModule;
  } catch {
    pickerCache = null;
  }
  return pickerCache;
}

const VERDICT_LABEL: Record<QuestReview['verdict'], string> = {
  'looks-right': 'Looks like what the task asked for',
  'looks-wrong': 'This may not be what the task asked for',
  unsure: 'Not clear enough to say',
  unavailable: 'No second opinion available',
};

const VERDICT_TONE = {
  'looks-right': 'resolved',
  'looks-wrong': 'open',
  unsure: 'secondary',
  unavailable: 'muted',
} as const;

/**
 * Bringing something back from a task.
 *
 * A tick records that someone said they did something. This records what they
 * saw, which is the only thing a conservation series can be built from.
 *
 * The AI review is advisory throughout and never gates submission. It runs
 * after the photograph is chosen and before the person confirms, so they see
 * the second opinion while they can still act on it — and can ignore it. They
 * were there; the model was not.
 */
export function TaskEvidenceSheet({
  questId,
  task,
  existing,
  onSubmitted,
  onCancel,
}: TaskEvidenceSheetProps) {
  const { preferences } = usePreferences();
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri);
  const [count, setCount] = useState(existing?.count?.toString() ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [review, setReview] = useState<QuestReview | undefined>(existing?.review);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  const kind = task.evidence ?? 'none';

  const picker = loadPicker();

  const pick = async (fromCamera: boolean) => {
    if (!picker) return;

    const permission = fromCamera
      ? await picker.requestCameraPermissionsAsync()
      : await picker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const quality = preferences.photoQuality === 'high' ? 0.9 : 0.6;
    const result = fromCamera
      ? await picker.launchCameraAsync({ quality })
      : await picker.launchImageLibraryAsync({ quality });

    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setReview(undefined);

    // Advisory, and never blocking: the person can submit while this runs.
    setReviewing(true);
    const verdict = await questReview.reviewPhoto(task, uri);
    setReview(verdict);
    setReviewing(false);
  };

  const submit = async () => {
    setSaving(true);
    const submission: QuestSubmission = {
      questId,
      taskId: task.id,
      photoUri,
      count: count.trim() ? Number(count) : undefined,
      note: note.trim() || undefined,
      submittedAt: new Date().toISOString(),
      review,
    };
    await database.saveQuestSubmission(submission);
    setSaving(false);
    onSubmitted(submission);
  };

  // Photographs and counts are what a task asked for; withholding the button
  // until they exist is the one gate here, and it is the person's own claim
  // being checked, not a model's.
  const ready =
    kind === 'none' ||
    (kind === 'photo' && (!!photoUri || (!picker && note.trim().length > 0))) ||
    (kind === 'count' && count.trim().length > 0) ||
    (kind === 'note' && note.trim().length > 0);

  return (
    <View style={styles.sheet}>
      {/* The sheet chrome already carries the task title, so this states the
          ask rather than repeating the name. */}
      <Text variant="body" tone="secondary">
        {task.expectation ?? task.description}
      </Text>

      {kind === 'photo' && !picker ? (
        <View style={styles.block}>
          <Text variant="body" tone="secondary">
            Photographs need a newer version of the app than this one. Record what you saw in the
            note below and the task still counts.
          </Text>
        </View>
      ) : null}

      {kind === 'photo' && picker ? (
        <View style={styles.block}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
          ) : null}

          <View style={styles.actions}>
            <Button
              label={photoUri ? 'Retake' : 'Take a photograph'}
              variant="secondary"
              block
              onPress={() => void pick(true)}
            />
            <Button
              label="Choose from library"
              variant="quiet"
              block
              onPress={() => void pick(false)}
            />
          </View>

          {reviewing ? (
            <View style={styles.reviewing}>
              <ActivityIndicator color={colors.sandstoneDeep} />
              <Text variant="caption" tone="muted">
                Asking for a second opinion
              </Text>
            </View>
          ) : null}

          {review && !reviewing ? (
            <View style={styles.review}>
              <Text variant="label" tone="muted" uppercase>
                Second opinion
              </Text>
              <Text variant="body" tone={VERDICT_TONE[review.verdict]}>
                {VERDICT_LABEL[review.verdict]}
              </Text>
              <Text variant="body" tone="secondary">
                {review.comment}
              </Text>
              {/* Named, because an opinion without an author is just an
                  assertion — and this one is a machine's. */}
              <Text variant="caption" tone="muted">
                {review.model
                  ? `${review.model} · advisory only, you decide`
                  : 'You decide — this is your observation.'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {kind === 'count' ? (
        <View style={styles.block}>
          <Text variant="label" tone="muted" uppercase>
            How many
          </Text>
          <TextInput
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Count"
          />
        </View>
      ) : null}

      {kind === 'note' || kind === 'photo' ? (
        <View style={styles.block}>
          <Text variant="label" tone="muted" uppercase>
            {kind === 'note' ? 'What you saw' : 'Anything worth noting'}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.multiline]}
            accessibilityLabel="Note"
          />
        </View>
      ) : null}

      <Divider />

      <View style={styles.actions}>
        <Button
          label={saving ? 'Saving…' : 'Record this'}
          block
          disabled={!ready || saving}
          loading={saving}
          onPress={() => void submit()}
        />
        <Button label="Cancel" variant="quiet" block onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: spacing.base },
  header: { gap: spacing.xs },
  block: { gap: spacing.sm },
  actions: { gap: spacing.sm },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
  },
  reviewing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  review: {
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
});
