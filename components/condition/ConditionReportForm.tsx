import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, Divider, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { ConditionCategory, ConditionSeverity } from '@/types/condition';
import { CONDITION_CATEGORIES, CONDITION_CATEGORY_LABELS, CONDITION_SUBTYPES } from '@/types/condition';

export type ConditionReportInput = {
  siteId: string;
  vantageId: string;
  observationId: string;
  category: ConditionCategory;
  subtype: string;
  severity: ConditionSeverity;
  note?: string;
};

export type ConditionReportFormProps = {
  siteId: string;
  vantageId: string;
  observationId: string;
  onSubmitReport: (report: ConditionReportInput) => void;
  onNoChangeReport: () => void;
  onSkip?: () => void;
};

/**
 * Condition Report Form (Phase 3 Condition Taxonomy & "Nothing has changed" path).
 */
export function ConditionReportForm({
  siteId,
  vantageId,
  observationId,
  onSubmitReport,
  onNoChangeReport,
  onSkip,
}: ConditionReportFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<ConditionCategory>('structural');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('New crack');
  const [severity, setSeverity] = useState<ConditionSeverity>('concerning');
  const [note, setNote] = useState<string>('');

  const currentSubtypes = CONDITION_SUBTYPES[selectedCategory] ?? [];

  const handleSubmit = () => {
    onSubmitReport({
      siteId,
      vantageId,
      observationId,
      category: selectedCategory,
      subtype: selectedSubtype,
      severity,
      note: note.trim() || undefined,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="title">Condition Report</Text>
      <Text variant="body" tone="secondary">
        Structured condition assessment using conservation taxonomy.
      </Text>

      {/* Prominent "Nothing has changed" Option (Equal visual weight for anti-gaming) */}
      <View style={styles.noChangeBox}>
        <Text variant="label" tone="locked">
          VERIFIED STABILITY
        </Text>
        <Text variant="body" tone="secondary">
          “Nothing has changed” is a scientific observation and is awarded identical merit to a
          damage report.
        </Text>
        <Button
          label="Nothing has changed (Record stable status)"
          variant="secondary"
          onPress={onNoChangeReport}
        />
      </View>

      <Divider />

      {/* 8-Category Taxonomy Selector */}
      <Text variant="label" tone="muted" uppercase>
        Category Taxonomy (Select One)
      </Text>
      <View style={styles.categoryGrid}>
        {CONDITION_CATEGORIES.map((cat) => {
          const active = cat === selectedCategory;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                setSelectedCategory(cat);
                const sub = CONDITION_SUBTYPES[cat];
                if (sub && sub.length > 0) {
                  setSelectedSubtype(sub[0]);
                }
              }}
              style={[styles.categoryTile, active && styles.categoryTileActive]}
            >
              <Text variant="body" tone={active ? 'primary' : 'secondary'}>
                {CONDITION_CATEGORY_LABELS[cat]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Subtype Selection Chips */}
      {currentSubtypes.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label" tone="muted" uppercase>
            Subtype
          </Text>
          <View style={styles.chipRow}>
            {currentSubtypes.map((st) => (
              <Chip
                key={st}
                label={st}
                selected={st === selectedSubtype}
                onPress={() => setSelectedSubtype(st)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Severity Selector */}
      <View style={styles.section}>
        <Text variant="label" tone="muted" uppercase>
          Severity Level
        </Text>
        <View style={styles.ratingRow}>
          {(['noted', 'concerning', 'urgent'] as ConditionSeverity[]).map((lvl) => (
            <Pressable
              key={lvl}
              onPress={() => setSeverity(lvl)}
              style={[styles.ratingPill, severity === lvl && styles.ratingPillActive]}
            >
              <Text variant="body" tone={severity === lvl ? 'primary' : 'secondary'}>
                {lvl === 'noted' ? 'Noted' : lvl === 'concerning' ? 'Concerning' : 'Urgent'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Notes Input */}
      <View style={styles.section}>
        <Text variant="label" tone="muted" uppercase>
          Observation Notes (Optional)
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Specific notes on location or structural details..."
          placeholderTextColor={colors.textMuted}
          multiline
          value={note}
          onChangeText={setNote}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Submit Condition Report" onPress={handleSubmit} />
        {onSkip ? <Button label="Skip for now" variant="quiet" onPress={onSkip} /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.gutter, gap: spacing.base },
  noChangeBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryTile: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTileActive: {
    borderColor: colors.sandstone,
    backgroundColor: colors.surface,
  },
  section: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ratingRow: { flexDirection: 'row', gap: spacing.xs },
  ratingPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingPillActive: {
    borderColor: colors.sandstone,
    backgroundColor: colors.surface,
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    color: colors.textPrimary,
    borderRadius: radii.sm,
    padding: spacing.sm,
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: { gap: spacing.xs, marginTop: spacing.base },
});
