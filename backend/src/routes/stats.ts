import { Router, Request, Response } from 'express';
import { buildWeeklyReport, isValidIsoDate } from '../services/weekly-report';

const router = Router();

// GET /api/stats/weekly?end=YYYY-MM-DD
// 7-day window ending on `end` (inclusive); `end` defaults to today (local day).
router.get('/weekly', (req: Request, res: Response) => {
  const raw = req.query['end'];

  if (raw !== undefined && (typeof raw !== 'string' || !isValidIsoDate(raw))) {
    return res.status(422).json({
      type: 'https://datatracker.ietf.org/doc/html/rfc7807',
      title: 'Validation Error',
      status: 422,
      detail: 'end must be a real calendar date in YYYY-MM-DD format.',
    });
  }

  res.json(buildWeeklyReport(raw));
});

export default router;
