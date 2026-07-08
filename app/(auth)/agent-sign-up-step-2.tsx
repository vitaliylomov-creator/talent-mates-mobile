import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AgentAuthScaffold } from '../../src/components/AgentAuthScaffold';
import { FormField } from '../../src/components/FormField';
import { CountryPicker } from '../../src/components/CountryPicker';
import { completeAgentProfile } from '../../src/lib/agent';
import { clearIntent } from '../../src/lib/intent';
import { track, EVT } from '../../src/lib/analytics';
import { theme } from '../../src/lib/theme';
import { getLang } from '../../src/lib/lang';

// Step 2 of agent registration: FFAR profile. Assigns founding_number
// atomically server-side (1..100 or NULL once cap hit). After completion,
// the auth gate takes over — sees the new mate_pro_agents row and routes
// the user to /(pro)/chat.
export default function AgentSignUpStep2() {
  const router = useRouter();
  const lang = getLang();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ffarLicence, setFfarLicence] = useState('');
  const [ffarCountry, setFfarCountry] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundingNumber, setFoundingNumber] = useState<number | null>(null);
  const [isFounding, setIsFounding] = useState(false);

  const canSubmit =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    ffarLicence.trim().length > 0 &&
    !!ffarCountry &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await completeAgentProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ffar_licence: ffarLicence.trim(),
        ffar_country: ffarCountry as string,
      });
      setFoundingNumber(res.founding_number);
      setIsFounding(res.is_founding);
      track(EVT.agentRegistered, {
        is_founding: res.is_founding,
        founding_number: res.founding_number ?? null,
        ffar_country: ffarCountry,
      });
      // clearIntent so signing out later doesn't push them back through
      // agent onboarding — role picker will reset intent if needed.
      await clearIntent();
      // Show the celebration screen for a beat before the auth gate takes over.
      // The gate observes the newly-inserted mate_pro_agents row via useAgent
      // and will replace() to /(pro)/chat within ~500ms of the response.
    } catch (e: any) {
      setError(humanise(e?.message ?? '', lang));
      track(EVT.agentStep2Failed, { message: e?.message ?? '' });
    } finally {
      setSubmitting(false);
    }
  };

  // Celebration state after successful registration.
  if (foundingNumber !== null || isFounding) {
    return (
      <View style={styles.celebrateWrap}>
        <View style={styles.celebrateInner}>
          <Feather name="check-circle" size={56} color={theme.colors.accentGreen} />
          <Text style={styles.celebrateEyebrow}>MATE PRO</Text>
          <Text style={styles.celebrateTitle}>
            {lang === 'ua' ? 'Ти в системі.' : 'You’re in.'}
          </Text>
          {isFounding && foundingNumber ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {lang === 'ua'
                  ? `Founding Agent #${foundingNumber}`
                  : `Founding Agent #${foundingNumber}`}
              </Text>
            </View>
          ) : null}
          <Text style={styles.celebrateBody}>
            {lang === 'ua'
              ? 'Веду в дашборд.'
              : 'Opening your dashboard.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <AgentAuthScaffold
        step={2}
        eyebrow="MATE PRO"
        title={lang === 'ua' ? 'Твій ліцензійний профіль.' : 'Your licence profile.'}
        subtitle={lang === 'ua'
          ? 'FFAR ліцензія перевіряється вручну. Це впливає лише на Founding ціну — чат і відео працюють одразу.'
          : 'FFAR licence is verified manually. Only Founding pricing depends on it — chat and video work straight away.'}
        onNext={handleSubmit}
        nextLabel={lang === 'ua' ? 'Відкрити дашборд' : 'Open my dashboard'}
        nextDisabled={!canSubmit}
        nextLoading={submitting}
        showBack={false}
      >
        <View style={styles.pair}>
          <View style={{ flex: 1 }}>
            <FormField
              label={lang === 'ua' ? "Ім'я" : 'First name'}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              editable={!submitting}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label={lang === 'ua' ? 'Прізвище' : 'Last name'}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              editable={!submitting}
            />
          </View>
        </View>

        <FormField
          label={lang === 'ua' ? 'FFAR номер ліцензії' : 'FFAR licence number'}
          value={ffarLicence}
          onChangeText={setFfarLicence}
          placeholder="FIFA-FA-XXXXXX"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!submitting}
        />

        <Text style={styles.pickerLabel}>
          {lang === 'ua' ? 'Країна видачі' : 'Country of issue'}
        </Text>
        <Pressable
          onPress={() => setCountryOpen(true)}
          disabled={submitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.pickerBtn,
            !ffarCountry && styles.pickerBtnEmpty,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.pickerValue, !ffarCountry && styles.pickerPlaceholder]}>
            {ffarCountry ?? (lang === 'ua' ? 'Обрати країну' : 'Select country')}
          </Text>
          <Feather name="chevron-down" size={18} color={theme.colors.t3} />
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </AgentAuthScaffold>

      <CountryPicker
        visible={countryOpen}
        value={ffarCountry}
        onClose={() => setCountryOpen(false)}
        onPick={(c) => setFfarCountry(c)}
        title={lang === 'ua' ? 'Країна ліцензії' : 'Licence country'}
        searchPlaceholder={lang === 'ua' ? 'Пошук' : 'Search'}
      />
    </>
  );
}

function humanise(msg: string, lang: 'en' | 'ua'): string {
  const m = msg.toLowerCase();
  if (m.includes('409') || m.includes('already')) {
    return lang === 'ua' ? 'Профіль вже існує.' : 'Profile already exists.';
  }
  if (m.includes('ffar_licence') || m.includes('licence')) {
    return lang === 'ua'
      ? 'FFAR номер ліцензії обов’язковий.'
      : 'FFAR licence number is required.';
  }
  if (m.includes('ffar_country') || m.includes('country')) {
    return lang === 'ua'
      ? 'Країна не в списку FIFA.'
      : 'Country not in the FIFA list.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return lang === 'ua' ? 'Сигнал зник. Спробуй ще раз.' : 'No signal. Try again.';
  }
  return msg || (lang === 'ua' ? 'Щось зірвалось.' : 'Something snapped.');
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 10 },
  pickerLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.t3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.borderMid,
    borderWidth: 0.5,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  pickerBtnEmpty: {},
  pickerValue: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t1,
  },
  pickerPlaceholder: { color: theme.colors.t3 },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.danger,
    backgroundColor: 'rgba(255,93,108,0.10)',
    borderColor: theme.colors.danger,
    borderWidth: 0.5,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    marginTop: theme.spacing.sm,
  },

  celebrateWrap: {
    flex: 1,
    backgroundColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  celebrateInner: { alignItems: 'center' },
  celebrateEyebrow: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 4,
    color: theme.colors.accentGreen,
    marginTop: theme.spacing.lg,
  },
  celebrateTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 44,
    color: theme.colors.t1,
    letterSpacing: -0.7,
    marginTop: theme.spacing.md,
  },
  celebrateBody: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.t2,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  badge: {
    marginTop: theme.spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accentGreen,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 2,
    color: theme.colors.purple,
    textTransform: 'uppercase',
  },
});
