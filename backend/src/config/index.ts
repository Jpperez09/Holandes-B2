import fs from 'fs';
import path from 'path';

export interface AppConfig {
  vault_path: string;
  user_name: string;
  native_language: string;
  target_language: string;
  target_level: string;
  ui_language: string;
  daily_goal_minutes: number;
  ports: {
    frontend: number;
    backend: number;
  };
}

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

function loadJsonFile(filePath: string): Partial<AppConfig> {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Partial<AppConfig>;
  } catch {
    return {};
  }
}

const defaults: AppConfig = {
  vault_path: '',
  user_name: 'Juanpa',
  native_language: 'es',
  target_language: 'nl',
  target_level: 'B2',
  ui_language: 'en',
  daily_goal_minutes: 60,
  ports: { frontend: 5173, backend: 8787 },
};

function buildConfig(): AppConfig {
  const exampleCfg = loadJsonFile(path.join(PROJECT_ROOT, 'config.example.json'));
  const localCfg = loadJsonFile(path.join(PROJECT_ROOT, 'config.local.json'));

  const merged: AppConfig = {
    ...defaults,
    ...exampleCfg,
    ...localCfg,
    ports: {
      ...defaults.ports,
      ...(exampleCfg.ports ?? {}),
      ...(localCfg.ports ?? {}),
    },
  };

  // Environment variable overrides
  if (process.env.VAULT_PATH) merged.vault_path = process.env.VAULT_PATH;
  if (process.env.API_PORT) merged.ports.backend = parseInt(process.env.API_PORT, 10);
  if (process.env.UI_PORT) merged.ports.frontend = parseInt(process.env.UI_PORT, 10);

  return merged;
}

export const config = buildConfig();

export function getProjectRoot(): string {
  return PROJECT_ROOT;
}
