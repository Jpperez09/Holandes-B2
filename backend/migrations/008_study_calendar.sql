-- migrations/008_study_calendar.sql
-- What Today proposes on each weekday (docs/SPEC_2026-10_v2.md, P5):
--   Mon, Tue, Thu, Fri  the next standard module
--   Sat                 the week's review module (MOD-101 on 2026-10-03, MOD-102 a week later, ...)
--   Wed, Sun            only the word review, with the line "Hoy toca portugués"
-- Editable through PATCH /api/settings; the app falls back to this default if the
-- row is ever missing or a day is left out. Forward-only.

INSERT OR IGNORE INTO settings (key, value) VALUES ('study_calendar', '{"mon":"module","tue":"module","wed":"review-only","thu":"module","fri":"module","sat":"weekly-review","sun":"review-only","review_only_note":"Hoy toca portugués","weekly_review_start":"2026-10-03"}');
