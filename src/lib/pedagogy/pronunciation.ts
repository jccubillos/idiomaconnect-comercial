/**
 * Pronunciation scoring — MVP version.
 *
 * The Streamlit MVP uses phonemizer + espeak-ng to compare phoneme sequences.
 * That requires a Python runtime. For F0 we use a text-similarity heuristic:
 *
 *   1. Normalize both target and transcript (lowercase, strip punctuation/accents).
 *   2. Compute character-level Levenshtein distance.
 *   3. Apply word-level alignment bonus.
 *
 * Roadmap (F2): spin up a Python microservice on Railway exposing
 * POST /score-pronunciation { target, audio } -> { score, phonemes, miss }.
 */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1).fill(0).map((_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export interface PronunciationScore {
  /** 0..100 — overall score */
  score: number;
  /** 0..1 — character similarity */
  charSimilarity: number;
  /** 0..1 — word match ratio */
  wordMatch: number;
  /** Words in the target that did not appear in the transcript. */
  missingWords: string[];
  feedback: "excellent" | "good" | "fair" | "poor";
}

export function scorePronunciation(target: string, transcript: string): PronunciationScore {
  const t = normalize(target);
  const u = normalize(transcript);

  if (!t) {
    return { score: 0, charSimilarity: 0, wordMatch: 0, missingWords: [], feedback: "poor" };
  }

  const dist = levenshtein(t, u);
  const maxLen = Math.max(t.length, u.length);
  const charSimilarity = maxLen ? Math.max(0, 1 - dist / maxLen) : 0;

  const targetWords = t.split(/\s+/).filter(Boolean);
  const userWords = new Set(u.split(/\s+/).filter(Boolean));
  const matched = targetWords.filter((w) => userWords.has(w));
  const wordMatch = targetWords.length ? matched.length / targetWords.length : 0;
  const missingWords = targetWords.filter((w) => !userWords.has(w));

  // Composite: 60% character similarity + 40% word match
  const score = Math.round((charSimilarity * 0.6 + wordMatch * 0.4) * 100);
  const feedback: PronunciationScore["feedback"] =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor";

  return { score, charSimilarity, wordMatch, missingWords, feedback };
}
