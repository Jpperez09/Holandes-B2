-- migrations/001_init.sql
-- Full schema for progress.sqlite
-- Forward-only. Never edit after merge.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  native_language TEXT NOT NULL DEFAULT 'es',
  target_language TEXT NOT NULL DEFAULT 'nl',
  target_level    TEXT NOT NULL DEFAULT 'B2',
  start_date      TEXT NOT NULL DEFAULT (date('now')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);

CREATE TABLE levels (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  vault_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE modules (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  level_id          INTEGER NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL,
  title             TEXT NOT NULL,
  sort_order        INTEGER NOT NULL,
  vault_path        TEXT NOT NULL,
  checksum          TEXT NOT NULL,
  estimated_minutes INTEGER,
  prerequisites     TEXT,
  tags              TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT,
  UNIQUE(level_id, slug)
);

CREATE TABLE lessons (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id         INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL,
  title             TEXT NOT NULL,
  sort_order        INTEGER NOT NULL,
  vault_path        TEXT NOT NULL,
  checksum          TEXT NOT NULL,
  estimated_minutes INTEGER,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(module_id, slug)
);

CREATE TABLE activities (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id         INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK(type IN ('vocab','grammar','reading','listening','writing','freeform')),
  title             TEXT NOT NULL,
  sort_order        INTEGER NOT NULL,
  payload_json      TEXT NOT NULL,
  vault_path        TEXT,
  estimated_minutes INTEGER,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(lesson_id, slug)
);

CREATE TABLE study_sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  started_at       TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at         TEXT,
  duration_seconds INTEGER,
  notes            TEXT
);

CREATE TABLE activity_attempts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  activity_id      INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  session_id       INTEGER REFERENCES study_sessions(id) ON DELETE SET NULL,
  started_at       TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at     TEXT,
  duration_seconds INTEGER,
  score            REAL,
  self_rating      INTEGER CHECK(self_rating BETWEEN 1 AND 5),
  payload_json     TEXT
);

CREATE INDEX idx_attempts_user_activity ON activity_attempts(user_id, activity_id);
CREATE INDEX idx_attempts_completed_at  ON activity_attempts(completed_at);

CREATE TABLE vocabulary_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  lemma        TEXT NOT NULL,
  article      TEXT,
  language     TEXT NOT NULL DEFAULT 'nl',
  pos          TEXT,
  translation_es TEXT,
  translation_en TEXT,
  ipa          TEXT,
  example      TEXT,
  cognate_en   INTEGER NOT NULL DEFAULT 0,
  cognate_note TEXT,
  source_id    TEXT,
  source_path  TEXT,
  module_id    TEXT,
  level_code   TEXT,
  tags         TEXT,
  audio_path   TEXT,
  audio_url    TEXT,
  tts_text     TEXT,
  fsrs_state   TEXT,
  status       TEXT NOT NULL DEFAULT 'new'
               CHECK(status IN ('new','learning','review','mature','suspended','archived')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT,
  UNIQUE(lemma, language)
);

CREATE INDEX idx_vocab_status ON vocabulary_items(status);
CREATE INDEX idx_vocab_module ON vocabulary_items(module_id);

CREATE TABLE vocabulary_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
  reviewed_at   TEXT NOT NULL DEFAULT (datetime('now')),
  grade         INTEGER NOT NULL CHECK(grade BETWEEN 1 AND 4),
  prev_state    TEXT,
  next_state    TEXT,
  elapsed_seconds INTEGER
);

CREATE INDEX idx_reviews_vocab ON vocabulary_reviews(vocabulary_id);

CREATE TABLE grammar_topics (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  level_code       TEXT,
  vault_path       TEXT,
  module_id        TEXT,
  pienemann_stage  INTEGER,
  notes_json       TEXT,
  mastery          REAL NOT NULL DEFAULT 0.0,
  last_reviewed_at TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT
);

CREATE TABLE skill_scores (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  skill        TEXT NOT NULL CHECK(skill IN ('reading','listening','speaking','writing','vocabulary','grammar')),
  score        REAL NOT NULL,
  cefr_estimate TEXT,
  recorded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_skill_recorded ON skill_scores(skill, recorded_at);

CREATE TABLE daily_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  log_date      TEXT NOT NULL UNIQUE,
  minutes       INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  auto_summary  TEXT,
  vault_path    TEXT,
  streak_at_end INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE TABLE weak_areas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  kind        TEXT NOT NULL CHECK(kind IN ('grammar','vocabulary','skill','module')),
  ref_id      INTEGER NOT NULL,
  reason      TEXT,
  severity    REAL NOT NULL DEFAULT 0.5,
  flagged_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE resources (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  url        TEXT,
  kind       TEXT,
  level_code TEXT,
  notes      TEXT,
  vault_path TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Migration tracking table (managed by migrator.ts)
CREATE TABLE IF NOT EXISTS _migrations (
  name       TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Views

CREATE VIEW v_module_completion AS
SELECT
  m.id          AS module_id,
  m.slug        AS module_slug,
  COUNT(DISTINCT a.id) AS total_activities,
  COUNT(DISTINCT CASE WHEN att.completed_at IS NOT NULL THEN a.id END) AS completed_activities,
  CASE
    WHEN COUNT(DISTINCT a.id) = 0 THEN 0.0
    ELSE 1.0 * COUNT(DISTINCT CASE WHEN att.completed_at IS NOT NULL THEN a.id END)
         / COUNT(DISTINCT a.id)
  END AS percent_complete
FROM modules m
JOIN lessons l    ON l.module_id = m.id
JOIN activities a ON a.lesson_id = l.id
LEFT JOIN activity_attempts att ON att.activity_id = a.id
GROUP BY m.id;

CREATE VIEW v_due_cards AS
SELECT *
FROM vocabulary_items
WHERE status != 'suspended'
  AND status != 'archived'
  AND json_extract(fsrs_state, '$.due') <= datetime('now');
