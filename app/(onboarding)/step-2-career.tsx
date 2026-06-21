import { useRouter } from 'expo-router';
import { OnboardingScaffold } from '../../src/components/OnboardingScaffold';
import { FormField } from '../../src/components/FormField';
import { SegmentedPicker } from '../../src/components/SegmentedPicker';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { getLang } from '../../src/lib/lang';

export default function Step2Career() {
  const router = useRouter();
  const lang = getLang();
  const { draft, set } = useOnboarding();

  const positions = lang === 'ua'
    ? [
        { value: 'goalkeeper',  label: 'Воротар' },
        { value: 'defender',    label: 'Захисник' },
        { value: 'midfielder',  label: 'Півзахисник' },
        { value: 'forward',     label: 'Нападник' },
      ]
    : [
        { value: 'goalkeeper',  label: 'Goalkeeper' },
        { value: 'defender',    label: 'Defender' },
        { value: 'midfielder',  label: 'Midfielder' },
        { value: 'forward',     label: 'Forward' },
      ];

  const feet = lang === 'ua'
    ? [
        { value: 'left' as const,  label: 'Ліва' },
        { value: 'right' as const, label: 'Права' },
        { value: 'both' as const,  label: 'Обидві' },
      ]
    : [
        { value: 'left' as const,  label: 'Left' },
        { value: 'right' as const, label: 'Right' },
        { value: 'both' as const,  label: 'Both' },
      ];

  return (
    <OnboardingScaffold
      step={2}
      title={lang === 'ua' ? 'Де ти граєш?' : 'Where do you play?'}
      onNext={() => router.push('/(onboarding)/step-3-physical')}
    >
      <FormField
        label={lang === 'ua' ? 'Поточний клуб' : 'Current club'}
        value={draft.current_club ?? ''}
        onChangeText={(v) => set({ current_club: v })}
        placeholder="Slough Town FC"
        autoCapitalize="words"
      />
      <FormField
        label={lang === 'ua' ? 'Ліга' : 'League'}
        value={draft.current_league ?? ''}
        onChangeText={(v) => set({ current_league: v })}
        placeholder="U19 National League"
        autoCapitalize="words"
      />
      <SegmentedPicker
        label={lang === 'ua' ? 'Позиція' : 'Position'}
        value={draft.position_primary ?? null}
        options={positions}
        onChange={(v) => set({ position_primary: v })}
      />
      <SegmentedPicker
        label={lang === 'ua' ? 'Робоча нога' : 'Preferred foot'}
        value={draft.dominant_foot ?? null}
        options={feet}
        onChange={(v) => set({ dominant_foot: v })}
      />
    </OnboardingScaffold>
  );
}
