import { createElement } from '../../frontend/node_modules/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// The frontend has no test runner and its dependencies live in frontend/node_modules,
// so the backend's vitest renders the real component through that copy of react-dom.
import { renderToStaticMarkup } from '../../frontend/node_modules/react-dom/server';
import { Markdown } from '../../frontend/src/components/Markdown';
import {
  activityRefs,
  isMetadataSection,
  isStudySection,
  sectionAnchor,
  splitModuleBody,
  studySections,
} from '../../frontend/src/lib/moduleBody';
import { VaultReader } from '../src/vault/reader';
import { resolveVaultPath } from './fixtures/vaultPath';

const render = (source: string, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(Markdown, { source, ...props }));

describe('Markdown: fenced code blocks (docs/SPEC_2026-10_v2.md, P1)', () => {
  const dialogue = [
    'Intro line.',
    '',
    '```',
    'Anna: Hallo Juan! Waar is je tas?',
    'Juan: Ik weet het niet. *Niet* cursief & | geen tabel.',
    '# geen kop',
    '```',
    '',
    'After the block.',
  ].join('\n');

  it('renders a triple-backtick block as one literal <pre><code>, line breaks and speaker labels intact', () => {
    const html = render(dialogue);
    expect(html).toContain('<pre class="md-code"><code>');
    expect(html).toContain('Anna: Hallo Juan! Waar is je tas?\nJuan: Ik weet het niet.');
    expect((html.match(/<pre/g) ?? []).length).toBe(1);
  });

  it('does not interpret Markdown inside the block (emphasis, tables, headings) and escapes HTML', () => {
    const html = render(dialogue);
    const code = html.match(/<code>([\s\S]*?)<\/code>/)![1];
    expect(code).toContain('*Niet* cursief &amp; | geen tabel.');
    expect(code).toContain('# geen kop');
    expect(code).not.toMatch(/<(em|h1|table)/);
  });

  it('keeps the paragraphs around the block, also when the fence follows a line with no blank between', () => {
    const html = render('Intro line.\n```\nAnna: Hoi\n```\nAfter the block.');
    expect(html).toContain('<p>Intro line.</p>');
    expect(html).toContain('<p>After the block.</p>');
    expect(html).toContain('<pre');
  });

  it('accepts an info string after the opening fence', () => {
    const html = render('```yaml\nmodule_id: MOD-014\n```');
    expect(html).toContain('module_id: MOD-014');
    expect(html).not.toContain('```');
  });

  it('survives an unclosed fence by taking the rest of the text as code', () => {
    const html = render('Before\n\n```\nAnna: Hoi\nJuan: Hallo');
    expect(html).toContain('<p>Before</p>');
    expect(html).toContain('Juan: Hallo');
  });

  it('lets a screen draw the block itself (renderCode), passing the code and the info string', () => {
    const seen: Array<[string, string]> = [];
    const html = render('```text\nA: Hoi\nB: Hallo\n```', {
      renderCode: (code: string, info: string) => {
        seen.push([code, info]);
        return createElement('div', { className: 'dialogue' }, code.split('\n').length + ' lines');
      },
    });
    expect(seen).toEqual([['A: Hoi\nB: Hallo', 'text']]);
    expect(html).toContain('<div class="dialogue">2 lines</div>');
    expect(html).not.toContain('<pre');
  });
});

describe('Markdown: other fixes that the full module body needs', () => {
  it('leaves the blanks of an exercise alone instead of reading ___ as italics', () => {
    const html = render('1. Mijn ___ is niet ___.\n2. Ik heb ___ fiets.');
    expect(html).toContain('Mijn ___ is niet ___.');
    expect(html).not.toContain('<em>');
  });

  it('still renders real _italics_ and *italics*', () => {
    const html = render('Zij is _moe_ en *blij*.');
    expect(html).toContain('<em>moe</em>');
    expect(html).toContain('<em>blij</em>');
  });

  it('gives numbered headings an anchor so an activity can point at them ("see §8.1")', () => {
    const html = render('### 8.1. Dialogue for shadowing\n\n## 10. Writing Practice\n\n### Mini-drill');
    expect(html).toContain('<h3 id="sec-8-1">');
    expect(html).toContain('<h2 id="sec-10">');
    expect(html).toContain('<h3>Mini-drill</h3>');
  });
});

describe('moduleBody helpers', () => {
  it('reads the section numbers an activity points at', () => {
    expect(activityRefs('Say the 8 sentences of §6.2 (key in §6.3), then §6.2 again, and §10.')).toEqual(['6.2', '6.3', '10']);
    expect(activityRefs('Active recall on 14 words.')).toEqual([]);
    expect(sectionAnchor('8.1')).toBe('sec-8-1');
  });

  it('ignores "#" lines inside code blocks when it splits a body into sections', () => {
    const body = ['# T', '', '## 8. Listening', '', '### 8.1. Dialogue', '', '```', '# not a heading', '## nor this', '```', '', '## 9. Speaking', 'Talk.'].join('\n');
    const sections = splitModuleBody(body);
    expect(sections.map((s) => s.title)).toEqual(['Listening', 'Speaking']);
    expect(sections[0].items[0]).toMatchObject({ kind: 'md' });
    expect((sections[0].items[0] as { markdown: string }).markdown).toContain('## nor this');
  });

  it('folds an answer key into its own item and drops the activities table (it is already the checklist)', () => {
    const body = [
      '## 6. Activities',
      '',
      '| # | Type |',
      '|---|---|',
      '| A1 | vocab |',
      '',
      '### 6.1. A3 — fill the gap',
      '',
      '1. Ik heb ___ fiets.',
      '',
      '### 6.3. Answer key',
      '',
      '**A3:** 1 *geen*',
    ].join('\n');
    const [activities] = splitModuleBody(body);
    expect(activities.isActivities).toBe(true);
    expect(activities.intro).toBe('');
    expect(activities.items.map((i) => i.kind)).toEqual(['md', 'answers']);
    expect(activities.items[1]).toMatchObject({ kind: 'answers', number: '6.3', markdown: '**A3:** 1 *geen*' });
    expect(activities.refs).toEqual(['6', '6.1', '6.3']);
  });
});

describe('the whole module body in the app', () => {
  let reader: VaultReader;

  beforeAll(async () => {
    reader = new VaultReader({ vault_path: resolveVaultPath(), watch: false });
    await reader.start();
  });
  afterAll(async () => {
    await reader.stop();
  });

  const modules = () => reader.snapshot().modules;
  const bodyOf = (id: string) => modules().find((m) => m.module_id === id)!.body;

  it('MOD-014 shows 6.1, 6.2, 6.3 (folded), 8.1, 8.4, 9.2 and 10 without leaving the app', () => {
    const sections = studySections(bodyOf('MOD-014'));
    const refs = new Set(sections.flatMap((s) => s.refs));
    for (const ref of ['6.1', '6.2', '6.3', '8.1', '8.4', '9.2', '10']) expect(refs, `§${ref}`).toContain(ref);

    const answers = sections.flatMap((s) => s.items).filter((i) => i.kind === 'answers');
    expect(answers.map((a) => (a as { number: string }).number)).toEqual(['6.3']);

    const text = sections.map((s) => [s.intro, ...s.items.map((i) => i.markdown)].join('\n')).join('\n');
    expect(text).toContain('```');

    // nothing meant for the author leaks into the page
    for (const hidden of ['App Metadata', 'SRS Card Candidates', 'Weak-Area Tags', 'Cross-References', 'Completion Criteria']) {
      expect(sections.map((s) => s.title)).not.toContain(hidden);
    }
    expect(text).not.toContain('module_id:');
  });

  it('MOD-014 renders the 8.1 dialogue as a code block and keeps the answer key out of the unfolded text', () => {
    const sections = studySections(bodyOf('MOD-014'));
    const listening = sections.find((s) => s.number === '8')!;
    const html = renderToStaticMarkup(
      createElement(Markdown, { source: listening.items.map((i) => i.markdown).join('\n\n') }),
    );
    expect(html).toContain('<pre class="md-code">');
    expect(html).toContain('id="sec-8-1"');
    expect(html).toContain('id="sec-8-4"');
    const folded = studySections(bodyOf('MOD-014')).flatMap((s) => s.items).filter((i) => i.kind === 'md');
    expect(folded.map((i) => i.markdown).join('\n')).not.toMatch(/Answer key/);
  });

  it('every "§N" an activity points at exists on the page, in every module', () => {
    const missing: string[] = [];
    for (const m of modules()) {
      const known = new Set(
        splitModuleBody(m.body)
          .filter((s) => !isMetadataSection(s))
          .flatMap((s) => s.refs),
      );
      for (const a of m.activities) {
        for (const ref of activityRefs(a.title)) {
          if (!known.has(ref)) missing.push(`${m.module_id} ${a.slug}: §${ref}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('every module has at most one section of each kind and none of them is empty', () => {
    for (const m of modules()) {
      const study = splitModuleBody(m.body).filter(isStudySection);
      const titles = study.map((s) => s.title);
      expect(new Set(titles).size, `${m.module_id} duplicate titles`).toBe(titles.length);
      for (const s of study) {
        expect(s.intro.length + s.items.length, `${m.module_id} §${s.number} is empty`).toBeGreaterThan(0);
      }
    }
  });
});
