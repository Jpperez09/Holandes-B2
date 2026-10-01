// Splits the text of a module's dialogue block (the ``` block in section 8.1)
// into the lines a speech voice should read.

export interface DialogueLine {
  /** "Anna" in "Anna: Hallo!"; null for a monologue or a line with no label. */
  speaker: string | null;
  /** What is said, without the speaker label. */
  text: string;
}

// A label is a short name before a colon: "Anna:", "Mevrouw Jansen:".
const LABEL = /^([A-ZÀ-Ý][^:\n.!?]{0,24}):\s+(\S.*)$/;

export function parseDialogue(code: string): DialogueLine[] {
  const rows = code
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const labelled = rows.map((row) => row.match(LABEL));
  // Only treat the colons as speaker labels when two or more different people
  // talk. A monologue line such as "Ik leer: nul, een, twee" is just text.
  const speakers = new Set(labelled.flatMap((m) => (m ? [m[1]] : [])));
  const isDialogue = speakers.size >= 2;
  return rows.map((row, i) => {
    const m = labelled[i];
    return isDialogue && m ? { speaker: m[1], text: m[2] } : { speaker: null, text: row };
  });
}
