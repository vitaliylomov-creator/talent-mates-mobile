# Build & ship — MATE AI Mobile

## One-time setup

```bash
npm install -g eas-cli         # if missing
eas login                       # sign in with Apple-connected Expo account
eas init                        # creates project ID, writes to app.json `extra.eas.projectId`
```

Fill in `eas.json` `submit.production.ios` once Apple Developer enrolment completes:
- `ascAppId` — App Store Connect app ID (created after first dev build)
- `appleTeamId` — Apple Developer Team ID (visible after D-U-N-S verification)

## Dev build (install on Yegor's iPhone via TestFlight or QR)

```bash
# iOS — internal distribution, builds in cloud (~15 min)
eas build --profile development --platform ios

# Android — APK for Slough teammates with Android phones
eas build --profile development --platform android
```

After iOS build completes, EAS prints a QR. Open Camera on Yegor's iPhone → scan → "Open in TestFlight" → install. He now has MATE.

## Production build (App Store + Play Store review)

```bash
eas build --profile production --platform all
eas submit --platform ios       # App Store Connect review
eas submit --platform android   # Google Play internal track
```

## Required Supabase secrets (already set per mate-ai-context)

```
ANTHROPIC_API_KEY
OPENAI_API_KEY              # used by transcribe-voice Whisper proxy
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
FOOTBALL_DATA_API_KEY
OPENWEATHER_API_KEY
TRANSPORT_API_KEY + TRANSPORT_APP_ID
SERP_API_KEY
STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
```

## Optional — PostHog analytics

Free EU cloud project at posthog.com. Get the project API key, then add to local
`.env` and EAS:

```
EXPO_PUBLIC_POSTHOG_KEY=phc_xxxx
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Events tracked: see `src/lib/analytics.ts` EVT constants.

If the key is missing, analytics calls become no-ops — app works fine without it.

## Prereqs we still need before TestFlight submission

| # | Task | Status |
|---|---|---|
| 1 | D-U-N-S Number (Dun & Bradstreet) | ✅ Done |
| 2 | Apple Developer Program enrolment ($99/year) | ⏳ Need D-U-N-S to apply |
| 3 | Google Play Developer ($25 one-time) | ⏳ Can start in parallel |
| 4 | First EAS dev build → grabs SHA-1 for Android Google OAuth | After enrolment |

Google Sign-In currently works via Supabase's hosted OAuth proxy
(`signInWithGoogle` in `src/lib/auth.ts`) — no native Google client IDs
needed. Native Sign In with Google can be a v1.1 enhancement once
Google Cloud is updated with iOS bundle ID and Android SHA-1.
