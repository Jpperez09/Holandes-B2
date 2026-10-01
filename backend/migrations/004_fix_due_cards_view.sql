-- migrations/004_fix_due_cards_view.sql
-- Fix: cards that came due earlier today were hidden until the next UTC day.
--
-- The old view compared json_extract(fsrs_state, '$.due') (ISO-8601, e.g.
-- '2026-09-30T10:00:00.000Z') against datetime('now') ('2026-09-30 22:40:47')
-- as text. 'T' sorts after ' ', so a card due at 10:00Z was "not yet due" at
-- 22:40Z the same day. Normalise both sides with datetime() so the comparison
-- is chronological. Forward-only.

DROP VIEW IF EXISTS v_due_cards;

CREATE VIEW v_due_cards AS
SELECT *
FROM vocabulary_items
WHERE status != 'suspended'
  AND status != 'archived'
  AND datetime(json_extract(fsrs_state, '$.due')) <= datetime('now');
