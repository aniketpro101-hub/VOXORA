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
import { SpeedModeService } from '../services/speedModeService.js';
import { Campaign } from '../models/Campaign.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

router.use(authenticateToken);
router.use(agentAndAbove);

router.post('/', createCampaign);
router.get('/', listCampaigns);
router.post('/schedule', scheduleCampaign);

// Smart Speed Modes API
router.get('/speed-modes', (req: any, res: any) => {
  const contacts = parseInt(req.query.contacts as string, 10) || 100;
  const instances = parseInt(req.query.instances as string, 10) || 1;
  const modes = SpeedModeService.getAllModesWithEstimates(contacts, instances);
  return sendSuccess(res, 'Speed modes retrieved', { modes });
});

router.post('/:id/speed-mode', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { speedMode } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) return sendError(res, 'Campaign not found', 404);

    if (campaign.instanceIds?.[0]) {
      await SpeedModeService.applySpeedMode(campaign.instanceIds[0].toString(), speedMode);
    }

    campaign.speedMode = speedMode;
    await campaign.save();

    return sendSuccess(res, `Campaign speed mode updated to ${speedMode}`, { speedMode });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update speed mode', 500);
  }
});

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
