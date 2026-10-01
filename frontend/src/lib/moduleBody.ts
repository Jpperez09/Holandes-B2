// Turns the Markdown body of a module into the pieces ModuleDetail shows, in
// the module's own order. Pure TypeScript (no React) so it can be tested.
//
// The module body numbers its sections ("## 8. Listening Practice",
// "### 8.1. Dialogue for shadowing") and the activities point at them
// ("Listen to the dialogue in §8.1"), so every numbered heading gets an anchor.

/** Anchor id for a section number: "8.1" -> "sec-8-1". */
export const sectionAnchor = (num: string): string => `sec-${num.replace(/\./g, '-')}`;

/** Anchor id for a heading that starts with a number ("8.1. Dialogue…"), if it does. */
export function headingAnchor(text: string): string | undefined {
  const m = text.match(/^(\d+(?:\.\d+)*)\.?\s/);
  return m ? sectionAnchor(m[1]) : undefined;
}

/** Section numbers an activity points at: "…in §8.1 and §6.3" -> ["8.1", "6.3"]. */
export function activityRefs(text: string): string[] {
  const refs = [...text.matchAll(/§\s?(\d+(?:\.\d+)*)/g)].map((m) => m[1]);
  return [...new Set(refs)];
}

export type StudyItem =
  | { kind: 'md'; markdown: string }
  /** An answer key: shown folded behind a "Ver respuestas" button. */
  | { kind: 'answers'; heading: string; number: string | null; markdown: string };

export interface StudySection {
  /** "8" for "## 8. Listening Practice"; null when the heading is not numbered. */
  number: string | null;
  title: string;
  isActivities: boolean;
  /** Text before the first "###" (for the activities section: without its table). */
  intro: string;
  items: StudyItem[];
  /** Every section number inside this section (itself and its "###" parts). */
  refs: string[];
}

// Sections the page already shows in its own friendlier form (objectives, words,
// grammar, the real-world task)…
const SHOWN_ELSEWHERE = /learning objective|vocabulary|grammar|real.?world/i;
// …and author-facing metadata the learner does not need.
const METADATA = /prerequisite|completion criteria|app metadata|srs card|weak-area|cross-reference/i;
const ANSWER_KEY = /answer key|answers|respuestas|clave/i;
const ACTIVITIES = /^activities$/i;

interface RawHeading {
  level: number;
  text: string;
  line: number;
}

/** Headings of a Markdown text, ignoring any "#" line inside a fenced code block. */
function scanHeadings(lines: string[]): RawHeading[] {
  const found: RawHeading[] = [];
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (m) found.push({ level: m[1].length, text: m[2], line: i });
  });
  return found;
}

function splitNumber(heading: string): { number: string | null; title: string } {
  const m = heading.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);
  return m ? { number: m[1], title: m[2] } : { number: null, title: heading };
}

const join = (lines: string[]): string => lines.join('\n').trim();

/** Every "##" section of the body, in order, with the sub-sections already split out. */
export function splitModuleBody(body: string): StudySection[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const headings = scanHeadings(lines);
  const sections: StudySection[] = [];

  headings.forEach((h, hi) => {
    if (h.level !== 2) return;
    const next = headings.slice(hi + 1).find((x) => x.level <= 2);
    const end = next ? next.line : lines.length;
    const subs = headings.filter((x) => x.level === 3 && x.line > h.line && x.line < end);

    const { number, title } = splitNumber(h.text);
    const isActivities = ACTIVITIES.test(title);
    const introEnd = subs.length > 0 ? subs[0].line : end;
    let introLines = lines.slice(h.line + 1, introEnd);
    // The activities table is already the page's checklist: do not show it twice.
    if (isActivities) introLines = introLines.filter((l) => !l.trim().startsWith('|'));

    const items: StudyItem[] = [];
    let buffer: string[] = [];
    const flush = () => {
      if (join(buffer)) items.push({ kind: 'md', markdown: join(buffer) });
      buffer = [];
    };
    subs.forEach((sub, si) => {
      const subEnd = si + 1 < subs.length ? subs[si + 1].line : end;
      const subLines = lines.slice(sub.line, subEnd);
      const { number: subNumber, title: subTitle } = splitNumber(sub.text);
      if (ANSWER_KEY.test(subTitle)) {
        flush();
        items.push({ kind: 'answers', heading: sub.text, number: subNumber, markdown: join(subLines.slice(1)) });
      } else {
        buffer.push(...subLines, '');
      }
    });
    flush();

    const refs = [number, ...subs.map((s) => splitNumber(s.text).number)].filter((n): n is string => n !== null);
    sections.push({ number, title, isActivities, intro: join(introLines), items, refs });
  });

  return sections;
}

/** True for the sections ModuleDetail adds under the grammar block: pronunciation, exercises, listening, … */
export const isStudySection = (s: StudySection): boolean =>
  !SHOWN_ELSEWHERE.test(s.title) && !METADATA.test(s.title);

/** True for sections that never appear on the page (author-facing metadata). */
export const isMetadataSection = (s: StudySection): boolean => METADATA.test(s.title);

export function studySections(body: string): StudySection[] {
  return splitModuleBody(body).filter(isStudySection);
}
