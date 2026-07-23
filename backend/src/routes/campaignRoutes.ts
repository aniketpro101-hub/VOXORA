import { Router } from 'express';
import {
  createCampaign,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  cloneCampaign,
  scheduleCampaign,
  retryFailedMessages,
  listCampaigns,
  getCampaign,
  getCampaignProgress,
  getCampaignLogs,
  runCampaignPreflight,
} from '../controllers/campaignController.js';
import { authenticateToken } from '../middleware/auth.js';
import { agentAndAbove } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);
router.use(agentAndAbove);

router.post('/', createCampaign);
router.get('/', listCampaigns);
router.post('/schedule', scheduleCampaign);

router.get('/:id', getCampaign);
router.post('/:id/start', startCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/resume', resumeCampaign);
router.post('/:id/stop', stopCampaign);
router.post('/:id/clone', cloneCampaign);
router.post('/:id/retry-failed', retryFailedMessages);
router.get('/:id/progress', getCampaignProgress);
router.get('/:id/logs', getCampaignLogs);
router.post('/:id/preflight', runCampaignPreflight);

export default router;
