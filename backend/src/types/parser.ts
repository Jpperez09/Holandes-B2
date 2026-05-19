export type WarningSeverity = 'info' | 'warn' | 'error';

export interface ParserWarning {
  severity: WarningSeverity;
  code: string;
  message: string;
  vault_path?: string;
  field?: string;
  context?: Record<string, unknown>;
}

export interface ParserResult<T> {
  ok: boolean;
  value: T | null;
  warnings: ParserWarning[];
}

export function makeWarning(
  code: string,
  message: string,
  severity: WarningSeverity = 'warn',
  context?: Omit<ParserWarning, 'severity' | 'code' | 'message'>,
): ParserWarning {
  return { severity, code, message, ...context };
}
