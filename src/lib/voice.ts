import { supabase, SUPABASE } from './supabase';

const TRANSCRIBE_ENDPOINT = `${SUPABASE.URL}/functions/v1/transcribe-voice`;

export interface TranscribeResult {
  text: string;
  language?: string;
}

/**
 * Upload a recorded audio file to the transcribe-voice edge function,
 * which proxies to OpenAI Whisper using OPENAI_API_KEY from Supabase
 * secrets. The function returns the transcribed text.
 *
 * Input: a `file://` URI from expo-audio's recording flow.
 */
export async function transcribeRecording(uri: string, lang?: 'en' | 'ua'): Promise<TranscribeResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const form = new FormData();
  form.append('audio', {
    uri,
    name: 'voice.m4a',
    type: 'audio/m4a',
    // React Native FormData expects this shape — TS dom lib doesn't match.
  } as unknown as Blob);
  if (lang) form.append('language', lang === 'ua' ? 'uk' : 'en');

  const res = await fetch(TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      // Do NOT set Content-Type — let fetch add the multipart boundary.
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`transcribe ${res.status}: ${text}`);
  }
  return res.json();
}
