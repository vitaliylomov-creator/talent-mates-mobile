// Portable UUID that works even when the browser's Web Crypto is unavailable
// (Safari over plain http:// is not a "secure context" and refuses to expose
// crypto.randomUUID). Native iOS/Android via expo-crypto uses the OS random
// source; browser secure contexts use built-in crypto.randomUUID; everything
// else falls back to Math.random, which is fine for optimistic-UI ids that
// only need to be unique inside a single client session.

export function newId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const fn = g.crypto?.randomUUID;
  if (typeof fn === 'function') {
    try { return fn.call(g.crypto); } catch { /* fall through */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
