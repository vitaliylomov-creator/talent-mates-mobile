# MATE Pro — Mobile Extension Briefing
## Handoff for Mate in the "Mate mobile app development" chat

**Date:** 2026-06-25
**Prepared by:** Mate (in the `talent-mates-pddr` web session)
**For:** Mate (in the `talent-mates-mobile` session)
**Scope:** Extend the existing Expo/React Native mobile app (currently Player-only) to also support the new **Agent role** (MATE Pro), reusing the same Supabase backend that's already live in production.

---

## 0. Read this first

The mobile app you're working on ships as **"MATE AI"** — bundle id `com.talentmates.mate`. It has an existing **Player** flow: 5-step onboarding, chat with 4 sub-agents (Legal/Coach/Analyst/Concierge), training log, profile, upgrade. That flow stays **untouched**. This briefing is about adding a **parallel second flow** for **licensed football agents** — a completely different persona, different UI language, different subscription economics.

**Guiding principle from the founder:** the Player mobile app is running in production for real players. Do not regress it while adding Agent support. Same rule that governed the web build: MATE Pro must live **alongside** MATE (Players), not on top of it.

---

## 1. What is MATE Pro (the Agent product)?

**One-line pitch:** the race engineer for a licensed football agent's roster.

**Audience:** FFAR-licensed football agents. Not players. Not clubs. The single reader of every response is the AGENT, and they treat the assistant as a peer professional, not a protected end-user.

**Product surface (already live on web at `app.talent-mates.com/mate-pro-*`):**
- Two-step registration (email + password → FFAR licence + name + country)
- Client roster management (agent's own players as first-class entities)
- Chat with 4 sub-agents adapted for agent-side reasoning
- Video analysis (Coach vision reads 6-12 frames extracted browser-side)
- Founding 100 promotion (first 100 verified agents lock €149/mo lifetime)
- Standard tier €299/mo after the founding cohort or window closes
- 14-day trial with card required, Stripe billing live

**Founder is Founding Agent #1** — the account `vitaliylomov@gmail.com` has a real trialing subscription right now (with `cancel_at_period_end` scheduled for 2026-07-09 to avoid a real charge during testing).

---

## 2. Current state of both surfaces

| Surface | Status | Notes |
|---|---|---|
| Web — Players (`mate-auth.html` / `mate-dashboard-v6.html`) | Live in production | Unchanged by this project |
| Web — Agents (`mate-pro-auth.html` / `mate-pro-dashboard.html` / `mate-pro-admin.html`) | **Live in production**, launched 2026-06-24 | Full flow: auth → 2-step register → dashboard → chat + video + billing + FFAR admin |
| Mobile — Players (`app/(auth)`, `app/(onboarding)`, `app/(app)/chat`, etc.) | Live on TestFlight / internal Android | Player-only; unchanged |
| **Mobile — Agents** | **Not built yet — this is your job** | Add role-aware entry, agent onboarding, agent dashboard, agent chat, agent billing |

---

## 3. Backend — one Supabase project serves both apps

**Project:** `zlkzjeaojpxzccpovygk` (Mate AI, eu-central-1). Same URL as Players.

### 3.1 Environment variables the mobile app already knows

From `.env.example` you already have:
- `EXPO_PUBLIC_SUPABASE_URL=https://zlkzjeaojpxzccpovygk.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_3E7wboJ9pXRrMxCfDzxxaA_iauXsILn`

No changes needed. Every Agent-side call reuses the same Supabase client — role is derived from which product-row exists for the authenticated `auth.users.id`.

### 3.2 Database tables relevant to Agent flow

All prefixed `mate_pro_*` to avoid collision with Players tables (`players`, `subscriptions`, `conversations`, `messages`).

**`mate_pro_agents`** — the agent's own row (one per authenticated user with agent role):
```
id                    uuid PK
user_id               uuid FK auth.users (unique)
first_name, last_name text
email                 text
ffar_licence          text (required, non-empty)
ffar_country          text (must match FIFA member from static list)
ffar_verified         boolean (default false — founder verifies manually)
ffar_verified_at      timestamptz
agency_name           text nullable
country_of_operation  text nullable
years_experience      int nullable
specialisation        text nullable
founding_number       int nullable (1..100, unique, NULL after cap)
is_founding           boolean (generated column)
founding_window_ends_at timestamptz (created_at + 30 days, set by trigger)
created_at, updated_at
```

**`mate_pro_clients`** — the agent's players (their clients):
```
id                   uuid PK
agent_id             uuid FK mate_pro_agents (owner)
first_name, last_name
date_of_birth
nationality
position_primary     enum: 'Goalkeeper'..'Centre Forward'
dominant_foot        enum: 'Right'|'Left'|'Both'
current_club, current_league
height_cm, weight_kg
contract_expires     date
status               enum: 'active'|'prospect'|'dormant'
representation_notes text
commission_pct       numeric(4,2)
career_history       text
notes_for_mate       text
created_at, updated_at
```

**`mate_pro_conversations`** — chat threads:
```
id, agent_id, client_id (nullable), title, sub_agent,
message_count, last_message_at, created_at
```

**`mate_pro_messages`** — chat messages:
```
id, conversation_id, agent_id,
role: 'user'|'assistant'|'system',
content, sub_agent,
attachment_type: 'pdf'|'video_analysis'|null,
attachment_ref uuid, attachment_meta jsonb,
created_at
```

**`mate_pro_video_analyses`** — Claude Vision reads:
```
id, agent_id, client_id, conversation_id,
storage_path, filename, size_bytes, duration_sec,
focus enum: 'positioning'|'technical'|'decisions'|'physical',
question text,
frames_extracted int, frame_paths text[],
result_text text,
status enum: 'pending'|'extracting'|'analysing'|'complete'|'failed',
error_message,
created_at, completed_at
```

**`mate_pro_subscriptions`** — Stripe billing state:
```
id, agent_id,
stripe_customer_id, stripe_subscription_id (unique), stripe_price_id,
plan enum: 'founding'|'standard',
status enum: 'trialing'|'active'|'past_due'|'canceled'|...,
trial_ends_at, current_period_start, current_period_end,
cancel_at, canceled_at, ended_at,
created_at, updated_at
```

**`mate_pro_founding_counter`** — single-row atomic counter:
```
id (=1), next_number, cap (=100), updated_at
```
Currently `next_number=5` (founder took #1; #2, #3 reserved for team; test agents took #4 and #5 which we then cleaned up).

**RLS is on every table.** Agent reads/writes their own rows only. Service-role (edge functions) does everything else. No cross-agent access is physically possible.

**Storage buckets** (both private):
- `mate-pro-videos` — original video clips uploaded by agent
- `mate-pro-frames` — extracted JPEG frames the vision function reads

Frame paths: `{agent_id}/{video_analysis_id}/frame_001.jpg`

### 3.3 Edge functions (all deployed and live)

Base URL: `https://zlkzjeaojpxzccpovygk.supabase.co/functions/v1/`

All functions:
- Deployed with `--no-verify-jwt` (Supabase project has asymmetric JWT config; gateway can't verify, so functions validate internally)
- Accept `Authorization: Bearer <access_token>` + `apikey: <SUPABASE_ANON_KEY>` headers
- Return `Content-Type: application/json` with defensive control-char escape

#### 3.3.1 `mate-pro-complete-profile`
Second step of Agent registration. After frontend does `sb.auth.signUp({email, password})`, this endpoint takes the FFAR profile fields.
**Request:** `POST { first_name, last_name, ffar_licence, ffar_country }`
**Response:** `200 { agent_id, founding_number, is_founding, email }` | `409` if profile already exists.
Runs `mate_pro_assign_founding_number()` RPC (atomic 1..100 or NULL), inserts the `mate_pro_agents` row.

#### 3.3.2 `mate-pro-chat`
Main chat endpoint. Multi-step Anthropic Tool Use loop (max 5 iterations, Sonnet 4.6, 4000 tokens). 4 sub-agent personas.
**Request:**
```json
{
  "conversation_id": "<uuid>|null",
  "client_id": "<uuid>|null",
  "sub_agent": "auto|legal|coach|analyst|concierge",
  "message": "text",
  "pdf_base64": "…optional…",
  "pdf_name": "contract.pdf"
}
```
**Response:** `200 { conversation_id, message_id, sub_agent, response, tools_used[], iterations, input_tokens, output_tokens, had_pdf, had_tool_use }`

Response is **non-streaming**: one JSON payload after the tool-use loop finishes. Response `.response` is Markdown-formatted; on web we render it with `marked + DOMPurify`. On mobile use `react-native-markdown-display` (already in your `package.json`).

**Persona for `legal` sub-agent is agent-native** (SKILL.md v1.0 for agents). Coach / Analyst / Concierge still use the player-side snapshot with an `<agent_audience_overlay>` block that retargets the audience. Output rules on all four: no markdown headers, no tables, no em-dashes, no emoji, plain prose, bold only on key facts. This is a formatting_constraints block in the system prompt — the response should already conform.

Available tools (Claude may call any of these autonomously):
- `web_search(query, country_code?)`
- `places_search(query, location)`
- `weather(city, country_code?)`
- `uk_train_times(from_station, to_station)`
- `fifa_regulations_search(query, top_k?)` — pgvector RAG over FFAR, RSTP, CAS, national FA texts
- `football_data(type, league, team_name?)` — Premier League etc.
- `world_football_data(type, league, team_name?)` — Ukrainian, Belgian, Scottish etc.
- `list_clients(position?, league?, status?, contract_expires_before?)` — agent's own roster
- `get_client(client_id? | client_name?)` — one client deep profile

Subscription gate: currently OFF (`MATE_PRO_BILLING_ENFORCED=false` in env). When founder flips it, this endpoint returns `402 { error: "Subscribe to continue…", checkout_required: true }` for agents without active subscription.

#### 3.3.3 `mate-pro-video-analyse`
Claude Vision over frames.
**Request:**
```json
{
  "conversation_id": "<uuid>|null",
  "client_id": "<uuid>|null",
  "frame_paths": ["{agent_id}/{va_id}/frame_001.jpg", "…"],
  "focus": "positioning|technical|decisions|physical",
  "question": "optional",
  "filename": "clip.mp4",
  "duration_sec": 12.4
}
```
**Response:** `200 { video_analysis_id, status: "complete", result_text, message_id?, frames_used, input_tokens, output_tokens }`

Model: `claude-opus-4-7`. Cost ~€0.26/analysis. Max 12 frames, 60s clip.

**Frame extraction is client-side.** On web we use canvas from a `<video>` element. On mobile you'll use `expo-video` or `react-native-video` + frame grabbing — or the simpler approach: use the device's native photo picker to let the agent pick 6-8 stills from their phone gallery already extracted from a clip. Discuss with founder.

Upload flow:
1. Extract N frames locally as JPEGs (target 1280px wide, quality 0.8)
2. `sb.storage.from('mate-pro-frames').upload({agent_id}/{va_id}/frame_NNN.jpg, blob)`
3. Call this function with the paths

#### 3.3.4 `mate-pro-create-checkout`
Stripe Checkout Session. Picks price based on `ffar_verified AND founding_number AND now < founding_window_ends_at`.
**Request:** `POST {}` (identity from JWT)
**Response:** `200 { url, session_id, plan: "founding"|"standard", price_eur: 149|299, trial_days: 14 }`

Frontend redirects `window.location.href = url` on web. On mobile use `expo-web-browser` `WebBrowser.openBrowserAsync(url)` — Stripe Checkout works fine inside the in-app browser. Success URL: `https://app.talent-mates.com/mate-pro-dashboard.html?subscribed=1`.

**iOS App Store compliance note:** Apple takes 30% on in-app purchases of "digital goods". Stripe web checkout inside `expo-web-browser` is a grey zone — Apple has been enforcing more strictly. For the first mobile release, safest path is either:
- Show Subscribe CTA only on Android + web (hide on iOS)
- Or route iOS users to the web dashboard for billing
- Or bite the bullet and set up in-app purchases via `expo-in-app-purchases` (30% Apple cut on €149 = €44.70)

Discuss with founder. For MVP I'd recommend hiding subscribe on iOS and routing to web.

#### 3.3.5 `mate-pro-cancel-subscription`
Sets `cancel_at_period_end=true` on Stripe.
**Request:** `POST {}`
**Response:** `200 { ok: true, cancel_at: "ISO date" }`

#### 3.3.6 `mate-pro-stripe-webhook`
Stripe → us. You don't call this from the app.

#### 3.3.7 `mate-pro-delete-account`
GDPR erasure. Deletes storage frames + auth.users (cascade removes all mate_pro_* rows). Founding slot stays consumed.
**Request:** `POST {}`
**Response:** `200 { ok: true, deleted_agent_id, deleted_clients, deleted_conversations, deleted_frames, deleted_videos }`

#### 3.3.8 `mate-pro-admin-actions`
Founder-only email-gated (`vitaliylomov@gmail.com`). Actions: `list`, `verify`, `reject`, `cancel_subscription`. Mobile version of the admin surface is optional — the web admin page works fine on a phone browser. Skip on the first pass.

---

## 4. Business logic you must respect

### 4.1 The Founding 100 promotion
- First 100 agents who **complete profile** get `founding_number = 1..100`
- Founding **badge is symbolic and permanent** (never revoked, even after subscription cancels)
- Founding **price of €149/mo** is only offered when ALL three are true at the moment of checkout:
  - `ffar_verified = true` (founder manually verified via admin page)
  - `founding_number IS NOT NULL`
  - `now() < founding_window_ends_at` (30 days from profile creation)
- Otherwise **Standard price of €299/mo** is used
- The choice is locked at checkout — even if FFAR verification lands later, the price stays where it was when the session was created

### 4.2 The 14-day trial
- Card is collected at Checkout, but no charge for 14 days
- `status = 'trialing'`, first invoice fires at `trial_end`
- Cancel any time during trial → no charge ever

### 4.3 The FFAR verification workflow
- New agent registers → `ffar_verified = false`
- Chat and video work regardless of verification (during soft launch phase)
- **Only** the Founding €149 price is gated on verification
- Founder verifies manually via `mate-pro-admin.html` after checking the licence at `fifa.com/about-fifa/football-agents`
- Set the mobile UI to show "● Pending FFAR verification" until the row updates to `true`

### 4.4 The subscription gate (soft launch)
- `MATE_PRO_BILLING_ENFORCED=false` right now (default, not explicitly set)
- Chat and video work for any registered agent, even without subscription
- Founder plans to keep this off until warm-network beta shows product-market fit
- When flipped on, `mate-pro-chat` and `mate-pro-video-analyse` return `402 { checkout_required: true }` if agent has no active subscription
- Mobile app should handle 402 gracefully → route to a paywall screen with Subscribe CTA

---

## 5. Auth flow for Agents on mobile

### 5.1 Sign-in (existing account)
Standard `sb.auth.signInWithPassword({ email, password })`. Then check whether the signed-in user has a `mate_pro_agents` row:

```typescript
const { data: agent } = await sb
  .from('mate_pro_agents')
  .select('id, first_name, last_name, ffar_verified, founding_number, founding_window_ends_at')
  .eq('user_id', session.user.id)
  .maybeSingle();

if (agent) {
  // Agent — route to Agent dashboard
} else {
  // Check if they're a Player instead:
  const { data: player } = await sb.from('players').select('id').eq('auth_user_id', session.user.id).maybeSingle();
  if (player) {
    // Route to existing Player flow
  } else {
    // Signed in but neither product row exists — likely mid-flow.
    // Ask role, then push to Player onboarding or Agent step-2.
  }
}
```

### 5.2 Sign-up (new Agent)
Two steps by design:
1. **Step 1** — email + password: `sb.auth.signUp({ email, password })`. Supabase returns a session immediately (no email confirmation in this project).
2. **Step 2** — after session exists, collect first_name, last_name, ffar_licence, ffar_country (dropdown from the FIFA member list — see `supabase/functions/_shared/fifa-countries.ts` in the web repo, 211 entries). POST to `mate-pro-complete-profile` with that body. Response gives you `founding_number` — celebrate it in the UI.

### 5.3 The role selector

The web version puts a top-level Player | Agent toggle above Sign in / Request access. On mobile, the cleanest way to do the same thing is a first-screen role picker before the auth stack:

- **Role screen** (`app/(auth)/role.tsx`) — two large cards: "I'm a Player" (→ existing Player auth+onboarding) and "I'm a Licensed Agent" (→ Agent auth flow, new).
- Store the pick in `AsyncStorage.setItem('mate_intent', 'player'|'agent')` before entering the auth stack.
- After sign-in, use the intent + product-row check to decide destination.

---

## 6. Suggested mobile route architecture

Extending the existing `expo-router` file tree (do NOT remove anything Player-related):

```
app/
  (auth)/
    role.tsx                 ← NEW: role picker screen (Player | Agent)
    sign-in.tsx              ← EXISTING: reuse for both roles (branch on intent post-auth)
    sign-up.tsx              ← EXISTING: for Players
    agent-sign-up-step-1.tsx ← NEW: email + password for Agent
    agent-sign-up-step-2.tsx ← NEW: profile completion (name + FFAR)
  (onboarding)/              ← EXISTING: unchanged, Player-only
    step-1..step-5           ← Player onboarding
  (app)/                     ← Player app tabs — untouched
    chat/
    training/
    profile/
    upgrade/
  (pro)/                     ← NEW: Agent tab group, mirrors (app) structure
    _layout.tsx              ← Tab layout: Chat / Clients / Video / Profile
    chat/
      index.tsx              ← Agent chat with sub-agent selector
      [conversationId].tsx   ← Open historical conversation
    clients/
      index.tsx              ← Roster list
      new.tsx                ← Add new client form
      [clientId].tsx         ← Client deep view
    video/
      new.tsx                ← Video analyse: pick file, extract frames, upload, run
      [analysisId].tsx       ← View past analysis
    profile/
      index.tsx              ← Agent profile with FFAR, founding badge, danger zone
      billing.tsx            ← Subscribe / manage / cancel
```

### Root `_layout.tsx` decision logic

On app boot, `_layout.tsx` reads the Supabase session and routes:
- No session → `/role` (unless intent already stored → straight to /sign-in with that role remembered)
- Session + `mate_pro_agents` row → `/(pro)/chat`
- Session + `players` row → `/(app)/chat` (existing)
- Session + neither → mid-flow, route to whichever onboarding matches stored intent

---

## 7. Suggested Agent screens — what to build first

Order matters. Build the vertical slice that lets a real agent register, chat once, and be paying by end of week 1.

### Sprint 1 (MVP — 5 days)
1. `role.tsx` — role picker
2. `agent-sign-up-step-1.tsx` — email + password
3. `agent-sign-up-step-2.tsx` — 4-field profile with FIFA country dropdown
4. `(pro)/_layout.tsx` — tab layout (Chat / Clients / Video / Profile)
5. `(pro)/chat/index.tsx` — chat UI with sub-agent picker, message list, input, `mate-pro-chat` fetch
6. `(pro)/clients/index.tsx` — list clients, "Add client" button
7. `(pro)/clients/new.tsx` — client add form
8. `(pro)/profile/index.tsx` — agent profile view (name, FFAR, founding badge, sign out)

### Sprint 2 (billing + video — 3-4 days)
9. `(pro)/profile/billing.tsx` — Subscribe / trial state / cancel; on iOS, hide Subscribe and link to web
10. `(pro)/video/new.tsx` — pick clip from library, extract or select frames, upload to storage, call `mate-pro-video-analyse`
11. `(pro)/clients/[clientId].tsx` — client deep view with contract details, recent conversations
12. Delete account flow in profile (`mate-pro-delete-account`)

### Sprint 3 (polish — 2-3 days)
13. Push notifications for `subscription.trial_will_end` (via `expo-notifications`, edge-triggered when webhook fires)
14. Deep linking: `matemobile://mate-pro-auth?role=agent`, `matemobile://mate-pro-dashboard/conversations/{id}`
15. Offline draft: cache pending client add / message locally, sync on reconnect
16. Empty states, error toasts, haptic feedback on Subscribe success

---

## 8. Design system — Inside Shell for Agent screens

Same shell as web MATE Pro. Design tokens:

```typescript
export const AgentTheme = {
  colors: {
    purple: '#794DC6',       // ground / body background
    purpleDk: '#6b42b5',
    purpleLt: '#7a50cc',
    ink: '#1a0f2e',           // deep accents only
    white: '#ffffff',
    t1: 'rgba(255,255,255,1)',       // primary text
    t2: 'rgba(255,255,255,0.82)',    // secondary
    t3: 'rgba(255,255,255,0.55)',    // tertiary (eyebrows, meta)
    t4: 'rgba(255,255,255,0.35)',    // low emphasis
    border: 'rgba(255,255,255,0.10)',
    borderMid: 'rgba(255,255,255,0.20)',
    borderStrong: 'rgba(255,255,255,0.35)',
    glass1: 'rgba(255,255,255,0.05)',
    glass2: 'rgba(255,255,255,0.08)',
    glass3: 'rgba(255,255,255,0.12)',
    accentGreen: '#6dffb3',   // verified, active sub
    accentAmber: '#ffb86d',   // pending, trial
    accentRed: '#ff9898',     // danger, rejected
  },
  fonts: {
    display: 'DMSerifDisplay_400Regular',       // already installed
    displayItalic: 'DMSerifDisplay_400Regular_Italic',
    body: 'DMSans_300Light',
    bodyMedium: 'DMSans_500Medium',
  },
  radius: {
    button: 100,      // pill
    card: 24,
    input: 14,
    modal: 20,
  },
} as const;
```

**Buttons:** primary is a white pill with purple text, uppercase, `letter-spacing: 0.18em`. Ghost is transparent with `borderMid` border.

**Cards:** glass-morphic on the purple ground — `background: 'rgba(255,255,255,0.05)'`, `borderWidth: 0.5`, `borderColor: 'rgba(255,255,255,0.10)'`, `borderRadius: 24`, and on iOS/Android use `BlurView` from `expo-blur` (already in your dependencies? if not, `expo install expo-blur`).

**Italic-accent rule:** every DM Serif Display heading dims and italicises its second beat, e.g. `The race engineer for <em>your roster.</em>`. Implement as two `Text` elements side by side with the italic one at 45% white.

**Pulsing dot** for live/active indicators — `Animated.Value` looping opacity 0.9 → 0.25 → 0.9 over 2.4s.

**Formatting rule for chat responses** — the assistant returns Markdown from `mate-pro-chat`. Render with `react-native-markdown-display` (already installed). Style the markdown tokens so headers, bold, and code look right on the purple ground. Reference the web CSS at `mate-pro-dashboard.html:.chat-msg-body` — mirror those styles in the React Native markdown renderer's style prop.

---

## 9. Persona voice — do not soften

The web version enforces a strict voice via the `<formatting_constraints>` block in the system prompt for chat. The mobile app doesn't need to change this — the server already returns responses that comply. But when you write UI copy yourself (screen titles, empty states, error messages, button labels), match the same register:

- **Senior peer to senior peer.** Do not baby the user.
- **No emoji.** Not in copy, not in status pills, not in error toasts. If you need to flag risk, write "Flag:" or "Risk:" as words.
- **No exclamation marks in headlines.** No "!" in any CTA.
- **Italic accent on every DM Serif Display headline.** E.g. `Your <em>roster.</em>`, `The room where <em>work happens.</em>`.
- **Race engineer mood.** Quiet, precise, confident. The reader is a licensed professional; assume domain fluency.

Reference: `MATE_PRO_SUPABASE_SPEC_v1.md` in the web repo, Section 0 rule 3 ("Edge OS voice rules") and the `the-edge-os` skill.

---

## 10. Frame extraction on mobile — the one hard technical decision

Web extracts frames from `<video>` via canvas. Mobile has three viable paths:

**Path A — expo-video + snapshot at timestamp** *(untested at scale)*
Use `expo-video` or `expo-av` to load the clip, seek to a target time, grab a snapshot via `takePictureAsync`-equivalent. Some libraries expose frame capture; check `react-native-vlc-media-player` or `react-native-video-processing`. Bundle size and iOS/Android parity matter.

**Path B — Native module via `ffmpeg-kit-react-native`**
Reliable but adds ~30 MB to bundle and requires EAS build. `ffmpeg -i input.mp4 -vf "fps=1/1" frame_%03d.jpg` extracts one frame per second, then upload the 6-10 you want. Overkill for MVP.

**Path C (recommended for MVP) — Photo library picker**
Ask the agent to pick 6-8 stills from their phone's photo library already extracted from a clip (screen recorder, native pause+screenshot, etc.). Zero video processing on device. Ships fast. Reveal a "smart" extract path in a later release.

Discuss with founder before Sprint 2. My recommendation: Path C for MVP, revisit with a real user's feedback.

---

## 11. Tests to run before shipping to TestFlight

Fresh account end-to-end:
1. Open app → role screen → tap "Agent" → step 1 form
2. Enter email + password + accept Terms → tap Continue
3. Step 2 form appears smoothly — enter first/last name + FFAR + Ukraine → tap Open my dashboard
4. Land on Agent dashboard, chat tab active. Sub-agent picker shows Auto/Legal/Coach/Analyst/Concierge
5. Add first client (Yehor Lomov, CM, Slough Town FC) — appears in clients tab
6. In chat tab, send: "What does FFAR Article 15 say about commission caps for a youth player?" → wait 15-45s → response renders as clean Markdown with `FFAR Art. 15` in inline code, no `###` headers leaking as text
7. Sub-agent pill next to the response says LEGAL
8. Tap Video tab → pick 6 stills from library → focus = positioning → run analysis → scout's read renders in 30-45s
9. Tap Profile → tap Billing → tap Subscribe → Stripe Checkout opens in in-app browser → complete with test card → return to app → Trial banner shows "14 days left"
10. Immediately Cancel subscription in Profile — banner changes to "Cancellation scheduled"
11. Sign out → sign back in — session restored, still Agent dashboard, subscription state intact
12. Existing Player account signs in (via the "Player" branch of role picker) — lands on the existing Player app, nothing broken

---

## 12. Where the web code lives (read these files for reference)

The founder's web repo is at `~/Documents/AI agents/talent-mates-pddr/`. Key files worth reading:

- **`mate-pro-auth.html`** (1478 lines) — the web auth page, both Player and Agent. Especially the JS section starting around line 1015 for the exact API calls and state machine.
- **`mate-pro-dashboard.html`** (3080 lines) — the web dashboard. The section starting `// SUBSCRIPTION (Stripe)` around line 2660 shows the billing banner state machine and subscription CRUD.
- **`mate-pro-admin.html`** — the founder's FFAR verification page. Not urgently needed on mobile; web works fine on a phone browser.
- **`supabase/functions/mate-pro-chat/index.ts`** — chat function with tool-use loop, persona routing, and formatting constraints. Reference for expected request/response shape.
- **`supabase/functions/mate-pro-video-analyse/index.ts`** — vision function.
- **`supabase/functions/_shared/mate-personas-agent.ts`** — the agent-side Legal SKILL.md v1.0 (do NOT modify).
- **`supabase/functions/_shared/mate-personas.ts`** — the four player-side personas (also do NOT modify — used with overlay for Coach/Analyst/Concierge on agent side).
- **`supabase/functions/_shared/fifa-countries.ts`** — the 211-item FIFA member list for the country dropdown.
- **`db/pddr/0005_mate_pro_init.sql` + `0007_mate_pro_billing.sql`** — full schema.
- **`MATE_PRO_SUPABASE_SPEC_v1.md`** at the root — the original spec, still authoritative for the philosophy even where implementation details drifted.

---

## 13. Things the founder cares about

- **Do not break Players.** The mobile Player flow is live and working. Every change is additive.
- **The four sub-agent personas are sacred.** Do not edit the persona text on mobile. If output looks wrong, fix the overlay or the wrapping, not the underlying SKILL.md.
- **Race engineer voice** in every screen title, empty state, and error message. Quiet. Precise. No exclamation marks.
- **Founding 100 is a real promotion**, not just a badge. The €149 vs €299 decision has meaningful revenue implications — get the eligibility logic right and mirror what the server decides. Never fake or override.
- **iOS App Store 30%** is a real business consideration for billing on mobile. Discuss before implementing in-app purchases.

---

## 14. Founder's setup for you

The mobile repo is at `~/Documents/AI agents/talent-mates-mobile/`. Same Supabase env vars as before. No new secrets needed. The founder's account is `vitaliylomov@gmail.com`, Founding Agent #1, subscription trialing (cancel_at_period_end scheduled). Use this account for end-to-end testing — you already have a rich profile, a client (Yehor Lomov), a real subscription in trialing state, and a verified FFAR licence.

---

## 15. Open questions to raise with founder before you start

1. **iOS billing** — hide Subscribe on iOS, or go through in-app purchases with 30% cut?
2. **Frame extraction** — Path C (photo library picker) for MVP, or invest in Path A/B?
3. **Push notifications** — send trial-ending alerts and payment-failed alerts via Expo Push, or defer to email?
4. **PostHog analytics** — you already have `posthog-react-native` in dependencies. Track Agent-flow events too (agent_registered, ffar_pending, subscribe_started, subscribe_completed, cancel_initiated)?
5. **Deep linking** — `matemobile://` URL scheme is registered. Should Stripe Checkout success URL redirect back to the app via deep link, or leave the user in the web dashboard after subscribe?

---

## 16. What "done" looks like for Sprint 1

By end of Sprint 1, the founder should be able to open TestFlight on his iPhone, tap Agent, register a fresh account, add Yehor as a client, ask a Legal question, and see the same scout-grade Markdown response he sees on the web — inside the app, in under 60 seconds total. No web browser opened, no fallbacks. That's the vertical slice that proves the mobile Agent surface exists.

Everything else is polish.

---

*End of briefing. Any changes to the shared backend (`mate-pro-*` edge functions, `mate_pro_*` tables) must be coordinated with the web session — the founder will ferry updates. When you deploy a mobile release that depends on a new server behaviour, tell the founder to sync with the web repo.*
