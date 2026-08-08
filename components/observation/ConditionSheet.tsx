import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BottomSheet, Button, Chip, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import {
  CONDITION_CATEGORIES,
  CONDITION_CATEGORY_HINTS,
  CONDITION_CATEGORY_LABELS,
  CONDITION_SUBTYPES,
  SEVERITY_HINTS,
  SEVERITY_LABELS,
  type ConditionCategory,
  type ConditionSeverity,
} from '@/types';

export type ConditionDraft = {
  category: ConditionCategory;
  subtype: string;
  severity: ConditionSeverity;
  note?: string;
  /** True when the draft was pre-filled from the on-device detector. */
  aiAssisted?: boolean;
};

export type ConditionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: ConditionDraft) => void;
  /** Disables the controls while the write is in flight. */
  submitting?: boolean;
  /** Pre-fill from YOLO AI scan. When set, opens at the note step. */
  initialDraft?: Partial<ConditionDraft>;
};

type Step = 'category' | 'subtype' | 'severity' | 'note';

const STEPS: Step[] = ['category', 'subtype', 'severity', 'note'];

/**
 * Condition reporting, start to finish, in one sheet.
 *
 * §10's sequence — what did you notice, category, detail, severity, note — is
 * one act, so it is one surface. Four routes would put a back stack behind a
 * decision the person is making in thirty seconds while standing in the sun.
 *
 * Each step commits by tapping a choice and advances immediately. There is no
 * "next" button until the note, because everything before it is a single
 * selection and asking for confirmation of a tap is a step that earns nothing.
 */
export function ConditionSheet({ visible, onClose, onSubmit, submitting = false, initialDraft }: ConditionSheetProps) {
  const [step, setStep] = useState<Step>(initialDraft?.category ? 'note' : 'category');
  const [category, setCategory] = useState<ConditionCategory | null>(initialDraft?.category ?? null);
  const [subtype, setSubtype] = useState<string | null>(initialDraft?.subtype ?? null);
  const [severity, setSeverity] = useState<ConditionSeverity | null>(initialDraft?.severity ?? null);
  const [note, setNote] = useState(initialDraft?.note ?? '');

  const reset = () => {
    setStep('category');
    setCategory(null);
    setSubtype(null);
    setSeverity(null);
    setNote('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const back = () => {
    const index = STEPS.indexOf(step);
    if (index <= 0) {
      close();
      return;
    }
    setStep(STEPS[index - 1]);
  };

  const submit = () => {
    if (!category || !subtype || !severity) return;
    onSubmit({
      category,
      subtype,
      severity,
      // An untouched box is not a note. Trimmed so whitespace does not become
      // an observer's comment on the state of a temple.
      note: note.trim() ? note.trim() : undefined,
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={titles[step]}
      subtitle={subtitles[step]}
      scroll
    >
      {step === 'category' ? (
        <View style={styles.stack}>
          {CONDITION_CATEGORIES.map((option) => (
            <Chip
              key={option}
              label={CONDITION_CATEGORY_LABELS[option]}
              selected={category === option}
              onPress={() => {
                setCategory(option);
                // Choosing a different category invalidates what came after it.
                setSubtype(null);
                setStep('subtype');
              }}
              style={styles.wide}
            />
          ))}
        </View>
      ) : null}

      {step === 'subtype' && category ? (
        <View style={styles.stack}>
          <Text variant="caption" tone="muted">
            {CONDITION_CATEGORY_HINTS[category]}
          </Text>
          {CONDITION_SUBTYPES[category].map((option) => (
            <Chip
              key={option}
              label={option}
              selected={subtype === option}
              onPress={() => {
                setSubtype(option);
                setStep('severity');
              }}
              style={styles.wide}
            />
          ))}
        </View>
      ) : null}

      {step === 'severity' ? (
        <View style={styles.stack}>
          {(['noted', 'concerning', 'urgent'] as ConditionSeverity[]).map((option) => (
            <View key={option} style={styles.severityRow}>
              <Chip
                label={SEVERITY_LABELS[option]}
                selected={severity === option}
                onPress={() => {
                  setSeverity(option);
                  setStep('note');
                }}
                style={styles.wide}
              />
              <Text variant="caption" tone="muted">
                {SEVERITY_HINTS[option]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {step === 'note' ? (
        <View style={styles.stack}>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="What did you see? Leave blank if the choices above say it."
            placeholderTextColor={colors.textMuted}
            editable={!submitting}
            accessibilityLabel="Optional note"
          />
          <Button
            label="Record what you saw"
            block
            loading={submitting}
            onPress={submit}
          />
        </View>
      ) : null}

      <Button
        label={step === 'category' ? 'Cancel' : 'Back'}
        variant="quiet"
        disabled={submitting}
        onPress={back}
      />
    </BottomSheet>
  );
}

const titles: Record<Step, string> = {
  category: 'What did you notice?',
  subtype: 'What kind?',
  severity: 'How does it seem?',
  note: 'Anything to add?',
};

const subtitles: Record<Step, string> = {
  category: 'Choose the closest. Nothing here needs to be exact.',
  subtype: 'Still approximate. A conservator will look properly.',
  severity: 'Your sense of how urgently someone should see it.',
  note: 'Optional, and genuinely so.',
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  wide: { alignSelf: 'stretch' },
  severityRow: { gap: spacing.xs, marginBottom: spacing.sm },
  input: {
    minHeight: 108,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.base,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
});
