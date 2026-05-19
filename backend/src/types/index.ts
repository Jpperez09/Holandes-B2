// Shared TypeScript types for the backend

export interface User {
  id: number;
  name: string;
  native_language: string;
  target_language: string;
  target_level: string;
  start_date: string;
  created_at: string;
  updated_at: string | null;
}

export interface Level {
  id: number;
  code: string;
  sort_order: number;
  vault_path: string | null;
  created_at: string;
}

export interface Module {
  id: number;
  level_id: number;
  slug: string;
  title: string;
  sort_order: number;
  vault_path: string;
  checksum: string;
  estimated_minutes: number | null;
  prerequisites: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Lesson {
  id: number;
  module_id: number;
  slug: string;
  title: string;
  sort_order: number;
  vault_path: string;
  checksum: string;
  estimated_minutes: number | null;
  created_at: string;
}

export type ActivityType = 'vocab' | 'grammar' | 'reading' | 'listening' | 'writing' | 'freeform';

export interface Activity {
  id: number;
  lesson_id: number;
  slug: string;
  type: ActivityType;
  title: string;
  sort_order: number;
  payload_json: string;
  vault_path: string | null;
  estimated_minutes: number | null;
  created_at: string;
}

export interface ActivityAttempt {
  id: number;
  user_id: number;
  activity_id: number;
  session_id: number | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  self_rating: number | null;
  payload_json: string | null;
}

export type VocabularyStatus = 'new' | 'learning' | 'review' | 'mature' | 'suspended' | 'archived';

export interface VocabularyItem {
  id: number;
  lemma: string;
  article: string | null;
  language: string;
  pos: string | null;
  translation_es: string | null;
  translation_en: string | null;
  ipa: string | null;
  example: string | null;
  cognate_en: number;
  cognate_note: string | null;
  source_id: string | null;
  source_path: string | null;
  module_id: string | null;
  level_code: string | null;
  tags: string | null;
  audio_path: string | null;
  audio_url: string | null;
  tts_text: string | null;
  fsrs_state: string | null;
  status: VocabularyStatus;
  created_at: string;
  updated_at: string | null;
}

export interface VocabularyReview {
  id: number;
  vocabulary_id: number;
  reviewed_at: string;
  grade: 1 | 2 | 3 | 4;
  prev_state: string | null;
  next_state: string | null;
  elapsed_seconds: number | null;
}

export interface GrammarTopic {
  id: number;
  slug: string;
  title: string;
  level_code: string | null;
  vault_path: string | null;
  module_id: string | null;
  pienemann_stage: number | null;
  notes_json: string | null;
  mastery: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SkillScore {
  id: number;
  user_id: number;
  skill: 'reading' | 'listening' | 'speaking' | 'writing' | 'vocabulary' | 'grammar';
  score: number;
  cefr_estimate: string | null;
  recorded_at: string;
}

export interface DailyLog {
  id: number;
  user_id: number;
  log_date: string;
  minutes: number;
  notes: string | null;
  auto_summary: string | null;
  vault_path: string | null;
  streak_at_end: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface WeakArea {
  id: number;
  user_id: number;
  kind: 'grammar' | 'vocabulary' | 'skill' | 'module';
  ref_id: number;
  reason: string | null;
  severity: number;
  flagged_at: string;
  resolved_at: string | null;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// API response helpers
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

export interface HealthResponse {
  ok: boolean;
  ts: string;
}

export interface DbHealthResponse {
  ok: boolean;
  migrations: string[];
  integrity: string;
}
