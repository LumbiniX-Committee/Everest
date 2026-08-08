import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, Divider, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { ConditionCategory, ConditionReportInput } from '@/types/condition';

export const CONDITION_TAXONOMY: {
  category: ConditionCategory;
  label: string;
  subtypes: string[];
}[] = [
  {
    category: 'biological_growth',
    label: 'Biological growth',
    subtypes: ['moss', 'lichen', 'algae', 'root intrusion', 'vegetation in masonry'],
  },
  {
    category: 'structural',
    label: 'Structural',
    subtypes: ['cracking', 'spalling', 'displacement', 'subsidence', 'leaning'],
  },
  {
    category: 'water',
    label: 'Water',
    subtypes: ['ingress', 'staining', 'pooling', 'drainage failure', 'flood damage'],
  },
  {
    category: 'surface',
    label: 'Surface',
    subtypes: ['erosion', 'efflorescence', 'salt crystallisation', 'delamination'],
  },
  {
    category: 'human_impact',
    label: 'Human impact',
    subtypes: ['graffiti', 'vandalism', 'touch-wear', 'unauthorised offerings', 'litter'],
  },
  {
    category: 'encroachment',
    label: 'Encroachment',
    subtypes: ['unauthorised construction', 'vehicle intrusion', 'boundary violation'],
  },
  {
    category: 'environmental',
    label: 'Environmental',
    subtypes: ['deposition', 'tree loss', 'habitat disturbance'],
  },
  {
    category: 'management',
    label: 'Management',
    subtypes: ['signage failure', 'barrier damage', 'lighting', 'waste handling'],
  },
];

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
  const [selectedSubtype, setSelectedSubtype] = useState<string>('cracking');
  const [severity, setSeverity] = useState<number>(2);
  const [reporterConf, setReporterConf] = useState<number>(3);
  const [note, setNote] = useState<string>('');

  const currentTaxonomy = CONDITION_TAXONOMY.find((t) => t.category === selectedCategory);

  const handleSubmit = () => {
    onSubmitReport({
      siteId,
      vantageId,
      observationId,
      category: selectedCategory,
      subtype: selectedSubtype,
      severity,
      reporterConfidence: reporterConf,
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
          "Nothing has changed" is a scientific observation and is awarded identical merit to a damage report.
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
        {CONDITION_TAXONOMY.map((item) => {
          const active = item.category === selectedCategory;
          return (
            <Pressable
              key={item.category}
              onPress={() => {
                setSelectedCategory(item.category);
                setSelectedSubtype(item.subtypes[0] ?? '');
              }}
              style={[styles.categoryTile, active && styles.categoryTileActive]}
            >
              <Text variant="body" tone={active ? 'primary' : 'secondary'}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Subtype Selection Chips */}
      {currentTaxonomy ? (
        <View style={styles.section}>
          <Text variant="label" tone="muted" uppercase>
            Subtype
          </Text>
          <View style={styles.chipRow}>
            {currentTaxonomy.subtypes.map((st) => (
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

      {/* Severity Selector 1-5 */}
      <View style={styles.section}>
        <Text variant="label" tone="muted" uppercase>
          Severity Level (1 = Minor, 5 = Critical)
        </Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <Pressable
              key={lvl}
              onPress={() => setSeverity(lvl)}
              style={[styles.ratingPill, severity === lvl && styles.ratingPillActive]}
            >
              <Text variant="body" tone={severity === lvl ? 'primary' : 'secondary'}>
                {lvl}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Reporter Confidence 1-3 */}
      <View style={styles.section}>
        <Text variant="label" tone="muted" uppercase>
          Observer Confidence (1 = Low, 3 = High)
        </Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3].map((lvl) => (
            <Pressable
              key={lvl}
              onPress={() => setReporterConf(lvl)}
              style={[styles.ratingPill, reporterConf === lvl && styles.ratingPillActive]}
            >
              <Text variant="body" tone={reporterConf === lvl ? 'primary' : 'secondary'}>
                {lvl === 1 ? 'Low' : lvl === 2 ? 'Medium' : 'High'}
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
    borderColor: colors.primarySand,
    backgroundColor: colors.surfacePressed,
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
    borderColor: colors.primarySand,
    backgroundColor: colors.surfacePressed,
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
