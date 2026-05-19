import type { ParsedLevel } from '../types/content';
import type { ParserResult, ParserWarning } from '../types/parser';
import { makeWarning } from '../types/parser';
import { parseFrontmatter } from '../markdown/frontmatter';
import {
  coerceInteger,
  coerceStringArray,
  isString,
  requireField,
  unknownFieldWarnings,
} from '../validation/permissive';

const TITLE_RE = /^#\s+(.+?)\s*$/m;

export interface ParseLevelInput {
  source: string;
  vault_path: string;
}

export function parseLevelFile(input: ParseLevelInput): ParserResult<ParsedLevel> {
  const { source, vault_path } = input;
  const warnings: ParserWarning[] = [];
  const { raw, body, checksum, warnings: fmWarnings } = parseFrontmatter(source, vault_path);
  warnings.push(...fmWarnings);

  if (fmWarnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  const typeWarn = requireField(raw, 'type', (v) => v === 'level', vault_path);
  if (typeWarn) {
    warnings.push({ ...typeWarn, code: 'wrong-type-for-parser', message: 'Expected type=level.' });
    return { ok: false, value: null, warnings };
  }

  for (const required of ['level', 'cefr_band'] as const) {
    const w = requireField(raw, required, undefined, vault_path);
    if (w) warnings.push(w);
  }
  if (warnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  const level = coerceInteger(raw.level);
  if (level == null) {
    warnings.push(
      makeWarning('invalid-required-field', 'Field "level" is not an integer.', 'error', {
        field: 'level',
        vault_path,
      }),
    );
    return { ok: false, value: null, warnings };
  }
  if (level < 1 || level > 100) {
    warnings.push(
      makeWarning(
        'soft-rule-violation',
        `Field "level" (${level}) is outside the expected range 1–100.`,
        'warn',
        { field: 'level', vault_path },
      ),
    );
  }

  const cefr_band = isString(raw.cefr_band) ? raw.cefr_band.trim() : null;
  if (!cefr_band) {
    warnings.push(
      makeWarning('invalid-required-field', 'Field "cefr_band" is missing or empty.', 'error', {
        field: 'cefr_band',
        vault_path,
      }),
    );
    return { ok: false, value: null, warnings };
  }

  warnings.push(...unknownFieldWarnings(raw, 'level', vault_path));

  // Title fallback: H1 in body, then frontmatter, then "Level NNN".
  const h1 = body.match(TITLE_RE)?.[1]?.trim();
  const fmTitle =
    (isString(raw.title) && raw.title.trim()) || (isString(raw.topic) && raw.topic.trim()) || '';
  const title = h1 || fmTitle || `Level ${String(level).padStart(3, '0')}`;

  const value: ParsedLevel = {
    type: 'level',
    level,
    cefr_band,
    title,
    status: isString(raw.status) ? raw.status.trim() : null,
    modules: coerceStringArray(raw.modules),
    skills: coerceStringArray(raw.skills),
    tags: coerceStringArray(raw.tags),
    created: isString(raw.created) ? raw.created : null,
    updated: isString(raw.updated) ? raw.updated : null,
    body,
    vault_path,
    checksum,
    extra_frontmatter: pickExtra(raw),
  };

  return { ok: true, value, warnings };
}

function pickExtra(raw: Record<string, unknown>): Record<string, unknown> {
  const known = new Set([
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
  ]);
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!known.has(key)) extra[key] = value;
  }
  return extra;
}
