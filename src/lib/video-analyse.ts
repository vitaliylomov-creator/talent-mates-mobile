import { supabase, SUPABASE } from './supabase';
import { newId } from './uuid';

export type VideoFocus = 'positioning' | 'technical' | 'decisions' | 'physical';

export interface VideoAnalyseRequest {
  conversation_id: string | null;
  client_id: string | null;
  frame_paths: string[];
  focus: VideoFocus;
  question?: string;
  filename: string;
  duration_sec: number;
}

export interface VideoAnalyseResponse {
  video_analysis_id: string;
  status: 'complete';
  result_text: string;
  message_id?: string;
  frames_used: number;
  input_tokens: number;
  output_tokens: number;
}

// Claude Vision supports JPEG / PNG / WebP / GIF and does strict
// media-type sniffing — declared type must match the bytes. Detect
// per-asset so a mixed roll (screenshot PNG + camera JPG) still works.
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
};

function pickMimeType(asset: { uri: string; mimeType?: string | null; fileName?: string | null }): string {
  if (asset.mimeType && EXT_BY_MIME[asset.mimeType]) return asset.mimeType;
  const src = (asset.fileName ?? asset.uri).toLowerCase();
  if (src.endsWith('.png'))                   return 'image/png';
  if (src.endsWith('.webp'))                  return 'image/webp';
  if (src.endsWith('.gif'))                   return 'image/gif';
  return 'image/jpeg'; // default — .jpg / .jpeg / no extension
}

/**
 * Upload a single frame from a local URI to the mate-pro-frames bucket at
 * {agent_id}/{va_id}/frame_{NNN}.{ext}. Returns the storage path on success.
 *
 * React Native's fetch → arrayBuffer path is more reliable than fetch → blob
 * (the latter has stalled on iOS in past Expo versions).
 */
export async function uploadFrame(
  agentId: string,
  vaId: string,
  frameIndex: number,
  asset: { uri: string; mimeType?: string | null; fileName?: string | null },
): Promise<string> {
  const mime = pickMimeType(asset);
  const ext = EXT_BY_MIME[mime] ?? 'jpg';
  const path = `${agentId}/${vaId}/frame_${String(frameIndex).padStart(3, '0')}.${ext}`;

  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`Read local frame: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('mate-pro-frames')
    .upload(path, arrayBuffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) throw new Error(`Upload frame ${frameIndex}: ${error.message}`);
  return path;
}

/**
 * Generate a fresh video_analysis_id client-side so we know the storage
 * folder before uploading anything. The edge function reuses this id when
 * it inserts the mate_pro_video_analyses row.
 */
export function newVideoAnalysisId(): string {
  return newId();
}

/**
 * Call the edge function once every frame is uploaded. Returns after 30–45s
 * with a ready-to-render result_text (Markdown).
 */
export async function callVideoAnalyse(req: VideoAnalyseRequest): Promise<VideoAnalyseResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE.URL}/functions/v1/mate-pro-video-analyse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE.ANON_KEY,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mate-pro-video-analyse ${res.status}: ${text}`);
  }
  return res.json();
}
