import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { LoadingState, ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import {
  ALIGNMENT_TOLERANCE_OPTIONS,
  DISTANCE_UNIT_OPTIONS,
  OFFLINE_SYNC_OPTIONS,
  PHOTO_QUALITY_OPTIONS,
  SCRIPT_OPTIONS,
  WISDOM_TIER_OPTIONS,
} from '@/types';

import { SettingsChoice, SettingsSection, SettingsToggle } from './components';

export function PreferencesScreen() {
  const { hydrated, preferences, update, reset } = usePreferences();
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!hydrated) {
    return <LoadingState label="Reading your preferences" />;
  }

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Preferences"
        subtitle="Each of these changes something you can see. Nothing here is cosmetic."
      />

      <SettingsSection
        title="Alignment"
        footnote="Tolerance decides when the reticle reports a lock. It does not change what is recorded: an observation notes the tolerance it was taken at."
      >
        <SettingsChoice
          legend="Alignment tolerance"
          options={ALIGNMENT_TOLERANCE_OPTIONS}
          selected={preferences.alignmentTolerance}
          onSelect={(value) => void update('alignmentTolerance', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="Wisdom"
        footnote="This changes how much a place says when you reach it, not what it claims. Every tier draws on the same sourced material: the deeper ones simply stop leaving things out. Ask your own puts the question to the canonical texts, about wherever you are standing."
      >
        <SettingsChoice
          legend="How much to tell me"
          options={WISDOM_TIER_OPTIONS}
          selected={preferences.wisdomTier}
          onSelect={(value) => void update('wisdomTier', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="On arrival"
        footnote="Both are on because reaching a place is the gesture: you should not have to know there was something to open. Narration follows your phone's silent switch: silenced on the way into a shrine, it stays silent and the text is still there to read."
      >
        <SettingsToggle
          label="Open what a place holds"
          hint="Show the passage as soon as you reach a monument, without being asked."
          value={preferences.autoWisdom}
          onValueChange={(next) => void update('autoWisdom', next)}
        />
        <SettingsToggle
          label="Play the narration"
          hint="Start the recording when that opens. Never when your phone is silenced."
          value={preferences.autoNarration}
          onValueChange={(next) => void update('autoNarration', next)}
        />
      </SettingsSection>

      <SettingsSection
        title="Capture"
        footnote="Auto-capture is off by default. The witness loop is an act of attention, and an automatic shutter takes that decision away from the person holding the camera."
      >
        <SettingsToggle
          label="Capture on lock"
          hint="Release the shutter automatically once alignment holds."
          value={preferences.autoCapture}
          onValueChange={(next) => void update('autoCapture', next)}
        />
        <SettingsToggle
          label="Haptics"
          hint="A pulse when the vantage locks."
          value={preferences.hapticsEnabled}
          onValueChange={(next) => void update('hapticsEnabled', next)}
        />
      </SettingsSection>

      <SettingsSection title="Photograph quality">
        <SettingsChoice
          legend="Photo quality"
          options={PHOTO_QUALITY_OPTIONS}
          selected={preferences.photoQuality}
          onSelect={(value) => void update('photoQuality', value)}
        />
      </SettingsSection>

      <SettingsSection title="Uploads">
        <SettingsChoice
          legend="Offline sync"
          options={OFFLINE_SYNC_OPTIONS}
          selected={preferences.offlineSyncMode}
          onSelect={(value) => void update('offlineSyncMode', value)}
        />
      </SettingsSection>

      <SettingsSection title="Distance">
        <SettingsChoice
          legend="Distance unit"
          options={DISTANCE_UNIT_OPTIONS}
          selected={preferences.distanceUnit}
          onSelect={(value) => void update('distanceUnit', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="Names"
        footnote="Diacritics are the default: these are Pali and Sanskrit names, and the marks are part of them. Plain Latin exists for devices missing the glyphs, not as a simplification."
      >
        <SettingsChoice
          legend="Script"
          options={SCRIPT_OPTIONS}
          selected={preferences.scriptPreference}
          onSelect={(value) => void update('scriptPreference', value)}
        />
      </SettingsSection>

      {confirmingReset ? (
        <SettingsSection title="Reset">
          <Text variant="body" tone="secondary" style={styles.resetBody}>
            Restore all seven preferences to their defaults? Your observations, quests and
            condition reports are not affected.
          </Text>
          <Button label="Restore defaults" variant="primary" block onPress={() => {
            void reset();
            setConfirmingReset(false);
          }} />
          <Button label="Cancel" variant="quiet" block onPress={() => setConfirmingReset(false)} />
        </SettingsSection>
      ) : (
        <Button label="Restore defaults" variant="quiet" block onPress={() => setConfirmingReset(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resetBody: { padding: spacing.base },
});
