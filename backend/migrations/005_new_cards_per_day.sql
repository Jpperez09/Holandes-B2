-- migrations/005_new_cards_per_day.sql
-- Daily cap on brand-new vocabulary cards served by GET /api/vocabulary/due.
-- Editable in Settings; the app falls back to 10 if the row is ever missing.
-- Forward-only.

INSERT OR IGNORE INTO settings (key, value) VALUES ('new_cards_per_day', '10');
