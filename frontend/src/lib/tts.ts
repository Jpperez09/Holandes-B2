// Browser text-to-speech for Dutch vocabulary, using the Web Speech API.
// Approved for MVP (Juanpa decision 6). Never throws: if no voice is found
// the call is a no-op and a console warning is logged.

let cachedDutchVoice: SpeechSynthesisVoice | null | undefined;

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickDutchVoice(): SpeechSynthesisVoice | null {
  if (cachedDutchVoice !== undefined) return cachedDutchVoice;
  if (!ttsAvailable()) {
    cachedDutchVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const dutch =
    voices.find((v) => v.lang?.toLowerCase().startsWith('nl')) ?? null;
  // Cache only once voices have actually loaded.
  if (voices.length > 0) cachedDutchVoice = dutch;
  return dutch;
}

// Voices load asynchronously in some browsers — refresh the cache when ready.
if (ttsAvailable()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedDutchVoice = undefined;
    pickDutchVoice();
  };
}

/** Speak a Dutch word/phrase. Safe to call even when TTS is unavailable. */
export function speakDutch(text: string): void {
  if (!text || !ttsAvailable()) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'nl-NL';
    utter.rate = 0.92;
    const voice = pickDutchVoice();
    if (voice) {
      utter.voice = voice;
    } else {
      console.warn(
        '[tts] No Dutch voice found on this system — using the default voice.',
      );
    }
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn('[tts] Speech synthesis failed:', err);
  }
}
