-- migrations/006_vocabulary_forvo_url.sql
-- Link to native-speaker recordings (Forvo) for single words, in its own column.
-- audio_url stays reserved for directly playable files. Filled by the vault
-- indexer from the lemma (https://forvo.com/word/<word>/#nl); phrases get NULL.
-- Forward-only.

ALTER TABLE vocabulary_items ADD COLUMN forvo_url TEXT;
