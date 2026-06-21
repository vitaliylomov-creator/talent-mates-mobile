import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';
import { t } from '../constants/strings';
import type { Lang } from '../lib/lang';

interface SuggestionProps {
  label: string;
  onPress: () => void;
}

function Suggestion({ label, onPress }: SuggestionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

interface Props {
  lang: Lang;
  playerName?: string | null;
  onSuggestion: (text: string) => void;
}

export function EmptyChat({ lang, playerName, onSuggestion }: Props) {
  const greet = playerName
    ? (lang === 'ua' ? `${playerName}.` : `${playerName}.`)
    : null;

  const suggestions = lang === 'ua' ? [
    'Що з моїм контрактом?',
    'Як готуватись до матчу в неділю?',
    'Коли тренування Slough?',
    'Скільки коштує футболіст моєї позиції?',
  ] : [
    'What about my contract?',
    'How do I prep for Sunday\'s match?',
    'When does Slough train?',
    'What is a player at my position worth?',
  ];

  return (
    <View style={styles.wrap}>
      {greet && <Text style={styles.hello}>{greet}</Text>}
      <Text style={styles.body}>{t('emptyChat', lang)}</Text>

      <View style={styles.chips}>
        {suggestions.map((s) => (
          <Suggestion key={s} label={s} onPress={() => onSuggestion(s)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  hello: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.t1,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.t2,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  chips: {
    gap: 10,
    width: '100%',
    alignItems: 'stretch',
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderWidth: 0.5,
    borderRadius: theme.radii.md,
  },
  chipText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.t1,
  },
});
