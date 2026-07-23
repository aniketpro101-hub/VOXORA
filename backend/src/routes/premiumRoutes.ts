import { Router } from 'express';
import {
  listABTests,
  createABTest,
  listTemplates,
  listAPIKeys,
  createAPIKey,
} from '../controllers/premiumController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// A/B Testing
router.get('/ab-tests', listABTests);
router.post('/ab-tests', createABTest);

// Templates
router.get('/templates', listTemplates);

// API Keys
router.get('/api-keys', listAPIKeys);
router.post('/api-keys', createAPIKey);

export default router;
