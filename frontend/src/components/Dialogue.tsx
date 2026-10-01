import React, { useEffect, useMemo, useRef, useState } from 'react';
import { parseDialogue } from '../lib/dialogue';
import {
  SPEED_OPTIONS,
  getDialogueSpeed,
  setDialogueSpeed,
  speakLines,
  ttsAvailable,
  type Speed,
} from '../lib/tts';

/**
 * A module dialogue (or monologue) with audio: play it whole or one line at a
 * time, at 0.8x or 1x. The voice is the one chosen in Settings (nl-NL by default).
 */
export function Dialogue({ code }: { code: string }): React.JSX.Element {
  const lines = useMemo(() => parseDialogue(code), [code]);
  const [speed, setSpeed] = useState<Speed>(getDialogueSpeed);
  const [playing, setPlaying] = useState<'all' | 'line' | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const audio = ttsAvailable();

  // Leaving the page (or showing another module) silences it.
  useEffect(() => () => stopRef.current?.(), []);

  function stop(): void {
    stopRef.current?.();
    stopRef.current = null;
  }

  function playAll(): void {
    stop();
    setPlaying('all');
    stopRef.current = speakLines(
      lines.map((l) => l.text),
      {
        rate: speed,
        onLine: setActive,
        onDone: () => {
          setPlaying(null);
          setActive(null);
        },
      },
    );
  }

  function playLine(index: number): void {
    stop();
    setPlaying('line');
    stopRef.current = speakLines([lines[index].text], {
      rate: speed,
      onLine: (i) => setActive(i === null ? null : index),
      onDone: () => {
        setPlaying(null);
        setActive(null);
      },
    });
  }

  function chooseSpeed(next: Speed): void {
    setSpeed(next);
    setDialogueSpeed(next);
  }

  return (
    <div className="dialogue">
      {audio ? (
        <div className="dialogue__bar">
          <button
            type="button"
            className="btn btn--primary dialogue__all"
            onClick={playing === 'all' ? stop : playAll}
          >
            {playing === 'all' ? '■ Detener' : '▶ Escuchar todo'}
          </button>
          <div className="dialogue__speed" role="group" aria-label="Velocidad">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={'speed-btn' + (speed === s ? ' is-on' : '')}
                aria-pressed={speed === s}
                onClick={() => chooseSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="faint dialogue__note">
          Este navegador no tiene voz de lectura: el audio no está disponible.
        </p>
      )}
      <div className="dialogue__lines">
        {lines.map((line, i) => (
          <div
            key={i}
            className={'dialogue__line' + (active === i ? ' is-active' : '')}
          >
            {audio && (
              <button
                type="button"
                className="dialogue__play"
                aria-label={`Escuchar la línea ${i + 1}`}
                onClick={() => playLine(i)}
              >
                ▶
              </button>
            )}
            <span className="dialogue__text">
              {line.speaker && (
                <b className="dialogue__speaker">{line.speaker}: </b>
              )}
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
