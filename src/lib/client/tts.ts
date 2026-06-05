/**
 * Client-side TTS helper. Posts to /api/audio/tts and plays the returned mp3.
 *
 * Caches per-utterance Blob URL with a hard cap (LRU-ish) so we don't leak
 * memory if a session generates dozens of distinct phrases.
 */

const MAX_CACHE_ENTRIES = 30;
const cache = new Map<string, string>();   // Map preserves insertion order → LRU eviction.

export async function playTTS(text: string, kidId: string): Promise<void> {
  const key = `${kidId}::${text}`;
  let url = cache.get(key);

  if (url) {
    // Refresh recency: delete + re-set
    cache.delete(key);
    cache.set(key, url);
  } else {
    const res = await fetch("/api/audio/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, kidId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "TTS failed");
    }
    const buf = await res.arrayBuffer();
    url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));

    // Evict oldest if cache full.
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        const old = cache.get(oldestKey);
        if (old) URL.revokeObjectURL(old);
        cache.delete(oldestKey);
      }
    }
    cache.set(key, url);
  }

  const audio = new Audio(url);
  await audio.play().catch(() => { /* user gesture required */ });
}

/** Manually drop all cached audio. Call on logout / kid switch. */
export function clearTTSCache(): void {
  for (const url of cache.values()) URL.revokeObjectURL(url);
  cache.clear();
}
