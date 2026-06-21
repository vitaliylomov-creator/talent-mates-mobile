// System copy — warm-buddy voice (toasts, empty states, loaders, errors).
// Mate-as-AI chat responses always stay race-engineer (handled by edge function).
//
// Hybrid voice decision (founder approved):
//   • Mate's CHAT messages = race engineer (short, calm, precise)
//   • SYSTEM messages (here) = warm buddy (Gen Z, playful, never AI-speak)
//
// Banned vocab (the-edge-os): "AI assistant", "AI tool", "platform", "solution",
// "smart", "powered by AI", "next-gen", "revolutionary", "disruptive".
// No exclamation marks. No emoji in copy.

type Copy = { en: string; ua: string };

export const COPY = {
  // ─── Loaders ─────────────────────────────────────────────────────────
  loadingChat:        { en: 'On the line.',                  ua: 'На зв’язку.' },
  loadingThinking:    { en: 'Looking it up.',                ua: 'Дивлюсь.' },
  loadingLong:        { en: 'Hold on — pulling live data.',  ua: 'Секунду — підтягую live-дані.' },
  loadingTraining:    { en: 'Reading your session.',         ua: 'Читаю твою тренування.' },
  loadingProfile:     { en: 'Loading your profile.',         ua: 'Завантажую профіль.' },

  // ─── Empty states ────────────────────────────────────────────────────
  emptyChat:          { en: 'Quiet. Like before kickoff.\nWhat’s on your mind?',
                        ua: 'Тихо. Як перед свистком.\nЩо в голові?' },
  emptyHistory:       { en: 'No chats yet. The first one is one message away.',
                        ua: 'Поки тиша. Перший чат — за одне повідомлення.' },
  emptyTraining:      { en: 'No sessions logged. The first one is the hardest.',
                        ua: 'Ще жодної тренування. Перша — найважча. Логнемо?' },

  // ─── Errors ──────────────────────────────────────────────────────────
  errorGeneric:       { en: 'Something snapped. Try once more?',
                        ua: 'Щось зірвалось. Спробуй ще раз?' },
  errorNetwork:       { en: 'No signal. Reconnect and we’re back.',
                        ua: 'Сигнал зник. Як з’явиться — продовжимо.' },
  errorAuth:          { en: 'Session timed out. Sign back in.',
                        ua: 'Сесія закінчилась. Заходь знову.' },
  errorMicPermission: { en: 'Mic blocked. Open Settings if you want voice.',
                        ua: 'Мікрофон не дав доступ. Налаштування → дозволь, якщо хочеш голосом.' },
  errorVoiceTooShort: { en: 'Too short. Hold a bit longer.',
                        ua: 'Закоротко. Тримай довше.' },

  // ─── Successes ───────────────────────────────────────────────────────
  trainingSaved:      { en: 'Logged. See you tomorrow.',
                        ua: 'Записав. Завтра побачимось.' },
  profileSaved:       { en: 'Saved.',
                        ua: 'Збережено.' },
  proActivated:       { en: 'Pro is on. No more limits.',
                        ua: 'Pro активний. Більше лімітів — нема.' },
  copiedMessage:      { en: 'Copied.',
                        ua: 'Скопіював.' },
  signedOut:          { en: 'Signed out. Come back when you’re ready.',
                        ua: 'Вийшов. Повертайся, коли готовий.' },

  // ─── Prompts / placeholders ──────────────────────────────────────────
  chatPlaceholder:    { en: 'Message MATE…',           ua: 'Напиши MATE…' },
  voicePlaceholder:   { en: 'Listening…',              ua: 'Слухаю…' },
  voiceTapToTalk:     { en: 'Hold to talk',                 ua: 'Тримай — говори' },

  // ─── Onboarding ──────────────────────────────────────────────────────
  onboardingHello:    { en: 'Hey. Let’s set you up. Two minutes.',
                        ua: 'Привіт. Налаштуємо тебе. Дві хвилини.' },
  onboardingDone:     { en: 'Done. Welcome to your pit wall.',
                        ua: 'Готово. Це твоя радіостанція.' },
  onboardingSkip:     { en: 'Skip',                         ua: 'Пропустити' },
  onboardingNext:     { en: 'Next',                         ua: 'Далі' },
  onboardingBack:     { en: 'Back',                         ua: 'Назад' },

  // ─── Paywall (Pro upgrade) ───────────────────────────────────────────
  paywallTitle:       { en: 'You’ve hit the free limit.',
                        ua: 'Ти впер у безкоштовний ліміт.' },
  paywallBody:        { en: 'Go Pro to keep MATE on the line.\nManage on the web.',
                        ua: 'Pro — і MATE завжди на зв’язку.\nКерування на сайті.' },
  paywallCta:         { en: 'Go Pro',                       ua: 'Перейти на Pro' },
  paywallLater:       { en: 'Later',                        ua: 'Пізніше' },

  // ─── Auth ────────────────────────────────────────────────────────────
  authSignIn:         { en: 'Sign in',                      ua: 'Увійти' },
  authSignUp:         { en: 'Create account',               ua: 'Створити акаунт' },
  authEmail:          { en: 'Email',                        ua: 'Email' },
  authPassword:       { en: 'Password',                     ua: 'Пароль' },
  authGoogle:         { en: 'Continue with Google',         ua: 'Продовжити з Google' },
  authNoAccount:      { en: 'No account?',                  ua: 'Немає акаунту?' },
  authHaveAccount:    { en: 'Have an account?',             ua: 'Вже є акаунт?' },
  authForgot:         { en: 'Forgot password?',             ua: 'Забув пароль?' },
  authOr:             { en: 'or',                           ua: 'або' },
  authCheckEmail:     { en: 'Check your inbox. We sent a link to finish setup.',
                        ua: 'Глянь пошту — я скинув лінк для активації.' },
  authMinChars:       { en: 'At least 6 characters.',       ua: 'Мінімум 6 символів.' },
  authInvalidEmail:   { en: 'That email looks off.',        ua: 'Email щось не той.' },

  // ─── Tabs ────────────────────────────────────────────────────────────
  tabChat:            { en: 'Chat',                         ua: 'Чат' },
  tabTraining:        { en: 'Training',                     ua: 'Тренування' },
  tabProfile:         { en: 'Profile',                      ua: 'Профіль' },

  // ─── Brand line (NEVER rewrite — Hard Rule #5) ───────────────────────
  brandLine:          { en: 'MATE doesn’t play. MATE prepares the ones who do.',
                        ua: 'MATE не грає. MATE готує тих, хто грає.' },
  brandTagline:       { en: 'The race engineer\nfor football.',
                        ua: 'Гоночний інженер\nдля футболу.' },
} satisfies Record<string, Copy>;

export type CopyKey = keyof typeof COPY;

export function t(key: CopyKey, lang: 'en' | 'ua' = 'en'): string {
  return COPY[key][lang];
}
