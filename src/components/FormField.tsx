import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../lib/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.t3}
        selectionColor={theme.colors.t1}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.md },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 56,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t1,
  },
  inputFocused: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.glassHover,
  },
  inputError: { borderColor: theme.colors.danger },
  errorText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    marginTop: 6,
  },
});
