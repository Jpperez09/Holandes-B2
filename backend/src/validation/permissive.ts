import type { CefrBand, CefrLetter, ContentType } from '../types/content';
import type { ParserWarning } from '../types/parser';
import { makeWarning } from '../types/parser';
import type { MarkdownTable } from '../markdown/tables';

export const KNOWN_TYPES: ReadonlySet<ContentType> = new Set<ContentType>([
  'module',
  'level',
  'vocabulary-seed',
  'grammar-pattern-registry',
  'daily-log',
  'resource',
  'lesson',
  'vocabulary',
  'grammar',
  'reading',
  'listening',
  'writing',
]);

export const MODULE_ID_RE = /^MOD-\d{3,}$/;
export const SLUG_RE = /^[a-z0-9-]+$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const CEFR_BAND_RE = /^[ABC][0-2](?:-[ABC][0-2])?$/;
export const CEFR_LETTER_RE = /^[ABC][0-2]$/;

export function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export function coerceStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string | number => entry != null)
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
}

export function coerceInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function coerceCefrLetter(band: CefrBand | string | null | undefined): CefrLetter | null {
  if (!band || typeof band !== 'string') return null;
  const match = band.trim().match(/^([ABC][0-2])/);
  if (!match) return null;
  return match[1] as CefrLetter;
}

export function parseEstimatedMinutes(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    // Accept "30", "30 min", "30m", "0:30", "30-45 min" → 30
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const match = trimmed.match(/(\d+)/);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

export type FieldChecker = (raw: Record<string, unknown>) => ParserWarning[];

export function requireField(
  raw: Record<string, unknown>,
  field: string,
  predicate: (value: unknown) => boolean = (v) => v != null && v !== '',
  vault_path?: string,
): ParserWarning | null {
  if (!Object.prototype.hasOwnProperty.call(raw, field)) {
    return makeWarning(
      'missing-required-field',
      `Missing required frontmatter field "${field}".`,
      'error',
      { field, vault_path },
    );
  }
  if (!predicate(raw[field])) {
    return makeWarning(
      'invalid-required-field',
      `Required frontmatter field "${field}" is empty or invalid.`,
      'error',
      { field, vault_path },
    );
  }
  return null;
}

export function warnOnRegex(
  raw: Record<string, unknown>,
  field: string,
  regex: RegExp,
  vault_path?: string,
): ParserWarning | null {
  const value = raw[field];
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !regex.test(value)) {
    return makeWarning(
      'soft-rule-violation',
      `Field "${field}" does not match expected pattern ${regex}.`,
      'warn',
      { field, vault_path, context: { value } },
    );
  }
  return null;
}

const KNOWN_FRONTMATTER_KEYS_BY_TYPE: Record<string, ReadonlySet<string>> = {
  module: new Set([
    'type',
    'module_id',
    'level',
    'cefr_band',
    'topic',
    'title',
    'subtype',
    'status',
    'estimated_minutes',
    'estimated_time',
    'prerequisites',
    'vocabulary_count',
    'grammar_focus',
    'pronunciation_focus',
    'skills',
    'tags',
    'created',
    'updated',
    'phase',
    'sort_order',
    'unlocks',
  ]),
  level: new Set([
    'type',
    'level',
    'cefr_band',
    'topic',
    'title',
    'status',
    'modules',
    'skills',
    'tags',
    'created',
    'updated',
    'phase',
    'sort_order',
    'unlocks',
  ]),
  'vocabulary-seed': new Set([
    'type',
    'title',
    'cefr_band',
    'covers_modules',
    'total_items',
    'status',
    'tags',
    'created',
    'updated',
  ]),
  'grammar-pattern-registry': new Set([
    'type',
    'title',
    'cefr_band',
    'covers_modules',
    'total_patterns',
    'status',
    'tags',
    'created',
    'updated',
  ]),
  'daily-log': new Set([
    'type',
    'title',
    'date',
    'minutes',
    'activities',
    'streak',
    'mood',
    'tags',
    'created',
    'updated',
  ]),
};

/**
 * Warn about data rows whose cell count does not match the header column count.
 *
 * A mismatch is the classic cause of shifted/garbled columns in a Markdown table
 * (e.g. a vocab row missing its `article` cell pushes every later value left by
 * one). Catching it here surfaces the typo immediately instead of silently
 * storing wrong data. Severity is `warn` — the row is still indexed permissively.
 */
export function malformedTableRowWarnings(
  table: MarkdownTable,
  vault_path?: string,
  context?: string,
): ParserWarning[] {
  return table.malformedRows.map((m) =>
    makeWarning(
      'table-row-column-mismatch',
      `Table row at line ${m.line}${context ? ` in "${context}"` : ''} has ` +
        `${m.cellCount} cell(s) but the header declares ${m.headerCount} column(s). ` +
        `A missing or extra cell shifts every column — check this row.`,
      'warn',
      {
        vault_path,
        field: 'table-row',
        context: { line: m.line, cellCount: m.cellCount, headerCount: m.headerCount },
      },
    ),
  );
}

export function unknownFieldWarnings(
  raw: Record<string, unknown>,
  type: string,
  vault_path?: string,
): ParserWarning[] {
  const known = KNOWN_FRONTMATTER_KEYS_BY_TYPE[type];
  if (!known) return [];
  const warnings: ParserWarning[] = [];
  for (const key of Object.keys(raw)) {
    if (!known.has(key)) {
      warnings.push(
        makeWarning('unknown-frontmatter-field', `Unknown frontmatter field "${key}".`, 'info', {
          field: key,
          vault_path,
        }),
      );
    }
  }
  return warnings;
}
