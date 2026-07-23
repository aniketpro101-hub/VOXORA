import { Router } from 'express';
import {
  getAntibanSettings,
  updateAntibanSettings,
  getWarmupProgress,
  runPreflight,
  getInstanceHealthScores,
} from '../controllers/antibanController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/settings', getAntibanSettings);
router.put('/settings', updateAntibanSettings);
router.get('/warmup/:instanceId', getWarmupProgress);
router.post('/preflight', runPreflight);
router.get('/health-scores', getInstanceHealthScores);

export default router;
