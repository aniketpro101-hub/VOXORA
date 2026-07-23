import { Router } from 'express';
import {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  testRule,
  listFlows,
  createFlow,
  getAIConfig,
  updateAIConfig,
  getActiveSessions,
  handoverSession,
} from '../controllers/autoReplyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Rules
router.get('/rules', listRules);
router.post('/rules', createRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);
router.patch('/rules/:id/toggle', toggleRule);
router.post('/rules/test', testRule);

// Flows
router.get('/flows', listFlows);
router.post('/flows', createFlow);

// Sessions
router.get('/sessions/active', getActiveSessions);
router.post('/sessions/:id/handover', handoverSession);

// AI Config
router.get('/ai-config', getAIConfig);
router.post('/ai-config', updateAIConfig);

export default router;
