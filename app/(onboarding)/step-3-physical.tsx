import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '../../src/components/OnboardingScaffold';
import { FormField } from '../../src/components/FormField';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { getLang } from '../../src/lib/lang';

export default function Step3Physical() {
  const router = useRouter();
  const lang = getLang();
  const { draft, set } = useOnboarding();

  return (
    <OnboardingScaffold
      step={3}
      title={lang === 'ua' ? 'Параметри' : 'Physical'}
      subtitle={lang === 'ua'
        ? 'Допомагає MATE рахувати навантаження і ризики.'
        : 'Helps MATE reason about load and risk.'}
      onNext={() => router.push('/(onboarding)/step-4-contract')}
    >
      <FormField
        label={lang === 'ua' ? 'Зріст (см)' : 'Height (cm)'}
        value={draft.height_cm != null ? String(draft.height_cm) : ''}
        onChangeText={(v) => set({ height_cm: toIntOrNull(v) })}
        placeholder="175"
        keyboardType="number-pad"
        maxLength={3}
      />
      <FormField
        label={lang === 'ua' ? 'Вага (кг)' : 'Weight (kg)'}
        value={draft.weight_kg != null ? String(draft.weight_kg) : ''}
        onChangeText={(v) => set({ weight_kg: toIntOrNull(v) })}
        placeholder="70"
        keyboardType="number-pad"
        maxLength={3}
      />
    </OnboardingScaffold>
  );
}

function toIntOrNull(v: string): number | null {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}
