import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseDialogue } from '../../frontend/src/lib/dialogue';
import {
  isDutch,
  listDutchVoices,
  onlyFlemishVoices,
  pickDutchVoice,
  voiceId,
  type VoiceLike,
} from '../../frontend/src/lib/dutchVoice';
import { splitModuleBody } from '../../frontend/src/lib/moduleBody';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';

// docs/SPEC_2026-10_v2.md, P2: the Dutch voice must be nl-NL, not the first "nl".

const v = (name: string, lang: string): VoiceLike => ({ name, lang, voiceURI: name });

describe('pickDutchVoice', () => {
  it('picks nl-NL even when an nl-BE voice comes first in the list (the bug)', () => {
    const voices = [
      v('Google US English', 'en-US'),
      v('Microsoft Arnaud Online (Natural) - Dutch (Belgium)', 'nl-BE'),
      v('Microsoft Frank - Dutch (Netherlands)', 'nl-NL'),
    ];
    expect(pickDutchVoice(voices)?.lang).toBe('nl-NL');
    expect(pickDutchVoice(voices)?.name).toContain('Frank');
  });

  it('prefers a Natural / Online voice inside nl-NL', () => {
    const voices = [
      v('Microsoft Frank - Dutch (Netherlands)', 'nl-NL'),
      v('Microsoft Colette Online (Natural) - Dutch (Netherlands)', 'nl-NL'),
      v('Microsoft Maarten Online - Dutch (Netherlands)', 'nl-NL'),
    ];
    expect(pickDutchVoice(voices)?.name).toContain('Colette');
    expect(pickDutchVoice(voices.slice().reverse())?.name).toContain('Maarten'); // first Natural/Online in list order
  });

  it('a plain nl-NL voice beats a Natural nl-BE voice (the region comes first)', () => {
    const voices = [v('Arnaud Online (Natural)', 'nl-BE'), v('Frank', 'nl-NL')];
    expect(pickDutchVoice(voices)?.name).toBe('Frank');
  });

  it('keeps the order of the list when nothing else tells two nl-NL voices apart', () => {
    const voices = [v('Voice B', 'nl-NL'), v('Voice A', 'nl-NL')];
    expect(pickDutchVoice(voices)?.name).toBe('Voice B');
  });

  it('falls back to nl-BE only when there is no nl-NL at all', () => {
    const voices = [v('Google US English', 'en-US'), v('Xander', 'nl-BE')];
    expect(pickDutchVoice(voices)?.lang).toBe('nl-BE');
    expect(onlyFlemishVoices(voices)).toBe(true);
    expect(onlyFlemishVoices([...voices, v('Frank', 'nl-NL')])).toBe(false);
  });

  it('puts a bare "nl" voice between nl-NL and nl-BE, and understands nl_NL (Android)', () => {
    expect(pickDutchVoice([v('B', 'nl-BE'), v('Bare', 'nl')])?.name).toBe('Bare');
    expect(pickDutchVoice([v('Bare', 'nl'), v('Android', 'nl_NL')])?.name).toBe('Android');
  });

  it('returns null when the system has no Dutch voice, and ignores other languages', () => {
    expect(pickDutchVoice([])).toBeNull();
    expect(pickDutchVoice([v('Anna', 'de-DE'), v('Nora', 'nb-NO')])).toBeNull();
    expect(isDutch(v('x', 'nb-NO'))).toBe(false);
  });

  it('honours the voice chosen in Settings while it is installed, even an nl-BE one', () => {
    const voices = [v('Frank', 'nl-NL'), v('Xander', 'nl-BE')];
    expect(pickDutchVoice(voices, voiceId(voices[1]))?.name).toBe('Xander');
    expect(pickDutchVoice(voices, 'a voice that was uninstalled')?.name).toBe('Frank');
    expect(pickDutchVoice(voices, null)?.name).toBe('Frank');
  });

  it('lists the voices of the Settings selector best first: nl-NL (Natural first), then the rest', () => {
    const voices = [
      v('Xander', 'nl-BE'),
      v('English', 'en-GB'),
      v('Frank', 'nl-NL'),
      v('Colette Online (Natural)', 'nl-NL'),
    ];
    expect(listDutchVoices(voices).map((x) => x.name)).toEqual(['Colette Online (Natural)', 'Frank', 'Xander']);
  });
});

describe('parseDialogue', () => {
  it('separates the speaker from what is said, so the voice does not read "Anna:"', () => {
    expect(parseDialogue('Anna: Hallo Juan!\nJuan: Hallo, Anna. Hoe gaat het?\n')).toEqual([
      { speaker: 'Anna', text: 'Hallo Juan!' },
      { speaker: 'Juan', text: 'Hallo, Anna. Hoe gaat het?' },
    ]);
  });

  it('keeps a monologue as plain lines, even if a line has a colon', () => {
    const lines = parseDialogue('Hallo! Goedemorgen, mevrouw.\nIk leer: nul, een, twee.\n\nTot ziens!');
    expect(lines.map((l) => l.speaker)).toEqual([null, null, null]);
    expect(lines[1].text).toBe('Ik leer: nul, een, twee.');
  });

  it('handles Windows line endings and blank lines', () => {
    expect(parseDialogue('A: Hoi\r\n\r\nB: Hallo\r\n').map((l) => l.text)).toEqual(['Hoi', 'Hallo']);
  });
});

describe('every dialogue block in the curriculum can be read aloud', () => {
  let reader: VaultReader;
  beforeAll(async () => {
    reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
    await reader.start();
  });
  afterAll(async () => {
    await reader.stop();
  });

  it('parses every block of every listening section into non-empty lines with no speaker label left in the text', () => {
    let blocks = 0;
    for (const m of reader.snapshot().modules) {
      for (const s of splitModuleBody(m.body).filter((x) => /listening/i.test(x.title))) {
        const text = [s.intro, ...s.items.map((i) => i.markdown)].join('\n');
        for (const [, code] of text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
          blocks += 1;
          const lines = parseDialogue(code);
          expect(lines.length, `${m.module_id} block`).toBeGreaterThan(1);
          for (const line of lines) {
            expect(line.text.length, m.module_id).toBeGreaterThan(0);
            expect(line.text, `${m.module_id}: ${line.text}`).not.toMatch(/^[A-Z][a-z]+:\s/);
          }
        }
      }
    }
    expect(blocks).toBeGreaterThanOrEqual(28);
  });
});
