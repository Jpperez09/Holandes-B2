export interface MarkdownTable {
  /** Original raw header cells, lower-cased and trimmed. */
  headers: string[];
  /** Each row is keyed by header. Missing cells become empty strings. */
  rows: Array<Record<string, string>>;
  /** Line in the body where the table started (1-indexed). */
  startLine: number;
}

const PIPE_LINE_RE = /^\s*\|/;
const SEPARATOR_RE = /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/;

function splitRow(line: string): string[] {
  // Strip leading/trailing pipe; handle escaped pipes (\|)
  const trimmed = line.trim();
  const body = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  // Split on '|' that's not preceded by a backslash
  const cells: string[] = [];
  let buf = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && body[i + 1] === '|') {
      buf += '|';
      i++;
      continue;
    }
    if (ch === '|') {
      cells.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  cells.push(buf.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  // Strip surrounding **bold** / `code` / spaces; lowercase.
  return header
    .replace(/^\*+|\*+$/g, '')
    .replace(/^`+|`+$/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Extract every Markdown pipe-table from a Markdown source.
 * Robust to leading/trailing whitespace, headers wrapped in **bold** or `code`,
 * and tables nested under any heading level.
 */
export function extractMarkdownTables(body: string): MarkdownTable[] {
  const lines = body.split(/\r?\n/);
  const tables: MarkdownTable[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (PIPE_LINE_RE.test(line) && i + 1 < lines.length && SEPARATOR_RE.test(lines[i + 1])) {
      const headerCells = splitRow(line).map(normalizeHeader);
      const startLine = i + 1; // 1-indexed
      i += 2; // skip header + separator
      const rows: Array<Record<string, string>> = [];
      while (i < lines.length && PIPE_LINE_RE.test(lines[i])) {
        const cells = splitRow(lines[i]);
        const row: Record<string, string> = {};
        for (let c = 0; c < headerCells.length; c++) {
          row[headerCells[c]] = (cells[c] ?? '').trim();
        }
        rows.push(row);
        i++;
      }
      tables.push({ headers: headerCells, rows, startLine });
      continue;
    }
    i++;
  }

  return tables;
}

export interface HeadingSection {
  /** Heading text without the leading `#`s, trimmed. */
  title: string;
  /** Heading level (1 = `#`, 2 = `##`, etc.). */
  level: number;
  /** Line in body where the heading was found (1-indexed). */
  startLine: number;
  /** Body slice between this heading and the next heading of equal-or-higher level. */
  content: string;
}

/**
 * Slice a markdown body into sections rooted at each heading.
 * Each section contains everything until the next heading of equal or shallower level.
 */
export function splitByHeadings(body: string): HeadingSection[] {
  const lines = body.split(/\r?\n/);
  const headings: Array<{ idx: number; level: number; title: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match) {
      headings.push({ idx: i, level: match[1].length, title: match[2].trim() });
    }
  }

  const sections: HeadingSection[] = [];
  for (let h = 0; h < headings.length; h++) {
    const here = headings[h];
    let endIdx = lines.length;
    for (let k = h + 1; k < headings.length; k++) {
      if (headings[k].level <= here.level) {
        endIdx = headings[k].idx;
        break;
      }
    }
    const content = lines.slice(here.idx + 1, endIdx).join('\n');
    sections.push({
      title: here.title,
      level: here.level,
      startLine: here.idx + 1,
      content,
    });
  }
  return sections;
}

/** Strip Markdown emphasis/code wrappers from a cell value. */
export function stripCellFormatting(cell: string): string {
  let value = cell.trim();
  // Italic: *...* or _..._
  value = value.replace(/^[*_]+|[*_]+$/g, '').trim();
  // Inline code: `...`
  value = value.replace(/^`+|`+$/g, '').trim();
  return value;
}

/** Parse a boolean-ish cell: true/false/yes/no/—. Returns null if unrecognized. */
export function parseBooleanCell(cell: string): boolean | null {
  const v = stripCellFormatting(cell).toLowerCase();
  if (v === '' || v === '—' || v === '-' || v === 'null') return null;
  if (v === 'true' || v === 'yes' || v === 'y') return true;
  if (v === 'false' || v === 'no' || v === 'n') return false;
  return null;
}
