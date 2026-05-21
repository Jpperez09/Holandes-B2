// One typed function per backend route the frontend uses.
// Paths are exactly the canonical routes from Localhost_Architecture.md §5.

import { api } from './client';
import type {
  ActivityAttempt,
  DailyLog,
  DbHealthResponse,
  HealthResponse,
  ModuleDetailResponse,
  ModuleSummary,
  ProgressResponse,
  ReviewResponse,
  SettingsMap,
  TodayPlan,
  VaultModuleRaw,
  VaultSnapshot,
  VaultWarningsResponse,
  VocabItem,
  VocabStats,
} from './types';

export const endpoints = {
  // health
  health: () => api.get<HealthResponse>('/api/health'),
  dbHealth: () => api.get<DbHealthResponse>('/api/health/db'),

  // settings
  getSettings: () => api.get<SettingsMap>('/api/settings'),
  updateSettings: (patch: Record<string, string | number>) =>
    api.patch<SettingsMap>('/api/settings', patch),

  // modules
  getModules: () => api.get<ModuleSummary[]>('/api/modules'),
  getModule: (slug: string) =>
    api.get<ModuleDetailResponse>(`/api/modules/${encodeURIComponent(slug)}`),
  getVaultModule: (moduleId: string) =>
    api.get<VaultModuleRaw>(`/api/vault/modules/${encodeURIComponent(moduleId)}`),

  // activities
  markActivityComplete: (activityId: number) =>
    api.post<ActivityAttempt>(`/api/activities/${activityId}/attempts`, {}),

  // vocabulary
  getDueVocabulary: () => api.get<VocabItem[]>('/api/vocabulary/due'),
  getVocabularyStats: () => api.get<VocabStats>('/api/vocabulary/stats'),
  reviewVocabulary: (id: number, grade: 1 | 2 | 3 | 4, elapsedSeconds?: number) =>
    api.post<ReviewResponse>(`/api/vocabulary/${id}/review`, {
      grade,
      elapsed_seconds: elapsedSeconds ?? null,
    }),

  // today
  getToday: () => api.get<TodayPlan>('/api/today'),

  // daily logs
  getDailyLogs: () => api.get<DailyLog[]>('/api/daily-logs'),
  getDailyLog: (date: string) => api.get<DailyLog>(`/api/daily-logs/${date}`),
  saveDailyLog: (date: string, body: { notes: string; minutes: number }) =>
    api.put<DailyLog>(`/api/daily-logs/${date}`, body),

  // progress
  getProgress: () => api.get<ProgressResponse>('/api/progress'),

  // vault diagnostics
  getVaultSnapshot: () => api.get<VaultSnapshot>('/api/vault/snapshot'),
  getVaultWarnings: () => api.get<VaultWarningsResponse>('/api/vault/warnings'),
  reindexVault: () => api.post<{ ok: boolean }>('/api/vault/reindex', {}),
};
