-- migrations/002_seed_settings.sql
-- Seed the default user and settings.
-- Forward-only. Never edit after merge.

INSERT OR IGNORE INTO users (id, name, native_language, target_language, target_level)
VALUES (1, 'Juanpa', 'es', 'nl', 'B2');

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('vault_path',              ''),
  ('user_name',               'Juanpa'),
  ('daily_goal_minutes',      '60'),
  ('ui_language',             'en'),
  ('current_level',           '1'),
  ('target_level',            '100'),
  ('fsrs_request_retention',  '0.9'),
  ('fsrs_maximum_interval',   '36500'),
  ('daily_new_card_budget',   '15');
