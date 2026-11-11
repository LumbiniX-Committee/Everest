import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePlan } from '@/store';
import { colors, font, radii, spacing } from '@/theme';

const FAILURE: Record<string, string> = {
  invalid: 'That code was not recognised. Check it and try again.',
  expired: 'This code has expired.',
  used: 'This code has already been used.',
  rate_limited: 'Too many tries. Please wait an hour and try again.',
  offline: 'Could not reach the server. Check your connection and try again.',
};

export function RedeemCode({ onRedeemed }: { onRedeemed?: () => void }) {
  const { redeem } = usePlan();
  const ui = useVisitorLiteralCopy();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const result = await redeem(code);
    setBusy(false);
    if (result.status === 'ok') {
      setSucceeded(true);
      setCode('');
      setMessage('Pro is active on this phone.');
      onRedeemed?.();
    } else {
      setSucceeded(false);
      setMessage(FAILURE[result.status]);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="bodyStrong">Have an activation code?</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="SAKSI-XXXX-XXXX-XXXX"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel={ui('Activation code')}
        style={styles.input}
      />
      {message ? (
        <Text variant="caption" tone={succeeded ? 'resolved' : 'error'}>
          {message}
        </Text>
      ) : null}
      <Button label="Redeem code" variant="secondary" loading={busy} disabled={busy || code.trim().length === 0} onPress={() => void submit()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  input: {
    ...font('mono'),
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
});
