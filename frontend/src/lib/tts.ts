// Browser text-to-speech for Dutch, using the Web Speech API.
// Approved for MVP (Juanpa decision 6). Never throws: if no voice is found
// the call falls back to the default voice and a console warning is logged.

import {
  listDutchVoices,
  pickDutchVoice,
  voiceId,
  type VoiceLike,
} from './dutchVoice';

export { pickDutchVoice, voiceId };

const VOICE_KEY = 'dutchb2.ttsVoice';
const RATE_KEY = 'dutchb2.ttsRate';

/** Speeds offered for the dialogues. */
export const SPEED_OPTIONS = [0.8, 1] as const;
export type Speed = (typeof SPEED_OPTIONS)[number];

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage may be unavailable
  }
}

function writeStored(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable; ignore */
  }
}

/** The voice the learner chose in Settings (voices differ per browser, so it is kept here). */
export const getPreferredVoiceId = (): string | null => readStored(VOICE_KEY);
export const setPreferredVoiceId = (id: string | null): void => writeStored(VOICE_KEY, id || null);

/** Dialogue speed: slow (0.8x) unless the learner picked normal. */
export function getDialogueSpeed(): Speed {
  return readStored(RATE_KEY) === '1' ? 1 : 0.8;
}
export const setDialogueSpeed = (speed: Speed): void => writeStored(RATE_KEY, String(speed));

/** Dutch voices installed in this browser, best first. */
export function dutchVoices(): SpeechSynthesisVoice[] {
  if (!ttsAvailable()) return [];
  return listDutchVoices(window.speechSynthesis.getVoices());
}

/** The voice that will speak: the learner's choice, else the best nl-NL voice. */
export function currentDutchVoice(): SpeechSynthesisVoice | null {
  if (!ttsAvailable()) return null;
  return pickDutchVoice(window.speechSynthesis.getVoices(), getPreferredVoiceId());
}

/** Voices load asynchronously in some browsers: call back when the list changes. */
export function onVoicesChanged(callback: () => void): () => void {
  if (!ttsAvailable()) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', callback);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', callback);
}

// Every call to speak bumps this. A callback from an utterance that was
// cancelled by a newer one sees an older number and stops instead of going on.
let generation = 0;

function makeUtterance(text: string, rate: number): SpeechSynthesisUtterance {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'nl-NL';
  utter.rate = rate;
  const voice = currentDutchVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    console.warn('[tts] No Dutch voice found on this system — using the default voice.');
  }
  return utter;
}

/** Speak a Dutch word/phrase. Safe to call even when TTS is unavailable. */
export function speakDutch(text: string, rate = 0.92): void {
  if (!text || !ttsAvailable()) return;
  try {
    generation += 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(makeUtterance(text, rate));
  } catch (err) {
    console.warn('[tts] Speech synthesis failed:', err);
  }
}

export interface SpeakLinesOptions {
  rate?: number;
  /** The line being spoken now, or null when playback ends. */
  onLine?: (index: number | null) => void;
  onDone?: () => void;
}

/**
 * Speak the lines one after another. Returns a function that stops playback.
 * Starting something else (another dialogue, a review card) ends this one.
 */
export function speakLines(lines: readonly string[], options: SpeakLinesOptions = {}): () => void {
  const { rate = 0.8, onLine, onDone } = options;
  if (!ttsAvailable() || lines.length === 0) {
    onDone?.();
    return () => {};
  }
  generation += 1;
  const mine = generation;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    onLine?.(null);
    onDone?.();
  };

  const play = (i: number) => {
    if (mine !== generation || i >= lines.length) return finish();
    onLine?.(i);
    const utter = makeUtterance(lines[i], rate);
    utter.onend = () => play(i + 1);
    utter.onerror = finish; // also fires when something cancels this utterance
    try {
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn('[tts] Speech synthesis failed:', err);
      finish();
    }
  };

  try {
    window.speechSynthesis.cancel();
  } catch {
    /* nothing to cancel */
  }
  play(0);

  return () => {
    if (mine === generation) generation += 1;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    finish();
  };
}

export type { VoiceLike };
