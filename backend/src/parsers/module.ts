import {
  type ActivityType,
  type ParsedActivity,
  type ParsedModule,
} from '../types/content';
import type { ParserResult, ParserWarning } from '../types/parser';
import { makeWarning } from '../types/parser';
import { parseFrontmatter } from '../markdown/frontmatter';
import {
  coerceInteger,
  coerceStringArray,
  isString,
  MODULE_ID_RE,
  parseEstimatedMinutes,
  requireField,
  unknownFieldWarnings,
  warnOnRegex,
} from '../validation/permissive';
import {
  extractMarkdownTables,
  splitByHeadings,
  stripCellFormatting,
  type MarkdownTable,
} from '../markdown/tables';

const ACTIVITY_HEADING_RE = /^(?:#{1,6}\s+)?(?:\d+\.\s+)?activities\b/i;
const VALID_ACTIVITY_TYPES: ReadonlySet<ActivityType> = new Set<ActivityType>([
  'vocab',
  'grammar',
  'reading',
  'listening',
  'writing',
  'speaking',
  'freeform',
  'real-world',
]);

function normalizeActivityType(raw: string): ActivityType {
  const value = stripCellFormatting(raw).toLowerCase().trim();
  if (!value) return 'unknown';
  if (VALID_ACTIVITY_TYPES.has(value as ActivityType)) {
    return value as ActivityType;
  }
  // Common aliases
  if (value === 'vocabulary') return 'vocab';
  if (value === 'real world' || value === 'realworld') return 'real-world';
  return 'unknown';
}

function findActivitiesTable(body: string): MarkdownTable | null {
  const sections = splitByHeadings(body);
  for (const section of sections) {
    if (!ACTIVITY_HEADING_RE.test(section.title)) continue;
    const tables = extractMarkdownTables(section.content);
    if (tables.length === 0) continue;
    // Prefer tables whose header includes both 'type' and 'activity' (or '#').
    const best =
      tables.find(
        (t) => t.headers.includes('type') && (t.headers.includes('activity') || t.headers.includes('#')),
      ) ?? tables[0];
    return best;
  }
  return null;
}

function parseActivities(body: string, vault_path: string): {
  activities: ParsedActivity[];
  warnings: ParserWarning[];
} {
  const table = findActivitiesTable(body);
  const warnings: ParserWarning[] = [];
  if (!table) {
    return { activities: [], warnings };
  }

  const headers = table.headers;
  const slugKey = headers.includes('#') ? '#' : headers.find((h) => h === 'slug') ?? null;
  const typeKey = headers.includes('type') ? 'type' : null;
  const titleKey = headers.includes('activity')
    ? 'activity'
    : headers.includes('title')
      ? 'title'
      : headers.includes('description')
        ? 'description'
        : null;
  const timeKey =
    headers.find((h) => h === 'estimated time' || h === 'estimated_time' || h === 'time' || h === 'minutes') ??
    null;

  const activities: ParsedActivity[] = [];
  table.rows.forEach((row, index) => {
    const rawSlug = slugKey ? row[slugKey] ?? '' : '';
    const slug = stripCellFormatting(rawSlug) || `A${index + 1}`;
    const rawType = typeKey ? row[typeKey] ?? '' : '';
    const rawTitle = titleKey ? row[titleKey] ?? '' : '';
    const rawTime = timeKey ? row[timeKey] ?? '' : '';

    const title = stripCellFormatting(rawTitle);
    if (!title) {
      warnings.push(
        makeWarning(
          'activity-row-skipped',
          `Activity row #${index + 1} skipped: missing title.`,
          'warn',
          { vault_path, field: 'activities', context: { row } },
        ),
      );
      return;
    }

    const type = normalizeActivityType(rawType);
    if (type === 'unknown' && rawType.trim() !== '') {
      warnings.push(
        makeWarning(
          'activity-type-unknown',
          `Activity row "${slug}" has unrecognized type "${rawType.trim()}". Stored as "unknown".`,
          'info',
          { vault_path, field: 'activities', context: { slug, raw_type: rawType } },
        ),
      );
    }

    activities.push({
      slug,
      type,
      title,
      estimated_minutes: parseEstimatedMinutes(rawTime),
      raw_type: rawType.trim(),
      raw_estimated_time: rawTime.trim() || null,
    });
  });

  return { activities, warnings };
}

export interface ParseModuleInput {
  source: string;
  vault_path: string;
}

export function parseModuleFile(input: ParseModuleInput): ParserResult<ParsedModule> {
  const { source, vault_path } = input;
  const warnings: ParserWarning[] = [];
  const { raw, body, checksum, warnings: fmWarnings } = parseFrontmatter(source, vault_path);
  warnings.push(...fmWarnings);

  if (fmWarnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  // Hard rules (Markdown_Data_Model §6.1).
  const typeWarn = requireField(raw, 'type', (v) => v === 'module', vault_path);
  if (typeWarn) {
    warnings.push({ ...typeWarn, code: 'wrong-type-for-parser', message: 'Expected type=module.' });
    return { ok: false, value: null, warnings };
  }
  for (const required of ['module_id', 'level', 'cefr_band'] as const) {
    const w = requireField(raw, required, undefined, vault_path);
    if (w) warnings.push(w);
  }
  if (warnings.some((w) => w.severity === 'error')) {
    return { ok: false, value: null, warnings };
  }

  // Soft rules (Markdown_Data_Model §6.2).
  const moduleIdWarn = warnOnRegex(raw, 'module_id', MODULE_ID_RE, vault_path);
  if (moduleIdWarn) warnings.push(moduleIdWarn);

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

  const topic =
    (isString(raw.topic) && raw.topic.trim()) || (isString(raw.title) && raw.title.trim()) || '';

  warnings.push(...unknownFieldWarnings(raw, 'module', vault_path));

  const { activities, warnings: activityWarnings } = parseActivities(body, vault_path);
  warnings.push(...activityWarnings);

  const value: ParsedModule = {
    type: 'module',
    module_id: String(raw.module_id).trim(),
    level,
    cefr_band,
    topic,
    title: topic,
    subtype: isString(raw.subtype) ? raw.subtype.trim() : null,
    status: isString(raw.status) ? raw.status.trim() : null,
    estimated_minutes:
      coerceInteger(raw.estimated_minutes) ?? coerceInteger(raw.estimated_time) ?? null,
    prerequisites: coerceStringArray(raw.prerequisites),
    vocabulary_count: coerceInteger(raw.vocabulary_count),
    grammar_focus: coerceStringArray(raw.grammar_focus),
    pronunciation_focus: coerceStringArray(raw.pronunciation_focus),
    tags: coerceStringArray(raw.tags),
    created: isString(raw.created) ? raw.created : null,
    updated: isString(raw.updated) ? raw.updated : null,
    activities,
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
