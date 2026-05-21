// Static Library content — 6 research-inspired insight cards.
//
// Frontend-only (Juanpa decisions 1-4): no backend, no DB, no parser.
// Paraphrased from the project's own research notes — NO invented direct quotes.
// Each card cites the concept and the researchers as named in the vault
// (RESEARCH_SYNTHESIS.md, Juanpa_Methodology_V1.md, Grammar_Patterns_A0_A1.md).

export interface Insight {
  id: string;
  emoji: string;
  title: string;
  explanation: string;
  basedOn: string;
  tryToday: string;
}

export const INSIGHTS: Insight[] = [
  {
    id: 'retrieval',
    emoji: '🧠',
    title: 'Why retrieval practice works',
    explanation:
      "Pulling a word back out of your memory is very different from re-reading it. The small effort of recalling — even when it feels slow — is what actually strengthens the memory. Re-reading feels easier, but it teaches your brain much less.",
    basedOn:
      'Concept: practice testing / retrieval practice. Paraphrased from research summarised in the project notes, citing Roediger & Karpicke (2006).',
    tryToday:
      'In your vocabulary review, always try to remember the meaning before pressing "Show answer" — even a wrong guess helps.',
  },
  {
    id: 'word-order',
    emoji: '🔀',
    title: 'Why Dutch word order feels strange',
    explanation:
      "In Dutch, the verb likes to sit in second position in a main sentence. So 'Today I work' becomes, literally, 'Today work I' (Vandaag werk ik). Spanish and English don't do this, so it feels backwards at first. It stops feeling strange with practice — your ear adjusts.",
    basedOn:
      "Concept: V2 word order — described in the project's grammar notes as the first big Spanish-speaker trap.",
    tryToday:
      "When you build a Dutch sentence, check: is the verb in the second spot? If you started with a time word, the verb comes right after it.",
  },
  {
    id: 'de-het',
    emoji: '🏷️',
    title: 'Why "de" and "het" matter',
    explanation:
      "Every Dutch noun is either a 'de' word or a 'het' word, and there's no reliable rule to predict which. Trying to guess later is hard. The fix is simple: learn the little word together with the noun, as one unit — 'het huis', not just 'huis'.",
    basedOn:
      'Concept: article assignment is largely unpredictable — from the project grammar notes; memorise the article with the noun.',
    tryToday:
      'When a noun card appears in review, say the whole thing out loud with its article: "de stoel", "het boek".',
  },
  {
    id: 'active-listening',
    emoji: '🎧',
    title: 'Why listening needs active practice',
    explanation:
      "Having Dutch playing in the background is pleasant, but it mostly builds familiarity, not real understanding. Listening turns into learning when you do something with it — answer a question, retell what you heard, or repeat a sentence out loud.",
    basedOn:
      "Concept: passive listening is exposure, not retrieval — from the project methodology's 'what not to do' guidance.",
    tryToday:
      'After a listening activity, pause and say (or write) one sentence about what you just heard, without replaying it.',
  },
  {
    id: 'speak-early',
    emoji: '🗣️',
    title: 'Why speaking early helps',
    explanation:
      "Waiting until your grammar feels 'ready' before speaking is the most common trap. Speaking — even clumsily — shows you exactly which words and patterns you're missing. Those gaps are the most useful thing to practise next.",
    basedOn:
      'Concept: the output hypothesis — paraphrased from the project research, citing Swain (1985).',
    tryToday:
      "Say one full Dutch sentence out loud today, even a simple one. Mistakes are fine — that's the point.",
  },
  {
    id: 'short-daily',
    emoji: '⏱️',
    title: 'Why short daily sessions beat cramming',
    explanation:
      "A short session every day beats one long session per week. The gaps between days are not wasted time — each gap is itself a little memory workout. Spreading practice out is one of the most reliable ways to make learning stick.",
    basedOn:
      'Concept: distributed practice / the spacing effect — paraphrased from the project research, citing Cepeda et al. (2006).',
    tryToday:
      "Even on a busy day, do five minutes of review. Showing up daily matters more than any single long session.",
  },
];
