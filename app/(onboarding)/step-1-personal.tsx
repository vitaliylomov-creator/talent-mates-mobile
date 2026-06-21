import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '../../src/components/OnboardingScaffold';
import { FormField } from '../../src/components/FormField';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { getLang } from '../../src/lib/lang';

export default function Step1Personal() {
  const router = useRouter();
  const lang = getLang();
  const { draft, set } = useOnboarding();

  const canContinue = (draft.full_name ?? '').trim().length >= 2;

  return (
    <OnboardingScaffold
      step={1}
      title={lang === 'ua' ? 'Хто ти?' : 'Who are you?'}
      subtitle={lang === 'ua'
        ? 'Базове — як до тебе звертатись.'
        : 'The basics — how MATE should address you.'}
      onNext={() => router.push('/(onboarding)/step-2-career')}
      nextDisabled={!canContinue}
      showSkip={false}
    >
      <FormField
        label={lang === 'ua' ? "Повне ім'я" : 'Full name'}
        value={draft.full_name ?? ''}
        onChangeText={(v) => set({ full_name: v })}
        placeholder={lang === 'ua' ? 'Єгор Ломов' : 'Yegor Lomov'}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <FormField
        label={lang === 'ua' ? 'Дата народження' : 'Date of birth'}
        value={draft.date_of_birth ?? ''}
        onChangeText={(v) => set({ date_of_birth: v })}
        placeholder="2006-03-15"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <FormField
        label={lang === 'ua' ? 'Громадянство' : 'Nationality'}
        value={draft.nationality ?? ''}
        onChangeText={(v) => set({ nationality: v })}
        placeholder={lang === 'ua' ? 'Україна' : 'Ukraine'}
        autoCapitalize="words"
      />
    </OnboardingScaffold>
  );
}
