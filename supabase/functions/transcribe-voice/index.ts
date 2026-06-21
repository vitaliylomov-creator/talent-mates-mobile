// Supabase Edge Function: transcribe-voice
//
// Proxies an uploaded audio file to OpenAI Whisper using the OPENAI_API_KEY
// already configured in this project's Supabase secrets (shared with the
// embeddings pipeline). Keeps the key server-side — mobile bundle never
// sees it.
//
// Request:  multipart/form-data
//   audio:    file (m4a / wav / mp3 / mp4)
//   language: optional ISO-639-1 ('en' / 'uk' / 'ru' ...) — improves accuracy
//
// Response: { text: string, language: string }
//
// Deploy:
//   cd "/Users/vitalijlomov/Documents/AI agents/talent-mates-mobile"
//   supabase functions deploy transcribe-voice --project-ref zlkzjeaojpxzccpovygk
//
// Required secrets (already set per mate-ai-context skill):
//   OPENAI_API_KEY

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  // Verify the Supabase user. We don't need the user record — just confirm
  // the request comes from an authenticated session.
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'missing authorization' }), { status: 401, headers: jsonHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers: jsonHeaders });
  }

  // Read the uploaded audio file from multipart body.
  let form: FormData;
  try {
    form = await req.formData();
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'expected multipart/form-data' }), { status: 400, headers: jsonHeaders });
  }

  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return new Response(JSON.stringify({ error: 'audio file required' }), { status: 400, headers: jsonHeaders });
  }

  // Reject anything too small (likely an accidental tap) or too large (Whisper
  // limit is 25 MB; we cap lower to keep round-trips snappy on mobile).
  const MAX_BYTES = 12 * 1024 * 1024; // 12 MB ~= 10 min of m4a
  if (audio.size < 1024) {
    return new Response(JSON.stringify({ error: 'audio too short' }), { status: 400, headers: jsonHeaders });
  }
  if (audio.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'audio too large' }), { status: 413, headers: jsonHeaders });
  }

  const language = (form.get('language') as string | null) ?? undefined;

  // Forward to OpenAI Whisper.
  const whisperForm = new FormData();
  whisperForm.append('file', audio, audio.name || 'voice.m4a');
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('response_format', 'verbose_json');
  if (language) whisperForm.append('language', language);

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: whisperForm,
  });

  if (!whisperRes.ok) {
    const text = await whisperRes.text();
    console.error('[transcribe-voice] Whisper error', whisperRes.status, text);
    return new Response(
      JSON.stringify({ error: `transcription failed (${whisperRes.status})` }),
      { status: 502, headers: jsonHeaders },
    );
  }

  const payload = await whisperRes.json();
  return new Response(
    JSON.stringify({
      text: (payload.text ?? '').trim(),
      language: payload.language ?? language ?? null,
    }),
    { status: 200, headers: jsonHeaders },
  );
});
