import { describe, expect, it } from 'vitest';
import {
  extractMarkdownTables,
  splitByHeadings,
  stripCellFormatting,
} from '../src/markdown/tables';

describe('extractMarkdownTables', () => {
  it('parses a simple table with headers', () => {
    const body = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;
    const tables = extractMarkdownTables(body);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['name', 'age']);
    expect(tables[0].rows).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  it('skips text without a separator row', () => {
    const body = `| just | text |\nnot a table\n`;
    expect(extractMarkdownTables(body)).toHaveLength(0);
  });

  it('handles escaped pipes', () => {
    const body = `
| a | b |
|---|---|
| has \\| pipe | ok |
`;
    const tables = extractMarkdownTables(body);
    expect(tables[0].rows[0]).toEqual({ a: 'has | pipe', b: 'ok' });
  });
});

describe('splitByHeadings', () => {
  it('produces nested sections by heading level', () => {
    const body = `## 2. Items

intro text

### 2.1. First

content A

### 2.2. Second

content B

## 3. Other

ignored`;
    const sections = splitByHeadings(body);
    const titles = sections.map((s) => s.title);
    expect(titles).toEqual(['2. Items', '2.1. First', '2.2. Second', '3. Other']);
    const sub1 = sections.find((s) => s.title === '2.1. First')!;
    expect(sub1.content).toContain('content A');
    expect(sub1.content).not.toContain('content B');
  });
});

describe('stripCellFormatting', () => {
  it('strips emphasis and code fences', () => {
    expect(stripCellFormatting('**bold**')).toBe('bold');
    expect(stripCellFormatting('*italic*')).toBe('italic');
    expect(stripCellFormatting('`code`')).toBe('code');
    expect(stripCellFormatting('  spaced  ')).toBe('spaced');
  });
});
