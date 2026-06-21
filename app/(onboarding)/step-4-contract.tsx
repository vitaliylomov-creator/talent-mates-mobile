import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '../../src/components/OnboardingScaffold';
import { FormField } from '../../src/components/FormField';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { getLang } from '../../src/lib/lang';

export default function Step4Contract() {
  const router = useRouter();
  const lang = getLang();
  const { draft, set } = useOnboarding();

  return (
    <OnboardingScaffold
      step={4}
      title={lang === 'ua' ? 'Контракт' : 'Contract'}
      subtitle={lang === 'ua'
        ? 'Legal-агент MATE поверне до цього коли треба буде.'
        : 'MATE\'s Legal agent will refer to this when it matters.'}
      onNext={() => router.push('/(onboarding)/step-5-preferences')}
    >
      <FormField
        label={lang === 'ua' ? 'Кінець контракту' : 'Contract expiry'}
        value={draft.contract_expires ?? ''}
        onChangeText={(v) => set({ contract_expires: v })}
        placeholder="2027-06-30"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <FormField
        label={lang === 'ua' ? "Ім'я агента" : 'Agent name'}
        value={draft.agent_name ?? ''}
        onChangeText={(v) => set({ agent_name: v })}
        placeholder={lang === 'ua' ? 'Vitalii Lomov' : 'Vitalii Lomov'}
        autoCapitalize="words"
      />
    </OnboardingScaffold>
  );
}
