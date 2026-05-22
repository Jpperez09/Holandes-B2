import type { ParsedGrammarPattern, ParsedGrammarRegistry } from '../types/content';
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
} from '../markdown/tables';

const PATTERN_HEADING_RE = /^(?:\d+\.\s+)?`?([a-z][a-z0-9-]+)`?\s*$/i;
const MODULE_LINK_RE = /MOD-\d{3,}/g;

function cellOrNull(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = stripCellFormatting(value);
  if (trimmed === '' || trimmed === '—' || trimmed.toLowerCase() === 'null') return null;
  return trimmed;
}

function pickField(rows: Array<Record<string, string>>, label: string): string | null {
  const target = label.toLowerCase();
  for (const row of rows) {
    const fieldCell = (row['field'] ?? row['key'] ?? '').toLowerCase();
    const normalized = fieldCell
      .replace(/^\*+|\*+$/g, '')
      .replace(/^`+|`+$/g, '')
      .trim();
    if (normalized === target) {
      const value = row['value'] ?? row['val'] ?? '';
      return cellOrNull(value);
    }
  }
  return null;
}

function pickExamples(rows: Array<Record<string, string>>): string[] {
  const raw = pickField(rows, 'examples');
  if (!raw) return [];
  // Examples cell often "ex1 / ex2 / ex3" or comma-separated.
  return raw
    .split(/\s*\/\s*|\s*;\s*/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export interface ParseGrammarRegistryInput {
  source: string;
  vault_path: string;
}

export function parseGrammarRegistry(
  input: ParseGrammarRegistryInput,
): ParserResult<ParsedGrammarRegistry> {
  const { source, vault_path } = input;
  const warnings: ParserWarning[] = [];
  const { raw, body, checksum, warnings: fmWarnings } = parseFrontmatter(source, vault_path);
  warnings.push(...fmWarnings);

  if (fmWarnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  const typeWarn = requireField(raw, 'type', (v) => v === 'grammar-pattern-registry', vault_path);
  if (typeWarn) {
    warnings.push({
      ...typeWarn,
      code: 'wrong-type-for-parser',
      message: 'Expected type=grammar-pattern-registry.',
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
  const covers_modules = coerceStringArray(raw.covers_modules);
  warnings.push(...unknownFieldWarnings(raw, 'grammar-pattern-registry', vault_path));

  const sections = splitByHeadings(body);
  const patterns: ParsedGrammarPattern[] = [];
  const seenSlugs = new Set<string>();

  for (const section of sections) {
    if (section.level !== 3) continue;
    const match = section.title.match(PATTERN_HEADING_RE);
    if (!match) continue;
    const slug = match[1].toLowerCase();

    const tables = extractMarkdownTables(section.content);
    if (tables.length === 0) {
      warnings.push(
        makeWarning(
          'grammar-pattern-no-table',
          `Grammar pattern "${slug}" has no field table; skipped.`,
          'warn',
          { vault_path, context: { slug } },
        ),
      );
      continue;
    }
    const table = tables[0];
    const headers = table.headers;
    if (!headers.includes('field') && !headers.includes('key')) {
      warnings.push(
        makeWarning(
          'grammar-pattern-bad-table',
          `Grammar pattern "${slug}" has a table without a "field" column; skipped.`,
          'warn',
          { vault_path, context: { slug, headers } },
        ),
      );
      continue;
    }

    // Flag any field/value row whose column count doesn't match the header.
    warnings.push(...malformedTableRowWarnings(table, vault_path, slug));

    const rows = table.rows;
    const slugFromTable = pickField(rows, 'slug')?.toLowerCase() ?? null;
    const resolvedSlug = slugFromTable ?? slug;
    if (slugFromTable && slugFromTable !== slug) {
      warnings.push(
        makeWarning(
          'grammar-slug-mismatch',
          `Grammar pattern heading slug "${slug}" differs from table slug "${slugFromTable}". Using table value.`,
          'warn',
          { vault_path, context: { headingSlug: slug, tableSlug: slugFromTable } },
        ),
      );
    }

    if (seenSlugs.has(resolvedSlug)) {
      warnings.push(
        makeWarning(
          'grammar-duplicate-slug',
          `Duplicate grammar pattern slug "${resolvedSlug}". The second occurrence will overwrite the first downstream.`,
          'warn',
          { vault_path, context: { slug: resolvedSlug } },
        ),
      );
    }
    seenSlugs.add(resolvedSlug);

    const name_en = pickField(rows, 'name_en') ?? resolvedSlug;
    const pienemann_stage = coerceInteger(pickField(rows, 'pienemann_stage'));
    const cefrBandField = pickField(rows, 'cefr_band') ?? cefr_band;
    const level_code = coerceCefrLetter(cefrBandField);

    const moduleField = pickField(rows, 'module_introduced');
    const moduleMatches = moduleField ? moduleField.match(MODULE_LINK_RE) : null;
    const module_introduced = moduleMatches?.[0] ?? null;

    const srsRaw = pickField(rows, 'srs_cloze_candidate');
    const srs_cloze_candidate = srsRaw ? parseBooleanCell(srsRaw) === true : false;

    const notes: Record<string, unknown> = {};
    for (const row of rows) {
      const label = (row['field'] ?? row['key'] ?? '')
        .replace(/^\*+|\*+$/g, '')
        .replace(/^`+|`+$/g, '')
        .trim()
        .toLowerCase();
      const value = cellOrNull(row['value'] ?? row['val']);
      if (!label) continue;
      // Skip fields we already structured above; keep the rest in notes.
      if (
        [
          'slug',
          'name_en',
          'pienemann_stage',
          'cefr_band',
          'module_introduced',
          'srs_cloze_candidate',
        ].includes(label)
      ) {
        continue;
      }
      notes[label] = value;
    }

    const tags: string[] = [];
    if (pienemann_stage != null) tags.push(`pienemann:${pienemann_stage}`);
    if (module_introduced) tags.push(`module:${module_introduced}`);

    patterns.push({
      slug: resolvedSlug,
      name_en,
      pienemann_stage,
      cefr_band: cefrBandField,
      level_code,
      module_introduced,
      dutch_pattern: pickField(rows, 'dutch_pattern'),
      english_meaning: pickField(rows, 'english_meaning'),
      spanish_contrast: pickField(rows, 'spanish_contrast'),
      examples: pickExamples(rows),
      common_mistake: pickField(rows, 'common_mistake'),
      practice_activity: pickField(rows, 'practice_activity'),
      srs_cloze_candidate,
      tags,
      notes,
    });
  }

  if (patterns.length === 0) {
    warnings.push(
      makeWarning(
        'grammar-registry-empty',
        'No grammar patterns extracted. Check heading format `### N. \\`slug\\``.',
        'warn',
        { vault_path },
      ),
    );
  }

  const value: ParsedGrammarRegistry = {
    type: 'grammar-pattern-registry',
    cefr_band,
    covers_modules,
    total_patterns: coerceInteger(raw.total_patterns),
    status: isString(raw.status) ? raw.status.trim() : null,
    tags: coerceStringArray(raw.tags),
    created: isString(raw.created) ? raw.created : null,
    updated: isString(raw.updated) ? raw.updated : null,
    patterns,
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
    'total_patterns',
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
