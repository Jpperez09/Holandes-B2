import React from 'react';

// A small, dependency-free Markdown renderer.
// Handles headings, paragraphs, lists, tables, blockquotes, rules, and inline
// formatting — enough for the curriculum module sections we display. Kept
// in-house deliberately to avoid adding a Markdown library dependency.

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function isTableSeparator(line: string | undefined): boolean {
  if (!line) return false;
  return line.includes('-') && /^\s*\|?[\s:|-]+\|?\s*$/.test(line);
}

function isTableStart(lines: string[], idx: number): boolean {
  return lines[idx]?.includes('|') === true && isTableSeparator(lines[idx + 1]);
}

let inlineKey = 0;

/** Parse inline formatting into React nodes. */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\))/;
  let rest = text;

  while (rest.length > 0) {
    const m = rest.match(pattern);
    if (!m || m.index === undefined) {
      nodes.push(rest);
      break;
    }
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    const tok = m[0];
    const key = `i${inlineKey++}`;

    if (tok.startsWith('`')) {
      nodes.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('**')) {
      nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('*')) {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith('_')) {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith('[[')) {
      // Wikilink — vault-internal; show only the readable label, no broken link.
      const inner = tok.slice(2, -2);
      const label = inner.includes('|')
        ? inner.split('|')[1]
        : (inner.split('/').pop() ?? inner);
      nodes.push(
        <span key={key} className="faint">
          {label}
        </span>,
      );
    } else {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) {
        const url = lm[2];
        const external = /^https?:/i.test(url);
        nodes.push(
          <a
            key={key}
            href={external ? url : '#'}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {lm[1]}
          </a>,
        );
      } else {
        nodes.push(tok);
      }
    }
    rest = rest.slice(m.index + tok.length);
  }
  return nodes;
}

export function Markdown({ source }: { source: string }): React.JSX.Element {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const nk = (): string => `b${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length, 4);
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
      blocks.push(<Tag key={nk()}>{renderInline(h[2])}</Tag>);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={nk()} />);
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={nk()}>{renderInline(buf.join(' '))}</blockquote>,
      );
      continue;
    }

    // Table
    if (isTableStart(lines, i)) {
      const headers = splitRow(lines[i]);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <table key={nk()}>
          <thead>
            <tr>
              {headers.map((c, ci) => (
                <th key={ci}>{renderInline(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td key={ci}>{renderInline(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={nk()}>
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={nk()}>
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]) &&
      !isTableStart(lines, i)
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length > 0) {
      blocks.push(<p key={nk()}>{renderInline(para.join(' '))}</p>);
    } else {
      i++; // safety against an unconsumed line
    }
  }

  return <div className="md">{blocks}</div>;
}

/**
 * Extract a single `## ` section from a Markdown body by a heading-text matcher.
 * Returns the section body (without its heading), or null if not found.
 */
export function extractSection(
  body: string,
  matcher: RegExp,
): string | null {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (m && matcher.test(m[2])) {
      start = i;
      level = m[1].length;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+/);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n').trim() || null;
}
