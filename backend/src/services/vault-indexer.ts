import path from 'path';
import { logger } from '../config/logger';
import { getDb } from '../db/connection';
import { VaultReader, type VaultEntry } from '../vault/reader';
import type {
  ParsedActivity,
  ParsedGrammarPattern,
  ParsedLevel,
  ParsedModule,
  ParsedVocabItem,
  ParsedVocabularySeed,
  ParsedGrammarRegistry,
} from '../types/content';
import type { ParserWarning } from '../types/parser';
import Database from 'better-sqlite3';

// ─────────────────────────────────────────────────────────────────────────────
// Singleton VaultReader + indexer state
// ─────────────────────────────────────────────────────────────────────────────

let reader: VaultReader | null = null;

export interface IndexerState {
  ready: boolean;
  lastIndexed: Date | null;
  vaultPath: string | null;
  moduleCount: number;
  levelCount: number;
  vocabCount: number;
  grammarCount: number;
  activityCount: number;
  warningCount: number;
  errors: string[];
}

const state: IndexerState = {
  ready: false,
  lastIndexed: null,
  vaultPath: null,
  moduleCount: 0,
  levelCount: 0,
  vocabCount: 0,
  grammarCount: 0,
  activityCount: 0,
  warningCount: 0,
  errors: [],
};

export function getIndexerState(): IndexerState {
  return { ...state, errors: [...state.errors] };
}

export function isIndexerReady(): boolean {
  return state.ready;
}

export function getVaultReader(): VaultReader | null {
  return reader;
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity-type mapping: DB CHECK is the v1 enum; map non-DB types to freeform.
// ─────────────────────────────────────────────────────────────────────────────

const DB_ACTIVITY_TYPES = new Set([
  'vocab',
  'grammar',
  'reading',
  'listening',
  'writing',
  'freeform',
]);

function mapActivityType(parsed: ParsedActivity['type']): string {
  if (DB_ACTIVITY_TYPES.has(parsed)) return parsed;
  // speaking, real-world, unknown → freeform (preserved in raw_type column).
  return 'freeform';
}

// ─────────────────────────────────────────────────────────────────────────────
// Idempotent SQLite upserts
// ─────────────────────────────────────────────────────────────────────────────

interface IndexerCounts {
  modules: number;
  levels: number;
  vocab: number;
  grammar: number;
  activities: number;
}

function upsertLevel(db: Database.Database, level: ParsedLevel): number {
  const code = String(level.level);
  const stmt = db.prepare(
    `INSERT INTO levels (code, sort_order, vault_path, title, cefr_band, status,
                         modules_json, skills_json, tags_json, checksum, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(code) DO UPDATE SET
       sort_order   = excluded.sort_order,
       vault_path   = excluded.vault_path,
       title        = excluded.title,
       cefr_band    = excluded.cefr_band,
       status       = excluded.status,
       modules_json = excluded.modules_json,
       skills_json  = excluded.skills_json,
       tags_json    = excluded.tags_json,
       checksum     = excluded.checksum,
       updated_at   = excluded.updated_at`,
  );
  stmt.run(
    code,
    level.level,
    level.vault_path,
    level.title,
    level.cefr_band,
    level.status,
    JSON.stringify(level.modules),
    JSON.stringify(level.skills),
    JSON.stringify(level.tags),
    level.checksum,
  );
  const row = db.prepare('SELECT id FROM levels WHERE code = ?').get(code) as
    | { id: number }
    | undefined;
  if (!row) throw new Error(`Level upsert failed for code=${code}`);
  return row.id;
}

function upsertModule(
  db: Database.Database,
  module: ParsedModule,
  levelId: number,
): number {
  const stmt = db.prepare(
    `INSERT INTO modules
       (level_id, slug, title, sort_order, vault_path, checksum, estimated_minutes,
        prerequisites, tags, cefr_band, subtype, status, vocabulary_count,
        grammar_focus_json, pronunciation_focus_json, source_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(level_id, slug) DO UPDATE SET
       title                     = excluded.title,
       sort_order                = excluded.sort_order,
       vault_path                = excluded.vault_path,
       checksum                  = excluded.checksum,
       estimated_minutes         = excluded.estimated_minutes,
       prerequisites             = excluded.prerequisites,
       tags                      = excluded.tags,
       cefr_band                 = excluded.cefr_band,
       subtype                   = excluded.subtype,
       status                    = excluded.status,
       vocabulary_count          = excluded.vocabulary_count,
       grammar_focus_json        = excluded.grammar_focus_json,
       pronunciation_focus_json  = excluded.pronunciation_focus_json,
       source_id                 = excluded.source_id,
       updated_at                = excluded.updated_at`,
  );
  stmt.run(
    levelId,
    module.module_id, // store module_id ("MOD-001") as the slug to keep API stable
    module.topic || module.title || module.module_id,
    module.level,
    module.vault_path,
    module.checksum,
    module.estimated_minutes,
    JSON.stringify(module.prerequisites),
    JSON.stringify(module.tags),
    module.cefr_band,
    module.subtype,
    module.status,
    module.vocabulary_count,
    JSON.stringify(module.grammar_focus),
    JSON.stringify(module.pronunciation_focus),
    module.module_id,
  );
  const row = db
    .prepare('SELECT id FROM modules WHERE level_id = ? AND slug = ?')
    .get(levelId, module.module_id) as { id: number } | undefined;
  if (!row) {
    throw new Error(`Module upsert failed for ${module.module_id}`);
  }
  return row.id;
}

function upsertDefaultLesson(
  db: Database.Database,
  module: ParsedModule,
  moduleDbId: number,
): number {
  const stmt = db.prepare(
    `INSERT INTO lessons (module_id, slug, title, sort_order, vault_path, checksum, estimated_minutes)
     VALUES (?, 'default', 'Activities', 1, ?, ?, ?)
     ON CONFLICT(module_id, slug) DO UPDATE SET
       title             = excluded.title,
       vault_path        = excluded.vault_path,
       checksum          = excluded.checksum,
       estimated_minutes = excluded.estimated_minutes`,
  );
  stmt.run(moduleDbId, module.vault_path, module.checksum, module.estimated_minutes);
  const row = db
    .prepare("SELECT id FROM lessons WHERE module_id = ? AND slug = 'default'")
    .get(moduleDbId) as { id: number } | undefined;
  if (!row) throw new Error(`Lesson upsert failed for module_id=${moduleDbId}`);
  return row.id;
}

function upsertActivities(
  db: Database.Database,
  lessonId: number,
  activities: ParsedActivity[],
  vaultPath: string,
): number {
  // 1) Upsert each activity.
  const upsert = db.prepare(
    `INSERT INTO activities
       (lesson_id, slug, type, title, sort_order, payload_json, vault_path,
        estimated_minutes, raw_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(lesson_id, slug) DO UPDATE SET
       type              = excluded.type,
       title             = excluded.title,
       sort_order        = excluded.sort_order,
       payload_json      = excluded.payload_json,
       vault_path        = excluded.vault_path,
       estimated_minutes = excluded.estimated_minutes,
       raw_type          = excluded.raw_type`,
  );

  const incomingSlugs = new Set<string>();
  activities.forEach((act, index) => {
    incomingSlugs.add(act.slug);
    const payload = JSON.stringify({
      parsed_type: act.type,
      raw_type: act.raw_type,
      raw_estimated_time: act.raw_estimated_time,
    });
    upsert.run(
      lessonId,
      act.slug,
      mapActivityType(act.type),
      act.title,
      index + 1,
      payload,
      vaultPath,
      act.estimated_minutes,
      act.raw_type,
    );
  });

  // 2) Remove activities that disappeared (cascades attempts — these are stub
  //    activities with no attempts at indexing time).
  const existing = db
    .prepare('SELECT slug FROM activities WHERE lesson_id = ?')
    .all(lessonId) as { slug: string }[];
  const toDelete = existing.filter((row) => !incomingSlugs.has(row.slug));
  if (toDelete.length > 0) {
    const del = db.prepare('DELETE FROM activities WHERE lesson_id = ? AND slug = ?');
    for (const row of toDelete) del.run(lessonId, row.slug);
  }
  return activities.length;
}

function upsertVocabulary(db: Database.Database, items: ParsedVocabItem[], sourcePath: string): number {
  const stmt = db.prepare(
    `INSERT INTO vocabulary_items
       (lemma, article, language, pos, translation_es, translation_en, ipa,
        example, cognate_en, cognate_note, source_id, source_path, module_id,
        level_code, tags, audio_path, audio_url, tts_text, status, updated_at)
     VALUES (?, ?, 'nl', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))
     ON CONFLICT(lemma, language) DO UPDATE SET
       article         = excluded.article,
       pos             = excluded.pos,
       translation_es  = excluded.translation_es,
       translation_en  = excluded.translation_en,
       ipa             = excluded.ipa,
       example         = excluded.example,
       cognate_en      = excluded.cognate_en,
       cognate_note    = excluded.cognate_note,
       source_id       = excluded.source_id,
       source_path     = excluded.source_path,
       module_id       = excluded.module_id,
       level_code      = excluded.level_code,
       tags            = excluded.tags,
       audio_path      = excluded.audio_path,
       audio_url       = excluded.audio_url,
       tts_text        = excluded.tts_text,
       updated_at      = excluded.updated_at`,
  );
  for (const item of items) {
    const cognateAsInt = item.cognate_en === true ? 1 : item.cognate_en === 'partial' ? 1 : 0;
    stmt.run(
      item.lemma,
      item.article,
      item.pos,
      item.translation_es,
      item.translation_en,
      item.ipa,
      item.example,
      cognateAsInt,
      item.cognate_note,
      item.source_id,
      sourcePath,
      item.module_id,
      item.level_code,
      JSON.stringify(item.tags),
      item.audio_path,
      item.audio_url,
      item.tts_text,
    );
  }
  return items.length;
}

function upsertGrammar(db: Database.Database, patterns: ParsedGrammarPattern[], sourcePath: string): number {
  const stmt = db.prepare(
    `INSERT INTO grammar_topics
       (slug, title, level_code, vault_path, module_id, pienemann_stage, notes_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET
       title           = excluded.title,
       level_code      = excluded.level_code,
       vault_path      = excluded.vault_path,
       module_id       = excluded.module_id,
       pienemann_stage = excluded.pienemann_stage,
       notes_json      = excluded.notes_json,
       updated_at      = excluded.updated_at`,
  );
  for (const pattern of patterns) {
    const notes = {
      cefr_band: pattern.cefr_band,
      dutch_pattern: pattern.dutch_pattern,
      english_meaning: pattern.english_meaning,
      spanish_contrast: pattern.spanish_contrast,
      examples: pattern.examples,
      common_mistake: pattern.common_mistake,
      practice_activity: pattern.practice_activity,
      srs_cloze_candidate: pattern.srs_cloze_candidate,
      tags: pattern.tags,
      extra: pattern.notes,
    };
    stmt.run(
      pattern.slug,
      pattern.name_en,
      pattern.level_code,
      sourcePath,
      pattern.module_introduced,
      pattern.pienemann_stage,
      JSON.stringify(notes),
    );
  }
  return patterns.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full sync from VaultReader snapshot → SQLite
// ─────────────────────────────────────────────────────────────────────────────

function syncDb(): IndexerCounts {
  if (!reader) {
    return { modules: 0, levels: 0, vocab: 0, grammar: 0, activities: 0 };
  }
  const db = getDb();
  const snap = reader.snapshot();

  return db.transaction((): IndexerCounts => {
    // 1) Levels: index by parsed level number → DB id.
    const levelIdByNumber = new Map<number, number>();
    for (const level of snap.levels) {
      const id = upsertLevel(db, level);
      levelIdByNumber.set(level.level, id);
    }

    // 2) Modules + default lesson + activities.
    let activityCount = 0;
    for (const module of snap.modules) {
      const levelId = levelIdByNumber.get(module.level);
      if (!levelId) {
        logger.warn(
          { module: module.module_id, level: module.level },
          '[vault-indexer] module references a level number with no matching level file — creating level shell',
        );
        // Auto-create a minimal level row so the FK holds.
        const stub: ParsedLevel = {
          type: 'level',
          level: module.level,
          cefr_band: module.cefr_band,
          title: `Level ${String(module.level).padStart(3, '0')}`,
          status: 'auto-created',
          modules: [module.module_id],
          skills: [],
          tags: [],
          created: null,
          updated: null,
          body: '',
          vault_path: module.vault_path,
          checksum: '',
          extra_frontmatter: {},
        };
        const newId = upsertLevel(db, stub);
        levelIdByNumber.set(module.level, newId);
      }
      const resolvedLevelId = levelIdByNumber.get(module.level)!;
      const moduleDbId = upsertModule(db, module, resolvedLevelId);
      const lessonDbId = upsertDefaultLesson(db, module, moduleDbId);
      activityCount += upsertActivities(
        db,
        lessonDbId,
        module.activities,
        module.vault_path,
      );
    }

    // 3) Vocabulary.
    let vocabCount = 0;
    for (const seed of snap.vocabulary_seeds) {
      vocabCount += upsertVocabulary(db, seed.items, seed.vault_path);
    }

    // 4) Grammar.
    let grammarCount = 0;
    for (const registry of snap.grammar_registries) {
      grammarCount += upsertGrammar(db, registry.patterns, registry.vault_path);
    }

    return {
      levels: snap.levels.length,
      modules: snap.modules.length,
      vocab: vocabCount,
      grammar: grammarCount,
      activities: activityCount,
    };
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public lifecycle
// ─────────────────────────────────────────────────────────────────────────────

export interface RunFullIndexOptions {
  watch?: boolean;
}

export async function runFullIndex(
  vaultPath: string,
  opts: RunFullIndexOptions = {},
): Promise<IndexerState> {
  state.errors = [];
  state.vaultPath = vaultPath;
  if (!vaultPath || vaultPath.trim() === '') {
    state.ready = false;
    state.errors.push('vault_path is empty');
    logger.warn('[vault-indexer] vault_path empty — skipping index');
    return getIndexerState();
  }

  // Tear down a previous reader if vault path changed.
  if (reader) {
    try {
      await reader.stop();
    } catch (err) {
      logger.warn({ err: (err as Error).message }, '[vault-indexer] previous reader stop failed');
    }
    reader = null;
  }

  try {
    reader = new VaultReader({
      vault_path: vaultPath,
      watch: opts.watch ?? false,
      logger: {
        info: (msg, ctx) => logger.info(ctx ?? {}, msg),
        warn: (msg, ctx) => logger.warn(ctx ?? {}, msg),
        error: (msg, ctx) => logger.error(ctx ?? {}, msg),
      },
    });
  } catch (err) {
    state.ready = false;
    const msg = (err as Error).message;
    state.errors.push(msg);
    logger.error({ err: msg, vaultPath }, '[vault-indexer] VaultReader init failed');
    return getIndexerState();
  }

  try {
    await reader.start();
    // Wire change notifications AFTER the initial scan so we don't fire a DB
    // sync per file during the bulk first pass.
    reader.on('parsed', () => {
      try {
        syncDb();
        refreshCounts();
      } catch (err) {
        logger.error({ err: (err as Error).message }, '[vault-indexer] live re-sync failed');
      }
    });
    reader.on('removed', () => {
      try {
        syncDb();
        refreshCounts();
      } catch (err) {
        logger.error({ err: (err as Error).message }, '[vault-indexer] removal re-sync failed');
      }
    });
    const counts = syncDb();
    state.moduleCount = counts.modules;
    state.levelCount = counts.levels;
    state.vocabCount = counts.vocab;
    state.grammarCount = counts.grammar;
    state.activityCount = counts.activities;
    state.warningCount = reader.snapshot().warnings.length;
    state.lastIndexed = new Date();
    state.ready = true;
    logger.info(
      {
        vaultPath,
        modules: counts.modules,
        levels: counts.levels,
        vocab: counts.vocab,
        grammar: counts.grammar,
        activities: counts.activities,
        warnings: state.warningCount,
      },
      '[vault-indexer] Full index complete',
    );
  } catch (err) {
    state.ready = false;
    const msg = (err as Error).message;
    state.errors.push(msg);
    logger.error({ err: msg }, '[vault-indexer] Full index failed');
  }

  return getIndexerState();
}

function refreshCounts(): void {
  if (!reader) return;
  const snap = reader.snapshot();
  state.moduleCount = snap.modules.length;
  state.levelCount = snap.levels.length;
  state.vocabCount = snap.vocabulary_seeds.reduce((sum, s) => sum + s.items.length, 0);
  state.grammarCount = snap.grammar_registries.reduce((sum, r) => sum + r.patterns.length, 0);
  state.activityCount = snap.modules.reduce((sum, m) => sum + m.activities.length, 0);
  state.warningCount = snap.warnings.length;
  state.lastIndexed = new Date();
}

export async function stopIndexer(): Promise<void> {
  if (reader) {
    try {
      await reader.stop();
    } catch (err) {
      logger.warn({ err: (err as Error).message }, '[vault-indexer] stop failed');
    }
    reader = null;
  }
  state.ready = false;
}

export async function reindexFile(filePath: string): Promise<void> {
  // chokidar (inside VaultReader) already handles single-file re-parse. This
  // function exists for explicit triggers (e.g. tests).
  if (!reader) return;
  // Forcing a full re-sync is cheap (small content) and keeps DB consistent.
  logger.debug({ filePath }, '[vault-indexer] file change → re-sync');
  syncDb();
  refreshCounts();
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostic getters — return parsed in-memory snapshot
// ─────────────────────────────────────────────────────────────────────────────

export function getRawModules(): ParsedModule[] {
  return reader?.snapshot().modules ?? [];
}

export function getRawLevels(): ParsedLevel[] {
  return reader?.snapshot().levels ?? [];
}

export function getRawVocabulary(): ParsedVocabItem[] {
  return reader?.vocabularyItems() ?? [];
}

export function getRawGrammarPatterns(): ParsedGrammarPattern[] {
  return reader?.grammarPatterns() ?? [];
}

export function getRawSeedFiles(): {
  vocabulary: ParsedVocabularySeed[];
  grammar: ParsedGrammarRegistry[];
} {
  const snap = reader?.snapshot();
  return {
    vocabulary: snap?.vocabulary_seeds ?? [],
    grammar: snap?.grammar_registries ?? [],
  };
}

export function getRawWarnings(): ParserWarning[] {
  return reader?.snapshot().warnings ?? [];
}

export function getModuleEntries(): VaultEntry[] {
  return reader?.list('module') ?? [];
}

/** Return resolved vault path used by the active reader (or null). */
export function getActiveVaultPath(): string | null {
  return state.vaultPath ? path.resolve(state.vaultPath) : null;
}
