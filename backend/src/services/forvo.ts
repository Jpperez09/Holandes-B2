// Link to native-speaker recordings on Forvo, kept in its own column
// (vocabulary_items.forvo_url) — audio_url is reserved for playable files.
//
// Pattern: https://forvo.com/word/<word>/#nl
// Single words only; phrases get no link. Forvo word pages use lowercase slugs.
// NOTE: Forvo answers 403 to automated requests, so individual pages cannot be
// verified from here; the pattern is the one given in the project spec.

const SINGLE_WORD_RE = /^[\p{L}][\p{L}'’-]*$/u;

export function forvoUrl(lemma: string, pos?: string | null): string | null {
  const word = lemma.trim();
  if (pos === 'phrase' || !SINGLE_WORD_RE.test(word)) return null;
  return `https://forvo.com/word/${encodeURIComponent(word.toLowerCase())}/#nl`;
}
