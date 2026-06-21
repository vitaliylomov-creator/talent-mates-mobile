import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '../../src/components/OnboardingScaffold';
import { FormField } from '../../src/components/FormField';
import { SegmentedPicker } from '../../src/components/SegmentedPicker';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { useAuth } from '../../src/hooks/useAuth';
import { savePlayerProfile } from '../../src/lib/onboarding';
import { getLang } from '../../src/lib/lang';
import { t } from '../../src/constants/strings';
import type { Player } from '../../src/lib/types';

export default function Step5Preferences() {
  const router = useRouter();
  const { session } = useAuth();
  const lang = getLang();
  const { draft, set, reset } = useOnboarding();
  const [saving, setSaving] = useState(false);

  // Pre-fill language from the device locale so the user can just tap Done.
  useEffect(() => {
    if (!draft.language_preference) {
      set({ language_preference: lang === 'ua' ? 'uk' : 'en' });
    }
  }, []);

  const languages: ReadonlyArray<{ value: NonNullable<Player['language_preference']>; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'uk', label: 'Українська' },
    { value: 'ru', label: 'Русский' },
  ];

  const handleDone = async () => {
    if (!session) {
      Alert.alert('No session', 'You must be signed in.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await savePlayerProfile(session.user.id, draft);
      setSaving(false);
      if (error) {
        // Surface the real PostgREST error verbatim so we can diagnose.
        // Common cause: missing RLS INSERT policy on players table.
        console.error('[onboarding] savePlayerProfile error:', error);
        Alert.alert(
          'Save failed',
          `${error.message}\n\nCode: ${error.code ?? '—'}\nHint: ${error.hint ?? '—'}`,
        );
        return;
      }
      if (!data) {
        Alert.alert('Save failed', 'No row returned after insert.');
        return;
      }
      reset();
      router.replace('/(app)/chat');
    } catch (e: any) {
      setSaving(false);
      console.error('[onboarding] unexpected error:', e);
      Alert.alert('Unexpected error', String(e?.message ?? e));
    }
  };

  return (
    <OnboardingScaffold
      step={5}
      title={lang === 'ua' ? 'Останнє.' : 'Last bit.'}
      subtitle={lang === 'ua'
        ? 'Мова — MATE відповідатиме нею. Бо коротко про себе — щоб контекст був глибший.'
        : 'Language — MATE will reply in it. Bio is your context.'}
      onNext={handleDone}
      nextLoading={saving}
      nextDisabled={!draft.language_preference || saving}
    >
      <SegmentedPicker
        label={lang === 'ua' ? 'Мова MATE' : 'MATE responds in'}
        value={draft.language_preference ?? null}
        options={languages}
        onChange={(v) => set({ language_preference: v })}
      />
      <FormField
        label={lang === 'ua' ? 'Про себе' : 'About you'}
        value={draft.bio ?? ''}
        onChangeText={(v) => set({ bio: v })}
        placeholder={lang === 'ua'
          ? 'Цілі на сезон, травми в анамнезі, амбіції.'
          : 'Season goals, injury history, ambitions.'}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        style={{ minHeight: 120 }}
      />
    </OnboardingScaffold>
  );
}
