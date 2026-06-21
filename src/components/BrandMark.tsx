import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../lib/theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BrandMark({ size = 'lg', showTagline = true }: Props) {
  const wordmarkStyle: TextStyle = {
    fontFamily: theme.fonts.display,
    color: theme.colors.t1,
    letterSpacing: -1.5,
    fontSize: size === 'sm' ? 28 : size === 'md' ? 56 : 88,
    lineHeight: size === 'sm' ? 32 : size === 'md' ? 60 : 96,
  };

  return (
    <View style={styles.wrap}>
      <Text style={wordmarkStyle}>MATE</Text>
      {showTagline && (
        <Text style={styles.tagline}>
          The race engineer{'\n'}
          <Text style={styles.italic}>for football.</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tagline: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.t2,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 28,
  },
  italic: {
    fontFamily: theme.fonts.displayItalic,
    color: theme.colors.t3,
  },
});
