-- migrations/007_vocabulary_plural_forms.sql
-- Plural of a noun and the forms of a verb, shown on the back of a review card.
-- Filled by the vault indexer from the optional seed columns `plural` and
-- `forms` (e.g. plural "huizen"; forms "ik ga, hij gaat · ging · gegaan").
-- Forward-only.

ALTER TABLE vocabulary_items ADD COLUMN plural TEXT;
ALTER TABLE vocabulary_items ADD COLUMN forms TEXT;
