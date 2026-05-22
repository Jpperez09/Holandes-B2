import type {
  CefrLetter,
  ParsedVocabItem,
  ParsedVocabularySeed,
  VocabPos,
} from '../types/content';
import type { ParserResult, ParserWarning } from '../types/parser';
import { makeWarning } from '../types/parser';
import { parseFrontmatter } from '../markdown/frontmatter';
import {
  coerceCefrLetter,
  coerceInteger,
  coerceStringArray,
  isString,
  malformedTableRowWarnings,
  requireField,
  unknownFieldWarnings,
} from '../validation/permissive';
import {
  extractMarkdownTables,
  parseBooleanCell,
  splitByHeadings,
  stripCellFormatting,
  type HeadingSection,
} from '../markdown/tables';

/** Empty cell markers used across the seed. */
const EMPTY_CELL = new Set(['', '—', '-', 'null', 'n/a']);

function cellOrNull(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = stripCellFormatting(value);
  if (EMPTY_CELL.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

function parseArticle(value: string | undefined): 'de' | 'het' | null {
  const v = cellOrNull(value)?.toLowerCase() ?? null;
  if (v === 'de') return 'de';
  if (v === 'het') return 'het';
  return null;
}

function parseCognateCell(value: string | undefined): boolean | 'partial' | null {
  if (value == null) return null;
  const v = stripCellFormatting(value).toLowerCase();
  if (EMPTY_CELL.has(v)) return null;
  if (v === 'partial' || v.startsWith('partial')) return 'partial';
  const bool = parseBooleanCell(value);
  return bool;
}

function parseTagsCell(value: string | undefined): string[] {
  const v = cellOrNull(value);
  if (!v) return [];
  return v
    .split(/[,;]\s*/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function findVocabSections(body: string): HeadingSection[] {
  const sections = splitByHeadings(body);
  return sections.filter((section) => {
    // §"2.x" sub-sections, but also anything that looks like a vocab subsection.
    if (/^\d+\.\d+\.?\s+/.test(section.title)) return true;
    if (section.level >= 3 && /^items/i.test(section.title)) return true;
    return false;
  });
}

export interface ParseVocabularySeedInput {
  source: string;
  vault_path: string;
}

export function parseVocabularySeed(
  input: ParseVocabularySeedInput,
): ParserResult<ParsedVocabularySeed> {
  const { source, vault_path } = input;
  const warnings: ParserWarning[] = [];
  const { raw, body, checksum, warnings: fmWarnings } = parseFrontmatter(source, vault_path);
  warnings.push(...fmWarnings);

  if (fmWarnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  const typeWarn = requireField(raw, 'type', (v) => v === 'vocabulary-seed', vault_path);
  if (typeWarn) {
    warnings.push({
      ...typeWarn,
      code: 'wrong-type-for-parser',
      message: 'Expected type=vocabulary-seed.',
    });
    return { ok: false, value: null, warnings };
  }

  for (const required of ['cefr_band', 'covers_modules'] as const) {
    const w = requireField(raw, required, undefined, vault_path);
    if (w) warnings.push(w);
  }
  if (warnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  const cefr_band = isString(raw.cefr_band) ? raw.cefr_band.trim() : '';
  if (!cefr_band) {
    warnings.push(
      makeWarning('invalid-required-field', 'Field "cefr_band" is missing.', 'error', {
        field: 'cefr_band',
        vault_path,
      }),
    );
    return { ok: false, value: null, warnings };
  }

  const covers_modules = coerceStringArray(raw.covers_modules);
  if (covers_modules.length === 0) {
    warnings.push(
      makeWarning('soft-rule-violation', 'Field "covers_modules" is empty.', 'warn', {
        field: 'covers_modules',
        vault_path,
      }),
    );
  }
  warnings.push(...unknownFieldWarnings(raw, 'vocabulary-seed', vault_path));

  const defaultLevel: CefrLetter | null = coerceCefrLetter(cefr_band);

  const sections = findVocabSections(body);
  const items: ParsedVocabItem[] = [];
  const seenIds = new Set<string>();
  const seenLemmas = new Set<string>();

  for (const section of sections) {
    const tables = extractMarkdownTables(section.content);
    for (const table of tables) {
      // Heuristic: a vocab table must have at least "dutch" and "gloss_en" columns,
      // or column synonyms.
      const hasDutch = table.headers.includes('dutch');
      const hasGlossEn = table.headers.includes('gloss_en') || table.headers.includes('english');
      if (!hasDutch || !hasGlossEn) {
        // Not a vocab table — skip silently.
        continue;
      }

      // Flag any row whose column count doesn't match the header.
      warnings.push(...malformedTableRowWarnings(table, vault_path, section.title));

      table.rows.forEach((row, rowIdx) => {
        const lemma = cellOrNull(row['dutch']);
        const gloss = cellOrNull(row['gloss_en'] ?? row['english']);

        if (!lemma || !gloss) {
          warnings.push(
            makeWarning(
              'vocab-row-skipped',
              `Vocabulary row #${rowIdx + 1} in "${section.title}" skipped: missing dutch or gloss_en.`,
              'warn',
              { vault_path, field: 'vocabulary-row', context: { section: section.title, row } },
            ),
          );
          return;
        }

        const sourceId = cellOrNull(row['id']);
        if (sourceId && seenIds.has(sourceId)) {
          warnings.push(
            makeWarning(
              'vocab-duplicate-id',
              `Duplicate vocabulary id "${sourceId}" — the second occurrence wins.`,
              'warn',
              { vault_path, field: 'id', context: { id: sourceId } },
            ),
          );
        }
        if (sourceId) seenIds.add(sourceId);

        const lemmaKey = lemma.toLowerCase();
        if (seenLemmas.has(lemmaKey)) {
          warnings.push(
            makeWarning(
              'vocab-duplicate-lemma',
              `Duplicate vocabulary lemma "${lemma}". The second occurrence will overwrite the first downstream.`,
              'info',
              { vault_path, field: 'dutch', context: { lemma } },
            ),
          );
        }
        seenLemmas.add(lemmaKey);

        const pos = (cellOrNull(row['pos']) ?? 'unknown') as VocabPos;
        const article = parseArticle(row['article']);
        if (!article && pos.startsWith('noun')) {
          warnings.push(
            makeWarning(
              'noun-missing-article',
              `Noun "${lemma}" is missing a de/het article — defaulting to null.`,
              'info',
              { vault_path, field: 'article', context: { lemma, pos } },
            ),
          );
        }

        const cefr = cellOrNull(row['cefr']);
        const level_code: CefrLetter | null = cefr
          ? coerceCefrLetter(cefr) ?? defaultLevel
          : defaultLevel;

        const item: ParsedVocabItem = {
          source_id: sourceId,
          lemma,
          article,
          pos,
          ipa: cellOrNull(row['ipa']),
          translation_en: gloss,
          translation_es: cellOrNull(row['gloss_es']),
          cognate_en: parseCognateCell(row['cognate_en']),
          cognate_note: cellOrNull(row['cognate_note']),
          example: cellOrNull(row['example_nl']),
          level_code,
          module_id: cellOrNull(row['module_id']),
          audio_path: cellOrNull(row['audio_path']),
          audio_url: cellOrNull(row['audio_url']),
          tts_text: cellOrNull(row['tts_text']) ?? lemma,
          tags: parseTagsCell(row['tags']),
          table_section: section.title,
        };
        items.push(item);
      });
    }
  }

  if (items.length === 0) {
    warnings.push(
      makeWarning(
        'vocab-empty',
        'No vocabulary items extracted from the seed file. Check sub-section headings and table structure.',
        'warn',
        { vault_path },
      ),
    );
  }

  const value: ParsedVocabularySeed = {
    type: 'vocabulary-seed',
    cefr_band,
    covers_modules,
    total_items: coerceInteger(raw.total_items),
    status: isString(raw.status) ? raw.status.trim() : null,
    tags: coerceStringArray(raw.tags),
    created: isString(raw.created) ? raw.created : null,
    updated: isString(raw.updated) ? raw.updated : null,
    items,
    vault_path,
    checksum,
    extra_frontmatter: pickExtra(raw),
  };

  return { ok: true, value, warnings };
}

function pickExtra(raw: Record<string, unknown>): Record<string, unknown> {
  const known = new Set([
    'type',
    'title',
    'cefr_band',
    'covers_modules',
    'total_items',
    'status',
    'tags',
    'created',
    'updated',
  ]);
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!known.has(key)) extra[key] = value;
  }
  return extra;
}
