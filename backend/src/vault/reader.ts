import { EventEmitter } from 'node:events';
import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';

import type { ParserWarning } from '../types/parser';
import type {
  ParsedFile,
  ParsedGrammarRegistry,
  ParsedLevel,
  ParsedModule,
  ParsedVocabularySeed,
} from '../types/content';
import { parseModuleFile } from '../parsers/module';
import { parseLevelFile } from '../parsers/level';
import { parseVocabularySeed } from '../parsers/vocabulary';
import { parseGrammarRegistry } from '../parsers/grammar';

export type VaultFileKind = 'module' | 'level' | 'vocabulary-seed' | 'grammar-pattern-registry';

export interface VaultEntry<T extends ParsedFile = ParsedFile> {
  kind: VaultFileKind;
  vault_path: string;     // POSIX-style absolute path, used as map key
  fs_path: string;        // OS-native path
  parsed: T | null;
  warnings: ParserWarning[];
  last_parsed_at: string; // ISO timestamp
}

export interface VaultReaderOptions {
  vault_path: string;
  /** Skip chokidar; useful for one-shot CLI / tests. Default false. */
  watch?: boolean;
  /** Debounce in ms for chokidar (default 300). */
  debounceMs?: number;
  /** Optional logger; defaults to a no-op. */
  logger?: VaultLogger;
}

export interface VaultLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

const noopLogger: VaultLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export interface VaultIndexSnapshot {
  modules: ParsedModule[];
  levels: ParsedLevel[];
  vocabulary_seeds: ParsedVocabularySeed[];
  grammar_registries: ParsedGrammarRegistry[];
  warnings: ParserWarning[];
}

const RELATIVE_PATHS = {
  modulesGlob: '03_Curriculum/Modules',
  levelsGlob: '03_Curriculum/Levels',
  vocabularyGlob: '05_Exercises/Generated',
  grammarGlob: '05_Exercises/Generated',
};

export function toPosix(absPath: string): string {
  return absPath.split(path.sep).join('/');
}

/**
 * Classify a file inside the vault by its relative path. Returns null if the
 * file is not one the MVP indexer reads.
 */
export function classifyVaultFile(
  vault_path_root: string,
  fileAbsPath: string,
): VaultFileKind | null {
  const rel = path.relative(vault_path_root, fileAbsPath).split(path.sep).join('/');
  const base = path.basename(fileAbsPath);

  if (rel.startsWith('03_Curriculum/Modules/') && /^MOD-\d{3,}.*\.md$/.test(base)) {
    return 'module';
  }
  if (rel.startsWith('03_Curriculum/Levels/') && /^Level_\d{3,}.*\.md$/.test(base)) {
    return 'level';
  }
  if (rel.startsWith('05_Exercises/Generated/') && /^Vocabulary_Seed.*\.md$/.test(base)) {
    return 'vocabulary-seed';
  }
  if (rel.startsWith('05_Exercises/Generated/') && /^Grammar_Patterns.*\.md$/.test(base)) {
    return 'grammar-pattern-registry';
  }
  return null;
}

/**
 * In-memory vault reader. Reads, parses, and re-parses the flat MVP layout.
 *
 * Lifecycle:
 *   const reader = new VaultReader({ vault_path });
 *   await reader.start();          // initial scan + (optional) chokidar
 *   const snap = reader.snapshot(); // synchronous read of parsed state
 *   await reader.stop();           // closes chokidar
 *
 * Events:
 *   reader.on('parsed', (entry) => ...)
 *   reader.on('warning', (warning) => ...)
 *   reader.on('removed', (vaultPath) => ...)
 */
export class VaultReader extends EventEmitter {
  private readonly vaultPath: string;
  private readonly watch: boolean;
  private readonly debounceMs: number;
  private readonly logger: VaultLogger;
  private readonly entries = new Map<string, VaultEntry>();
  private watcher: FSWatcher | null = null;
  private pending = new Map<string, NodeJS.Timeout>();
  private started = false;

  constructor(opts: VaultReaderOptions) {
    super();
    if (!opts.vault_path) {
      throw new Error('VaultReader: vault_path is required.');
    }
    if (!existsSync(opts.vault_path)) {
      throw new Error(`VaultReader: vault path does not exist: ${opts.vault_path}`);
    }
    this.vaultPath = path.resolve(opts.vault_path);
    this.watch = opts.watch ?? false;
    this.debounceMs = opts.debounceMs ?? 300;
    this.logger = opts.logger ?? noopLogger;
  }

  /** Initial full scan; optionally start chokidar. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.fullScan();
    if (this.watch) {
      await this.startWatcher();
    }
  }

  /** Force a full re-scan; clears the in-memory map first. */
  async reindex(): Promise<VaultIndexSnapshot> {
    this.entries.clear();
    await this.fullScan();
    return this.snapshot();
  }

  /** Stop chokidar (if running) and clear timers. */
  async stop(): Promise<void> {
    for (const timer of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.started = false;
  }

  // ───────────────── Public read API ─────────────────

  snapshot(): VaultIndexSnapshot {
    const modules: ParsedModule[] = [];
    const levels: ParsedLevel[] = [];
    const vocabulary_seeds: ParsedVocabularySeed[] = [];
    const grammar_registries: ParsedGrammarRegistry[] = [];
    const warnings: ParserWarning[] = [];

    for (const entry of this.entries.values()) {
      warnings.push(...entry.warnings);
      if (!entry.parsed) continue;
      switch (entry.parsed.type) {
        case 'module':
          modules.push(entry.parsed);
          break;
        case 'level':
          levels.push(entry.parsed);
          break;
        case 'vocabulary-seed':
          vocabulary_seeds.push(entry.parsed);
          break;
        case 'grammar-pattern-registry':
          grammar_registries.push(entry.parsed);
          break;
      }
    }

    modules.sort((a, b) => a.level - b.level || a.module_id.localeCompare(b.module_id));
    levels.sort((a, b) => a.level - b.level);

    return { modules, levels, vocabulary_seeds, grammar_registries, warnings };
  }

  /** Return all entries of a given kind. */
  list<K extends VaultFileKind>(kind: K): VaultEntry[] {
    return [...this.entries.values()].filter((e) => e.kind === kind);
  }

  /** Look up a parsed entry by vault path (POSIX). */
  get(vault_path: string): VaultEntry | undefined {
    return this.entries.get(vault_path);
  }

  /** Look up a parsed module by its module_id. */
  getModule(module_id: string): ParsedModule | undefined {
    for (const entry of this.entries.values()) {
      if (entry.kind === 'module' && entry.parsed?.type === 'module') {
        if ((entry.parsed as ParsedModule).module_id === module_id) {
          return entry.parsed as ParsedModule;
        }
      }
    }
    return undefined;
  }

  /** Look up a parsed level by its level number. */
  getLevel(level: number): ParsedLevel | undefined {
    for (const entry of this.entries.values()) {
      if (entry.kind === 'level' && entry.parsed?.type === 'level') {
        if ((entry.parsed as ParsedLevel).level === level) {
          return entry.parsed as ParsedLevel;
        }
      }
    }
    return undefined;
  }

  /** Aggregate vocabulary items across all seed files. */
  vocabularyItems(): ParsedVocabularySeed['items'] {
    const out: ParsedVocabularySeed['items'] = [];
    for (const entry of this.entries.values()) {
      if (entry.kind === 'vocabulary-seed' && entry.parsed?.type === 'vocabulary-seed') {
        out.push(...(entry.parsed as ParsedVocabularySeed).items);
      }
    }
    return out;
  }

  /** Aggregate grammar patterns across all registry files. */
  grammarPatterns(): ParsedGrammarRegistry['patterns'] {
    const out: ParsedGrammarRegistry['patterns'] = [];
    for (const entry of this.entries.values()) {
      if (
        entry.kind === 'grammar-pattern-registry' &&
        entry.parsed?.type === 'grammar-pattern-registry'
      ) {
        out.push(...(entry.parsed as ParsedGrammarRegistry).patterns);
      }
    }
    return out;
  }

  // ───────────────── Internal scanning ─────────────────

  private async fullScan(): Promise<void> {
    const modulesDir = path.join(this.vaultPath, RELATIVE_PATHS.modulesGlob);
    const levelsDir = path.join(this.vaultPath, RELATIVE_PATHS.levelsGlob);
    const generatedDir = path.join(this.vaultPath, RELATIVE_PATHS.vocabularyGlob);

    const moduleFiles = await listMarkdown(modulesDir, /^MOD-\d{3,}.*\.md$/);
    const levelFiles = await listMarkdown(levelsDir, /^Level_\d{3,}.*\.md$/);
    const vocabSeeds = await listMarkdown(generatedDir, /^Vocabulary_Seed.*\.md$/);
    const grammarRegs = await listMarkdown(generatedDir, /^Grammar_Patterns.*\.md$/);

    if (moduleFiles.length === 0) {
      this.logger.warn('[vault] no module files found', { dir: modulesDir });
    }
    if (levelFiles.length === 0) {
      this.logger.warn('[vault] no level files found', { dir: levelsDir });
    }

    const all = [
      ...moduleFiles.map((f) => ({ kind: 'module' as const, file: f })),
      ...levelFiles.map((f) => ({ kind: 'level' as const, file: f })),
      ...vocabSeeds.map((f) => ({ kind: 'vocabulary-seed' as const, file: f })),
      ...grammarRegs.map((f) => ({ kind: 'grammar-pattern-registry' as const, file: f })),
    ];

    for (const { file } of all) {
      await this.ingestFile(file);
    }
  }

  private async startWatcher(): Promise<void> {
    const moduleDir = path.join(this.vaultPath, RELATIVE_PATHS.modulesGlob);
    const levelDir = path.join(this.vaultPath, RELATIVE_PATHS.levelsGlob);
    const generatedDir = path.join(this.vaultPath, RELATIVE_PATHS.vocabularyGlob);

    this.watcher = chokidar.watch(
      [
        path.join(moduleDir, 'MOD-*.md'),
        path.join(levelDir, 'Level_*.md'),
        path.join(generatedDir, 'Vocabulary_Seed*.md'),
        path.join(generatedDir, 'Grammar_Patterns*.md'),
      ],
      {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 50 },
        usePolling: false,
      },
    );

    const onChange = (fsPath: string) => this.queueIngest(fsPath);
    const onRemove = (fsPath: string) => this.queueRemove(fsPath);
    this.watcher.on('add', onChange).on('change', onChange).on('unlink', onRemove);
  }

  private queueIngest(fsPath: string): void {
    const key = toPosix(path.resolve(fsPath));
    if (this.pending.has(key)) clearTimeout(this.pending.get(key)!);
    const timer = setTimeout(async () => {
      this.pending.delete(key);
      try {
        await this.ingestFile(fsPath);
      } catch (err) {
        this.logger.error('[vault] ingest failed', {
          fsPath,
          error: (err as Error).message,
        });
      }
    }, this.debounceMs);
    this.pending.set(key, timer);
  }

  private queueRemove(fsPath: string): void {
    const key = toPosix(path.resolve(fsPath));
    if (this.pending.has(key)) clearTimeout(this.pending.get(key)!);
    const timer = setTimeout(() => {
      this.pending.delete(key);
      const entry = this.entries.get(key);
      if (entry) {
        this.entries.delete(key);
        this.logger.info('[vault] removed', { vault_path: key });
        this.emit('removed', key);
      }
    }, this.debounceMs);
    this.pending.set(key, timer);
  }

  private async ingestFile(fsPath: string): Promise<void> {
    const absolute = path.resolve(fsPath);
    const kind = classifyVaultFile(this.vaultPath, absolute);
    if (!kind) return;

    const vault_path = toPosix(absolute);
    let source: string;
    try {
      source = await fs.readFile(absolute, 'utf8');
    } catch (err) {
      this.logger.warn('[vault] read failed', { vault_path, error: (err as Error).message });
      return;
    }

    const existing = this.entries.get(vault_path);
    const result = parseAny(kind, { source, vault_path });
    if (existing && existing.parsed && existing.parsed.checksum === result.parsed?.checksum) {
      // Same checksum — nothing to do.
      return;
    }

    const entry: VaultEntry = {
      kind,
      vault_path,
      fs_path: absolute,
      parsed: result.parsed,
      warnings: result.warnings,
      last_parsed_at: new Date().toISOString(),
    };
    this.entries.set(vault_path, entry);
    for (const warning of result.warnings) this.emit('warning', warning);
    this.emit('parsed', entry);
    this.logger.info('[vault] parsed', {
      vault_path,
      kind,
      warnings: result.warnings.length,
    });
  }
}

interface InternalParseInput {
  source: string;
  vault_path: string;
}

interface InternalParseResult {
  parsed: ParsedFile | null;
  warnings: ParserWarning[];
}

function parseAny(kind: VaultFileKind, input: InternalParseInput): InternalParseResult {
  switch (kind) {
    case 'module': {
      const r = parseModuleFile(input);
      return { parsed: r.value, warnings: r.warnings };
    }
    case 'level': {
      const r = parseLevelFile(input);
      return { parsed: r.value, warnings: r.warnings };
    }
    case 'vocabulary-seed': {
      const r = parseVocabularySeed(input);
      return { parsed: r.value, warnings: r.warnings };
    }
    case 'grammar-pattern-registry': {
      const r = parseGrammarRegistry(input);
      return { parsed: r.value, warnings: r.warnings };
    }
  }
}

async function listMarkdown(dir: string, pattern: RegExp): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  return entries
    .filter((e) => e.isFile() && pattern.test(e.name))
    .map((e) => path.join(dir, e.name))
    .sort();
}
