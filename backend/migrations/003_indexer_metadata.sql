-- migrations/003_indexer_metadata.sql
-- Add columns produced by the Phase 3 Agent 2 vault parser that the
-- baseline schema did not anticipate. Forward-only.
--
-- Adds to `levels`:        title, cefr_band, status, modules_json,
--                          skills_json, tags_json, checksum, updated_at
-- Adds to `modules`:       cefr_band, subtype, status, vocabulary_count,
--                          grammar_focus_json, pronunciation_focus_json,
--                          source_id (the parsed module_id, e.g. "MOD-001")
-- Adds to `activities`:    raw_type (preserves the original Markdown cell)

ALTER TABLE levels ADD COLUMN title         TEXT;
ALTER TABLE levels ADD COLUMN cefr_band     TEXT;
ALTER TABLE levels ADD COLUMN status        TEXT;
ALTER TABLE levels ADD COLUMN modules_json  TEXT;
ALTER TABLE levels ADD COLUMN skills_json   TEXT;
ALTER TABLE levels ADD COLUMN tags_json     TEXT;
ALTER TABLE levels ADD COLUMN checksum      TEXT;
ALTER TABLE levels ADD COLUMN updated_at    TEXT;

ALTER TABLE modules ADD COLUMN cefr_band                TEXT;
ALTER TABLE modules ADD COLUMN subtype                  TEXT;
ALTER TABLE modules ADD COLUMN status                   TEXT;
ALTER TABLE modules ADD COLUMN vocabulary_count         INTEGER;
ALTER TABLE modules ADD COLUMN grammar_focus_json       TEXT;
ALTER TABLE modules ADD COLUMN pronunciation_focus_json TEXT;
ALTER TABLE modules ADD COLUMN source_id                TEXT;

ALTER TABLE activities ADD COLUMN raw_type TEXT;

-- Helpful indices for the new columns we filter on.
CREATE INDEX IF NOT EXISTS idx_modules_source_id  ON modules(source_id);
CREATE INDEX IF NOT EXISTS idx_modules_cefr_band  ON modules(cefr_band);
CREATE INDEX IF NOT EXISTS idx_levels_cefr_band   ON levels(cefr_band);
