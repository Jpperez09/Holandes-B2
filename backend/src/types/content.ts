export type CefrBand = 'A0-A1' | 'A1-A2' | 'A2-B1' | 'B1-B2' | string;
export type CefrLetter = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ContentType =
  | 'module'
  | 'level'
  | 'vocabulary-seed'
  | 'grammar-pattern-registry'
  | 'daily-log'
  | 'resource'
  | 'lesson'
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'writing';

export type ActivityType =
  | 'vocab'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'freeform'
  | 'real-world'
  | 'unknown';

export interface ParsedActivity {
  slug: string;
  type: ActivityType;
  title: string;
  estimated_minutes: number | null;
  raw_type: string;
  raw_estimated_time: string | null;
}

export interface ParsedModule {
  type: 'module';
  module_id: string;
  level: number;
  cefr_band: CefrBand;
  topic: string;
  title: string;
  subtype: string | null;
  status: string | null;
  estimated_minutes: number | null;
  prerequisites: string[];
  vocabulary_count: number | null;
  grammar_focus: string[];
  pronunciation_focus: string[];
  tags: string[];
  created: string | null;
  updated: string | null;
  activities: ParsedActivity[];
  body: string;
  vault_path: string;
  checksum: string;
  extra_frontmatter: Record<string, unknown>;
}

export interface ParsedLevel {
  type: 'level';
  level: number;
  cefr_band: CefrBand;
  title: string;
  status: string | null;
  modules: string[];
  skills: string[];
  tags: string[];
  created: string | null;
  updated: string | null;
  body: string;
  vault_path: string;
  checksum: string;
  extra_frontmatter: Record<string, unknown>;
}

export type VocabPos =
  | 'noun'
  | 'verb'
  | 'adj'
  | 'adv'
  | 'pron'
  | 'det'
  | 'conj'
  | 'num'
  | 'prep'
  | 'int'
  | 'phrase'
  | 'noun-pl'
  | 'noun-proper'
  | 'noun-title'
  | 'adj/noun'
  | 'noun/adj'
  | 'adv/noun'
  | 'det/pron'
  | 'int-q'
  | 'unknown'
  | string;

export interface ParsedVocabItem {
  source_id: string | null;
  lemma: string;
  article: 'de' | 'het' | null;
  pos: VocabPos;
  ipa: string | null;
  translation_en: string;
  translation_es: string | null;
  cognate_en: boolean | 'partial' | null;
  cognate_note: string | null;
  example: string | null;
  level_code: CefrLetter | null;
  module_id: string | null;
  audio_path: string | null;
  audio_url: string | null;
  tts_text: string;
  tags: string[];
  table_section: string;
}

export interface ParsedVocabularySeed {
  type: 'vocabulary-seed';
  cefr_band: CefrBand;
  covers_modules: string[];
  total_items: number | null;
  status: string | null;
  tags: string[];
  created: string | null;
  updated: string | null;
  items: ParsedVocabItem[];
  vault_path: string;
  checksum: string;
  extra_frontmatter: Record<string, unknown>;
}

export interface ParsedGrammarPattern {
  slug: string;
  name_en: string;
  pienemann_stage: number | null;
  cefr_band: CefrBand | null;
  level_code: CefrLetter | null;
  module_introduced: string | null;
  dutch_pattern: string | null;
  english_meaning: string | null;
  spanish_contrast: string | null;
  examples: string[];
  common_mistake: string | null;
  practice_activity: string | null;
  srs_cloze_candidate: boolean;
  tags: string[];
  notes: Record<string, unknown>;
}

export interface ParsedGrammarRegistry {
  type: 'grammar-pattern-registry';
  cefr_band: CefrBand;
  covers_modules: string[];
  total_patterns: number | null;
  status: string | null;
  tags: string[];
  created: string | null;
  updated: string | null;
  patterns: ParsedGrammarPattern[];
  vault_path: string;
  checksum: string;
  extra_frontmatter: Record<string, unknown>;
}

export type ParsedFile =
  | ParsedModule
  | ParsedLevel
  | ParsedVocabularySeed
  | ParsedGrammarRegistry;
