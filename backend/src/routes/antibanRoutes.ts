import { Router } from 'express';
import {
  getAntibanSettings,
  updateAntibanSettings,
  getWarmupProgress,
  runPreflight,
  getInstanceHealthScores,
} from '../controllers/antibanController.js';
import { authenticateToken } from '../middleware/auth.js';
import { managerAndAbove } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/settings', getAntibanSettings);
router.put('/settings', managerAndAbove, updateAntibanSettings);
router.get('/warmup/:instanceId', getWarmupProgress);
router.post('/preflight', runPreflight);
router.get('/health-scores', getInstanceHealthScores);

export default router;
