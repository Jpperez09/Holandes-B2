import { Router, Request, Response } from 'express';
import { requireVault } from '../middleware/require-vault';
import { generatePlan } from '../services/plan-generator';

const router = Router();

// GET /api/today
router.get('/', requireVault, (_req: Request, res: Response) => {
  const plan = generatePlan();
  res.json(plan);
});

export default router;
