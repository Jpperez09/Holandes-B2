import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { VocabItem } from '../api/types';
import { useApi } from '../hooks/useApi';
import { AsyncView, EmptyState } from '../components/ui';
import { speakDutch, ttsAvailable } from '../lib/tts';

type Phase = 'start' | 'reviewing' | 'done';

const GRADES: { grade: 1 | 2 | 3 | 4; label: string; cls: string }[] = [
  { grade: 1, label: 'Again', cls: 'grade-btn--again' },
  { grade: 2, label: 'Hard', cls: 'grade-btn--hard' },
  { grade: 3, label: 'Good', cls: 'grade-btn--good' },
  { grade: 4, label: 'Easy', cls: 'grade-btn--easy' },
];

export function Review(): React.JSX.Element {
  const { data, error, loading, reload } = useApi(
    () => endpoints.getDueVocabulary(),
    [],
  );

  return (
    <AsyncView loading={loading} error={error} data={data} onRetry={reload}>
      {(cards) => <ReviewSession initialCards={cards} />}
    </AsyncView>
  );
}

function ReviewSession({
  initialCards,
}: {
  initialCards: VocabItem[];
}): React.JSX.Element {
  const cards = useMemo(() => initialCards, [initialCards]);
  const [phase, setPhase] = useState<Phase>('start');
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const shownAt = useRef<number>(Date.now());

  const card = cards[idx];

  const speak = useCallback(() => {
    if (card) speakDutch(card.tts_text || card.lemma);
  }, [card]);

  // Auto-play audio when a new card appears.
  useEffect(() => {
    if (phase === 'reviewing' && card) {
      shownAt.current = Date.now();
      speak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  const reveal = useCallback(() => setRevealed(true), []);

  const grade = useCallback(
    async (g: 1 | 2 | 3 | 4) => {
      if (!card || submitting) return;
      setSubmitting(true);
      setSaveError(null);
      const elapsed = Math.round((Date.now() - shownAt.current) / 1000);
      try {
        await endpoints.reviewVocabulary(card.id, g, elapsed);
        setReviewedCount((c) => c + 1);
        if (idx + 1 >= cards.length) {
          setPhase('done');
        } else {
          setIdx((i) => i + 1);
          setRevealed(false);
        }
      } catch (err) {
        setSaveError(
          err instanceof ApiError
            ? "That didn't save — try grading the card again."
            : 'Could not save that review.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [card, submitting, idx, cards.length],
  );

  // Keyboard shortcuts: Space reveals, 1-4 grade.
  useEffect(() => {
    if (phase !== 'reviewing') return;
    function onKey(e: KeyboardEvent): void {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!revealed) reveal();
        return;
      }
      if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        void grade(Number(e.key) as 1 | 2 | 3 | 4);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, revealed, reveal, grade]);

  // --- Empty: nothing due ---
  if (cards.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No words to review right now"
        message="Nice — you're all caught up. New words arrive as you work through your modules."
        action={
          <Link className="btn btn--primary" to="/learn">
            Go to your modules
          </Link>
        }
      />
    );
  }

  // --- Start screen ---
  if (phase === 'start') {
    return (
      <div className="review-wrap">
        <h1 className="page-title">Vocabulary review</h1>
        <div className="card center">
          <div style={{ fontSize: '2.2rem' }}>🔁</div>
          <p>
            <strong>
              {cards.length} word{cards.length === 1 ? '' : 's'}
            </strong>{' '}
            ready for you today.
          </p>
          <p className="muted">
            About {Math.max(1, Math.ceil(cards.length * 0.5))} minutes.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--big"
            onClick={() => setPhase('reviewing')}
          >
            ▶ Start review
          </button>
        </div>
        <div className="card card--tint mt-m">
          <strong>Why review?</strong>
          <p className="mb-0 muted mt-s">
            Bringing a word back from memory — not just re-reading it — is what
            makes it stick. <Link to="/library">Read why →</Link>
          </p>
        </div>
      </div>
    );
  }

  // --- Done screen ---
  if (phase === 'done') {
    return (
      <EmptyState
        icon="🎉"
        title={`All done — ${reviewedCount} word${
          reviewedCount === 1 ? '' : 's'
        } reviewed today`}
        message="Lovely work. Those words are now scheduled to come back at just the right time."
        action={
          <Link className="btn btn--primary" to="/today">
            Back to today
          </Link>
        }
      />
    );
  }

  // --- Reviewing a card ---
  if (!card) {
    return <EmptyState icon="✅" title="All done for today" />;
  }

  const front = card.article ? `${card.article} ${card.lemma}` : card.lemma;

  return (
    <div className="review-wrap">
      <div className="flashcard">
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="flashcard__word">{front}</span>
          <button
            type="button"
            className="audio-btn"
            onClick={speak}
            title={
              ttsAvailable()
                ? 'Hear it in Dutch'
                : 'Audio is not available on this device'
            }
            aria-label="Play pronunciation"
          >
            🔊
          </button>
        </div>
        {card.ipa && <div className="flashcard__ipa">{card.ipa}</div>}

        {!revealed ? (
          <button
            type="button"
            className="btn btn--primary mt-l"
            onClick={reveal}
          >
            Show answer
          </button>
        ) : (
          <>
            <hr className="flashcard__divider" />
            <div className="flashcard__answer">
              {card.translation_en ?? '—'}
            </div>
            {card.example && (
              <div className="flashcard__example">"{card.example}"</div>
            )}
            {card.translation_es && (
              <div className="flashcard__es">ES: {card.translation_es}</div>
            )}
          </>
        )}
      </div>

      {revealed && (
        <>
          <p className="center muted mt-m" style={{ marginBottom: 6 }}>
            How did that feel?
          </p>
          <div className="grade-row">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                type="button"
                className={`grade-btn ${g.cls}`}
                onClick={() => void grade(g.grade)}
                disabled={submitting}
              >
                {g.label}
                <small>{g.grade}</small>
              </button>
            ))}
          </div>
        </>
      )}

      {saveError && <p className="form-msg form-msg--err center">{saveError}</p>}

      <p className="review-count">
        Card {idx + 1} of {cards.length}
        {!revealed ? ' · press Space to reveal' : ' · press 1–4 to grade'}
      </p>
    </div>
  );
}
