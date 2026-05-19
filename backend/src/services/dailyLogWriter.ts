import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseFrontmatter, serializeFrontmatter } from '../markdown/frontmatter';
import { toPosix } from '../vault/reader';

/** Canonical delimiters per Markdown_Data_Model §3.8.1. */
export const SUMMARY_BEGIN = '<!-- app:summary:begin -->';
export const SUMMARY_END = '<!-- app:summary:end -->';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface DailyLogInput {
  /** Absolute path to the vault root. */
  vault_path: string;
  /** Log date in YYYY-MM-DD format. */
  date: string;
  /** Free-form user notes (kept outside the auto-summary block). */
  notes: string;
  /** Auto-generated summary body (the lines between the delimiters). */
  auto_summary?: string;
  /** Frontmatter values populated by the app at save time. */
  meta?: DailyLogMeta;
  /** Override current time (mostly for tests). Defaults to new Date(). */
  now?: Date;
}

export interface DailyLogMeta {
  minutes?: number;
  activities?: number;
  streak?: number;
  mood?: string | null;
  extra?: Record<string, unknown>;
}

export interface DailyLogWriteResult {
  vault_path: string;
  markdown_path: string;
  created: boolean;
  bytes_written: number;
  /** ISO timestamp used as `updated` in the frontmatter. */
  updated_at: string;
}

export function assertDateString(date: string): void {
  if (!DATE_RE.test(date)) {
    throw new Error(`Daily log date must be YYYY-MM-DD, got "${date}".`);
  }
}

export function resolveDailyLogPath(vaultRoot: string, date: string): string {
  assertDateString(date);
  return path.join(vaultRoot, '04_Daily_Logs', `${date}.md`);
}

interface SplitContent {
  preDelimiter: string;
  postDelimiter: string;
  hasDelimiters: boolean;
}

/**
 * Split the body around the canonical summary delimiters. Anything between the
 * delimiters is discarded (will be regenerated); anything outside is preserved
 * verbatim.
 */
function splitOnDelimiters(body: string): SplitContent {
  const beginIdx = body.indexOf(SUMMARY_BEGIN);
  const endIdx = body.indexOf(SUMMARY_END);
  if (beginIdx < 0 || endIdx < 0 || endIdx < beginIdx) {
    return { preDelimiter: body, postDelimiter: '', hasDelimiters: false };
  }
  return {
    preDelimiter: body.slice(0, beginIdx).replace(/\s+$/, ''),
    postDelimiter: body.slice(endIdx + SUMMARY_END.length).replace(/^\s+/, ''),
    hasDelimiters: true,
  };
}

/** Build the auto-summary section. The caller may pass a pre-rendered body. */
function renderSummaryBlock(summary: string | undefined): string {
  const trimmed = (summary ?? '').trim();
  const inner = trimmed === '' ? '## Summary\n\n_(no activity yet today)_' : trimmed;
  return `${SUMMARY_BEGIN}\n${inner}\n${SUMMARY_END}`;
}

interface ComposeOptions {
  date: string;
  notes: string;
  auto_summary?: string;
  meta: DailyLogMeta;
  /** Original file content if it already exists. */
  existing?: string;
  now: Date;
}

export function composeDailyLog(opts: ComposeOptions): {
  serialized: string;
  preservedUserNotes: boolean;
} {
  const isoNow = opts.now.toISOString();
  let existingFrontmatter: Record<string, unknown> = {};
  let preservedBody = '';
  let hadDelimiters = false;
  let manualBody = '';

  if (opts.existing) {
    const fm = parseFrontmatter(opts.existing);
    existingFrontmatter = fm.raw;
    const split = splitOnDelimiters(fm.body);
    hadDelimiters = split.hasDelimiters;
    manualBody = (split.preDelimiter + (split.postDelimiter ? `\n\n${split.postDelimiter}` : '')).trim();
  }

  // Decide what the "notes" section should be. Rule: if the user-supplied
  // `notes` is empty AND the file already exists with preserved manual body,
  // keep the manual body. Otherwise overwrite with the supplied notes.
  const incomingNotes = opts.notes ?? '';
  const finalNotes = incomingNotes.trim().length > 0 ? incomingNotes.trim() : manualBody;
  const preservedUserNotes = manualBody.length > 0 && finalNotes === manualBody;

  const created = (existingFrontmatter.created as string) || isoNow;

  const frontmatter: Record<string, unknown> = {
    type: 'daily-log',
    title: opts.date,
    date: opts.date,
    minutes: opts.meta.minutes ?? 0,
    activities: opts.meta.activities ?? 0,
    streak: opts.meta.streak ?? 0,
    mood: opts.meta.mood ?? null,
    created,
    updated: isoNow,
    tags: ['daily-log'],
    ...(opts.meta.extra ?? {}),
  };

  const heading = `# ${opts.date}`;
  const notesSection = finalNotes
    ? `## Notes\n\n${finalNotes}`
    : '## Notes\n\n_(empty)_';
  const summary = renderSummaryBlock(opts.auto_summary);

  const body = ['', heading, '', notesSection, '', summary, ''].join('\n');
  return {
    serialized: serializeFrontmatter({ data: frontmatter, body }),
    preservedUserNotes: hadDelimiters && preservedUserNotes,
  };
}

/**
 * Read the current daily log for a given date, if any. Returns null when the
 * file does not exist.
 */
export async function readDailyLog(
  vault_path: string,
  date: string,
): Promise<{ markdown_path: string; content: string } | null> {
  const markdown_path = resolveDailyLogPath(vault_path, date);
  try {
    const content = await fs.readFile(markdown_path, 'utf8');
    return { markdown_path, content };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Atomically write today's daily log into the vault. Preserves any content
 * outside the canonical summary delimiters.
 */
export async function writeDailyLog(input: DailyLogInput): Promise<DailyLogWriteResult> {
  assertDateString(input.date);
  const markdown_path = resolveDailyLogPath(input.vault_path, input.date);
  const dir = path.dirname(markdown_path);
  const now = input.now ?? new Date();

  await fs.mkdir(dir, { recursive: true });

  let existing: string | undefined;
  let created = true;
  try {
    existing = await fs.readFile(markdown_path, 'utf8');
    created = false;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  const composed = composeDailyLog({
    date: input.date,
    notes: input.notes,
    auto_summary: input.auto_summary,
    meta: input.meta ?? {},
    existing,
    now,
  });

  const tmpPath = path.join(dir, `.${path.basename(markdown_path)}.tmp`);
  const buffer = Buffer.from(composed.serialized, 'utf8');

  // Open + write + fsync, then rename atomically.
  const handle = await fs.open(tmpPath, 'w');
  try {
    await handle.writeFile(buffer);
    try {
      await handle.sync();
    } catch {
      // fsync may fail on some filesystems; safe to ignore for MVP.
    }
  } finally {
    await handle.close();
  }
  await fs.rename(tmpPath, markdown_path);

  return {
    vault_path: input.vault_path,
    markdown_path: toPosix(markdown_path),
    created,
    bytes_written: buffer.length,
    updated_at: now.toISOString(),
  };
}
