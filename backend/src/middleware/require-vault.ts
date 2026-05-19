import { Request, Response, NextFunction } from 'express';
import { isVaultConfigured } from '../services/settings-service';

export function requireVault(_req: Request, res: Response, next: NextFunction): void {
  if (!isVaultConfigured()) {
    res.status(503).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Service Unavailable',
      status: 503,
      detail: 'vault_path is not configured. Go to Settings and set your vault path.',
      error: 'vault_path_unset',
    });
    return;
  }
  next();
}
