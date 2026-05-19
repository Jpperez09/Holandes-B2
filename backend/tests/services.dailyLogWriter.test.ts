import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SUMMARY_BEGIN,
  SUMMARY_END,
  readDailyLog,
  resolveDailyLogPath,
  writeDailyLog,
} from '../src/services/dailyLogWriter';

let tmpVault: string;

beforeEach(async () => {
  tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'dutch-daily-log-'));
});

afterEach(async () => {
  await fs.rm(tmpVault, { recursive: true, force: true });
});

describe('writeDailyLog', () => {
  it('creates a new daily log file with summary delimiters', async () => {
    const result = await writeDailyLog({
      vault_path: tmpVault,
      date: '2026-05-19',
      notes: 'Day 1 went well.',
      auto_summary: '## Summary\n\n- 0 cards reviewed',
      meta: { minutes: 32, activities: 4, streak: 1 },
      now: new Date('2026-05-19T22:00:00Z'),
    });

    expect(result.created).toBe(true);
    expect(result.markdown_path.endsWith('/04_Daily_Logs/2026-05-19.md')).toBe(true);

    const onDisk = await fs.readFile(
      resolveDailyLogPath(tmpVault, '2026-05-19'),
      'utf8',
    );
    expect(onDisk).toContain('type: daily-log');
    expect(onDisk).toContain('date: 2026-05-19');
    expect(onDisk).toContain('minutes: 32');
    expect(onDisk).toContain('Day 1 went well.');
    expect(onDisk).toContain(SUMMARY_BEGIN);
    expect(onDisk).toContain(SUMMARY_END);
  });

  it('preserves user notes outside the summary delimiters across re-saves', async () => {
    const dailyPath = resolveDailyLogPath(tmpVault, '2026-05-19');

    await writeDailyLog({
      vault_path: tmpVault,
      date: '2026-05-19',
      notes: 'My original notes.',
      auto_summary: '## Summary\n\n- old summary',
      meta: { minutes: 10 },
    });

    // Simulate manual edit in Obsidian — add a line after the summary block.
    let content = await fs.readFile(dailyPath, 'utf8');
    content += '\n## Manual Extra\n\nThis text was added by hand.\n';
    await fs.writeFile(dailyPath, content, 'utf8');

    // Second save with **empty** notes — must keep the manual text intact and
    // refresh only the summary block.
    await writeDailyLog({
      vault_path: tmpVault,
      date: '2026-05-19',
      notes: '',
      auto_summary: '## Summary\n\n- new summary',
      meta: { minutes: 20 },
    });

    const finalContent = await fs.readFile(dailyPath, 'utf8');
    expect(finalContent).toContain('My original notes.');
    expect(finalContent).toContain('This text was added by hand.');
    expect(finalContent).toContain('- new summary');
    expect(finalContent).not.toContain('- old summary');
  });

  it('rejects malformed date strings', async () => {
    await expect(
      writeDailyLog({
        vault_path: tmpVault,
        date: '2026/05/19',
        notes: '',
      }),
    ).rejects.toThrow(/YYYY-MM-DD/);
  });

  it('readDailyLog returns null when the file does not exist', async () => {
    const got = await readDailyLog(tmpVault, '2026-05-19');
    expect(got).toBeNull();
  });

  it('reports created=false on a second save', async () => {
    await writeDailyLog({ vault_path: tmpVault, date: '2026-05-19', notes: 'first' });
    const second = await writeDailyLog({
      vault_path: tmpVault,
      date: '2026-05-19',
      notes: 'second',
    });
    expect(second.created).toBe(false);
  });

  it('returns a markdown_path using POSIX separators', async () => {
    const result = await writeDailyLog({
      vault_path: tmpVault,
      date: '2026-05-19',
      notes: 'test',
    });
    expect(result.markdown_path).not.toContain('\\');
  });
});
