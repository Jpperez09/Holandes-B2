// Typed shapes for the backend REST API.
// These mirror what the Express routes actually return (verified against backend/src/routes).

export interface HealthResponse {
  ok: boolean;
  ts: string;
}

export interface DbHealthResponse {
  ok: boolean;
  migrations: string[];
  integrity: string;
}

export type SettingsMap = Record<string, string>;

/** GET /api/modules — each item; also the base of GET /api/modules/:slug */
export interface ModuleSummary {
  id: number;
  level_id: number;
  module_id: string;
  slug: string;
  title: string;
  sort_order: number;
  estimated_minutes: number | null;
  cefr_band: string | null;
  subtype: string | null;
  status: string | null;
  vocabulary_count: number | null;
  prerequisites: string[];
  tags: string[];
  grammar_focus: string[];
  pronunciation_focus: string[];
  percent_complete: number;
}

export interface Activity {
  id: number;
  lesson_id: number;
  slug: string;
  type: string;
  title: string;
  sort_order: number;
  estimated_minutes: number | null;
  payload_json?: string;
}

export interface VocabItem {
  id: number;
  lemma: string;
  article: string | null;
  pos: string | null;
  ipa: string | null;
  translation_en: string | null;
  translation_es: string | null;
  cognate_en: number | null;
  cognate_note: string | null;
  example: string | null;
  audio_path: string | null;
  audio_url: string | null;
  tts_text: string | null;
  status: string;
  level_code: string | null;
  module_id: string | null;
  source_id: string | null;
  tags: string | null;
  fsrs_state?: string | null;
}

/** GET /api/modules/:slug */
export interface ModuleDetailResponse extends ModuleSummary {
  lessons: unknown[];
  activities: Activity[];
  vocabulary: VocabItem[];
}

/** GET /api/vault/modules/:module_id — raw parsed module incl. markdown body */
export interface VaultModuleRaw {
  module_id: string;
  title: string;
  topic: string;
  body: string;
  level: number;
  cefr_band: string;
  estimated_minutes: number | null;
  grammar_focus: string[];
  pronunciation_focus: string[];
  activities: Array<{
    slug: string;
    type: string;
    title: string;
    estimated_minutes: number | null;
  }>;
}

export interface VocabStats {
  new: number;
  learning: number;
  review: number;
  mature: number;
  suspended: number;
  archived: number;
  due: number;
}

export interface ReviewResponse {
  item: VocabItem;
  nextDue: string;
}

/** GET /api/today (currently a stub on the backend) */
export interface TodayPlanSlot {
  type: string;
  title: string;
  estimatedMinutes: number;
  activityId?: number;
  cardCount?: number;
}
export interface TodayPlan {
  date: string;
  targetMinutes: number;
  slots: TodayPlanSlot[];
  dueCardCount: number;
  streak: number;
}

export interface SkillScore {
  skill: string;
  score: number;
  cefr_estimate: string | null;
  recorded_at: string;
}
export interface WeakArea {
  id: number;
  kind: string;
  ref_id: number;
  reason: string | null;
  severity: number;
  flagged_at: string;
  resolved_at: string | null;
}
export interface GrammarTopic {
  slug: string;
  title: string;
  mastery: number;
  last_reviewed_at: string | null;
}
export interface ProgressResponse {
  skillScores: SkillScore[];
  weakAreas: WeakArea[];
  vocabulary: Record<string, number>;
  grammar: GrammarTopic[];
  recentActivity: Array<{ day: string; attempts: number }>;
}

export interface DailyLog {
  id?: number;
  log_date: string;
  minutes: number;
  notes: string | null;
  auto_summary: string | null;
  streak_at_end: number | null;
  vault_path?: string | null;
  markdown?: string | null;
  markdown_path?: string | null;
}

export interface VaultSnapshot {
  indexerState: {
    ready?: boolean;
    lastIndexedAt?: string | null;
    [k: string]: unknown;
  };
  counts: {
    modules: number;
    levels: number;
    vocabulary: number;
    grammar_patterns: number;
    warnings: number;
    [k: string]: number;
  };
}

export interface VaultWarning {
  code: string;
  message: string;
  severity: string;
  vault_path?: string;
  field?: string;
}
export interface VaultWarningsResponse {
  warnings: VaultWarning[];
  indexerState: unknown;
}

export interface ActivityAttempt {
  id: number;
  activity_id: number;
  completed_at: string | null;
  [k: string]: unknown;
}
