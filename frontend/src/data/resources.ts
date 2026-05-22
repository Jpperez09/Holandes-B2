// Static Resources Hub content — curated free Dutch learning resources.
//
// Frontend-only (the same approved pattern as the Library insight cards): no
// backend, no DB. Curated and CEFR-tagged from the project's own evaluated
// catalogue in the vault (06_Resources/Courses.md). Every "how to use it" line
// is paraphrased from that research — keep it accurate, don't oversell.

export type ResourceCategory =
  | 'course'
  | 'youtube'
  | 'podcast'
  | 'reading'
  | 'speaking'
  | 'tool';

/** CEFR bands match the app's module bands. */
export type ResourceBand = 'A0-A1' | 'A1-A2' | 'A2-B1' | 'B1-B2';

export type ResourceCost = 'free' | 'freemium' | 'paid';

export interface Resource {
  id: string;
  name: string;
  url: string;
  category: ResourceCategory;
  bands: ResourceBand[];
  cost: ResourceCost;
  /** One friendly line: how a learner should actually use it. */
  blurb: string;
}

export const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; icon: string; order: number }
> = {
  course: { label: 'Courses & structured learning', icon: '🎓', order: 1 },
  youtube: { label: 'YouTube channels', icon: '📺', order: 2 },
  podcast: { label: 'Podcasts', icon: '🎧', order: 3 },
  reading: { label: 'Reading', icon: '📰', order: 4 },
  speaking: { label: 'Speaking & practice partners', icon: '🗣️', order: 5 },
  tool: { label: 'Tools', icon: '🧰', order: 6 },
};

export const ALL_BANDS: ResourceBand[] = ['A0-A1', 'A1-A2', 'A2-B1', 'B1-B2'];

export const RESOURCES: Resource[] = [
  // --- Courses & structured learning ---
  {
    id: 'language-transfer',
    name: 'Language Transfer — Complete Dutch',
    url: 'https://www.languagetransfer.org/dutch',
    category: 'course',
    bands: ['A0-A1', 'A1-A2'],
    cost: 'free',
    blurb:
      'Free audio course that builds Dutch grammar intuition using your English. One episode per walk or commute.',
  },
  {
    id: 'bart-de-pau-course',
    name: 'Bart de Pau — learndutch.org',
    url: 'https://www.learndutch.org',
    category: 'course',
    bands: ['A0-A1', 'A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'freemium',
    blurb:
      'The best free structured Dutch course — 1000+ YouTube lessons, methodical and exam-aligned. Paid courses optional.',
  },
  {
    id: 'nedbox',
    name: 'NedBox',
    url: 'https://www.nedbox.be',
    category: 'course',
    bands: ['A2-B1', 'B1-B2'],
    cost: 'free',
    blurb:
      'Free practice with authentic Dutch — news clips, songs and exercises, all tagged by CEFR level.',
  },
  {
    id: 'nt2-taalmenu',
    name: 'NT2 Taalmenu',
    url: 'https://nt2taalmenu.nl',
    category: 'course',
    bands: ['A1-A2', 'A2-B1'],
    cost: 'free',
    blurb: 'A free bank of NT2 exercises — a solid extra drill source for grammar and vocabulary.',
  },

  // --- YouTube ---
  {
    id: 'bart-de-pau-yt',
    name: 'Bart de Pau (YouTube)',
    url: 'https://www.youtube.com/@learndutch',
    category: 'youtube',
    bands: ['A0-A1', 'A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'Systematic free lessons — start with the Dutch Grammar playlist and follow it in order.',
  },
  {
    id: 'nt2-met-sterre',
    name: 'NT2 met Sterre',
    url: 'https://www.youtube.com/@nt2metsterre',
    category: 'youtube',
    bands: ['A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'Slow, clear conversational Dutch and NT2 exam preparation.',
  },
  {
    id: 'easy-dutch',
    name: 'Easy Dutch',
    url: 'https://www.youtube.com/@EasyDutch',
    category: 'youtube',
    bands: ['A1-A2', 'A2-B1'],
    cost: 'free',
    blurb: 'Real street interviews with Dutch + English subtitles — authentic speech made accessible.',
  },
  {
    id: 'dutchies-to-be',
    name: 'Dutchies to be',
    url: 'https://www.youtube.com/@Dutchiestobe',
    category: 'youtube',
    bands: ['A0-A1', 'A1-A2', 'A2-B1'],
    cost: 'free',
    blurb: 'Friendly lessons on pronunciation, slang and everyday Dutch.',
  },
  {
    id: 'nos-jeugdjournaal',
    name: 'NOS Jeugdjournaal',
    url: 'https://jeugdjournaal.nl',
    category: 'youtube',
    bands: ['A2-B1'],
    cost: 'free',
    blurb: "Dutch kids' news — the most accessible authentic Dutch. Watch one short clip daily from A2.",
  },
  {
    id: 'universiteit-van-nederland',
    name: 'Universiteit van Nederland',
    url: 'https://www.youtube.com/@deuniversiteitvannederland',
    category: 'youtube',
    bands: ['B1-B2'],
    cost: 'free',
    blurb: '15-minute academic lectures on every topic — native pace, great for B1 and up.',
  },

  // --- Podcasts ---
  {
    id: 'daily-dutch-podcast',
    name: 'The Daily Dutch Podcast',
    url: 'https://www.dailydutch.nl',
    category: 'podcast',
    bands: ['A0-A1', 'A1-A2'],
    cost: 'free',
    blurb: 'Very slow daily Dutch in ~5-minute episodes — perfect first ear training.',
  },
  {
    id: 'de-dag',
    name: 'De Dag (NPO Radio 1)',
    url: 'https://www.nporadio1.nl/podcasts/de-dag',
    category: 'podcast',
    bands: ['A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'One news topic explained in depth, ~20 min — a great daily listening habit from B1.',
  },
  {
    id: 'nrc-vandaag',
    name: 'NRC Vandaag',
    url: 'https://www.nrc.nl/podcast',
    category: 'podcast',
    bands: ['A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'Quality daily news analysis, ~25 min — clear, well-articulated Dutch.',
  },
  {
    id: 'echt-gebeurd',
    name: 'Echt Gebeurd',
    url: 'https://www.echtgebeurd.nl',
    category: 'podcast',
    bands: ['B1-B2'],
    cost: 'free',
    blurb: 'Real personal stories told at natural pace — varied, engaging B2-level input.',
  },

  // --- Reading ---
  {
    id: 'wablieft',
    name: 'Wablieft',
    url: 'https://www.wablieft.be',
    category: 'reading',
    bands: ['A2-B1'],
    cost: 'free',
    blurb: 'An easy-Dutch weekly newspaper — the gentlest authentic reading to start with.',
  },
  {
    id: 'nos-nieuws',
    name: 'NOS Nieuws',
    url: 'https://nos.nl',
    category: 'reading',
    bands: ['A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'Mainstream Dutch daily news. Start by skimming headlines at A2, read full articles at B1.',
  },
  {
    id: 'nemo-kennislink',
    name: 'NEMO Kennislink',
    url: 'https://www.nemokennislink.nl',
    category: 'reading',
    bands: ['B1-B2'],
    cost: 'free',
    blurb: 'Popular-science articles — engaging, well-written reading for B1 and up.',
  },

  // --- Speaking ---
  {
    id: 'tandem',
    name: 'Tandem',
    url: 'https://www.tandem.net',
    category: 'speaking',
    bands: ['A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'A free language-exchange app — chat and call with Dutch speakers who are learning Spanish.',
  },
  {
    id: 'hellotalk',
    name: 'HelloTalk',
    url: 'https://www.hellotalk.com',
    category: 'speaking',
    bands: ['A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'Free language-exchange chat and voice with native Dutch speakers.',
  },
  {
    id: 'italki',
    name: 'iTalki',
    url: 'https://www.italki.com',
    category: 'speaking',
    bands: ['A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'paid',
    blurb: '1-on-1 tutors (~$10–30/hr). Worth it from A2 — book one focused session a week.',
  },

  // --- Tools ---
  {
    id: 'dutchgrammar',
    name: 'Dutchgrammar.com',
    url: 'https://www.dutchgrammar.com',
    category: 'tool',
    bands: ['A0-A1', 'A1-A2', 'A2-B1'],
    cost: 'free',
    blurb: 'A free English-language grammar reference with exercises — your go-to when a rule is unclear.',
  },
  {
    id: 'woordenlijst',
    name: 'Van Dale online dictionary',
    url: 'https://www.vandale.nl/gratis-woordenboek/nederlands',
    category: 'tool',
    bands: ['A0-A1', 'A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'The standard free Dutch dictionary — check meanings, articles (de/het) and plurals.',
  },
  {
    id: 'anki',
    name: 'Anki',
    url: 'https://apps.ankiweb.net',
    category: 'tool',
    bands: ['A0-A1', 'A1-A2', 'A2-B1', 'B1-B2'],
    cost: 'free',
    blurb: 'A free spaced-repetition flashcard app, if you ever want extra vocabulary practice on the go.',
  },
];
