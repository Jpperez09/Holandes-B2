import grayMatter from 'gray-matter';
import { createHash } from 'node:crypto';
import type { ParserWarning } from '../types/parser';
import { makeWarning } from '../types/parser';

export interface FrontmatterResult {
  raw: Record<string, unknown>;
  body: string;
  checksum: string;
  warnings: ParserWarning[];
}

export function checksum(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function parseFrontmatter(source: string, vault_path?: string): FrontmatterResult {
  const warnings: ParserWarning[] = [];
  let parsed: ReturnType<typeof grayMatter>;
  try {
    parsed = grayMatter(source);
  } catch (err) {
    warnings.push(
      makeWarning(
        'invalid-frontmatter-yaml',
        `Could not parse frontmatter YAML: ${(err as Error).message}`,
        'error',
        { vault_path },
      ),
    );
    return {
      raw: {},
      body: source,
      checksum: checksum(source),
      warnings,
    };
  }

  const raw = (parsed.data ?? {}) as Record<string, unknown>;
  return {
    raw,
    body: parsed.content ?? '',
    checksum: checksum(source),
    warnings,
  };
}

export interface SerializeFrontmatterInput {
  data: Record<string, unknown>;
  body: string;
}

const QUOTE_REGEX = /[:#&*?{}[\],|<>=!%@`"'\n]/;

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  const str = String(value);
  if (str === '') return '""';
  if (QUOTE_REGEX.test(str) || /^\s|\s$/.test(str)) {
    return JSON.stringify(str);
  }
  return str;
}

function formatArray(value: unknown[]): string {
  if (value.length === 0) return '[]';
  const items = value.map((entry) => formatScalar(entry));
  return `[${items.join(', ')}]`;
}

export function serializeFrontmatter(input: SerializeFrontmatterInput): string {
  const lines: string[] = ['---'];
  for (const [key, value] of Object.entries(input.data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${formatArray(value)}`);
    } else if (value && typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${formatScalar(value)}`);
    }
  }
  lines.push('---');
  const fm = lines.join('\n');
  const body = input.body.startsWith('\n') ? input.body : `\n${input.body}`;
  return `${fm}${body}`;
}
