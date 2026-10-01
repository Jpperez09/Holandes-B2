// Which voice speaks the Dutch. Pure functions (no browser APIs) so they can be tested.
//
// Juanpa studies Netherlands Dutch, but browsers often list nl-BE (Flemish)
// voices first, and "the first voice that starts with nl" lands on one of them.
// Preference, best first (docs/SPEC_2026-10_v2.md, P2):
//   1. nl-NL exactly;
//   2. inside nl-NL, names that contain "Natural" or "Online";
//   3. nl-BE only when there is no nl-NL at all.
// A bare "nl" voice (no region) and other nl-XX voices sit between 1 and 3.

export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI?: string;
}

/** "nl_NL" (Android) and "nl-nl" both become "nl-nl". */
const normalise = (lang: string): string => lang.replace('_', '-').toLowerCase();

export const isDutch = (v: VoiceLike): boolean => normalise(v.lang).startsWith('nl');
const isNatural = (v: VoiceLike): boolean => /natural|online/i.test(v.name);

/** Stable id for remembering a voice: the URI when there is one, else the name. */
export const voiceId = (v: VoiceLike): string => v.voiceURI || v.name;

/** 0 = nl-NL, 1 = bare nl, 2 = other nl-XX, 3 = nl-BE. */
function region(v: VoiceLike): 0 | 1 | 2 | 3 {
  const lang = normalise(v.lang);
  if (lang === 'nl-nl') return 0;
  if (lang === 'nl') return 1;
  if (lang === 'nl-be') return 3;
  return 2;
}

/** The Dutch voices of the list, best first (the order of the list breaks ties). */
export function listDutchVoices<T extends VoiceLike>(voices: readonly T[]): T[] {
  return voices
    .map((voice, index) => ({ voice, index }))
    .filter(({ voice }) => isDutch(voice))
    .sort(
      (a, b) =>
        region(a.voice) - region(b.voice) ||
        Number(!isNatural(a.voice)) - Number(!isNatural(b.voice)) ||
        a.index - b.index,
    )
    .map(({ voice }) => voice);
}

/**
 * The voice to speak with: the one the learner chose in Settings if it is still
 * installed, otherwise the best Dutch voice by the order above. Null when the
 * system has no Dutch voice at all.
 */
export function pickDutchVoice<T extends VoiceLike>(
  voices: readonly T[],
  preferredId?: string | null,
): T | null {
  const dutch = listDutchVoices(voices);
  if (preferredId) {
    const chosen = dutch.find((v) => voiceId(v) === preferredId);
    if (chosen) return chosen;
  }
  return dutch[0] ?? null;
}

/** True when the only Dutch voices are Flemish: worth telling the learner. */
export function onlyFlemishVoices(voices: readonly VoiceLike[]): boolean {
  const dutch = listDutchVoices(voices);
  return dutch.length > 0 && dutch.every((v) => region(v) === 3);
}
