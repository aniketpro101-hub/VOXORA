import { Router } from 'express';
import {
  getDashboardStats,
  getCampaignReport,
  getContactTimeline,
  listLinkClicks,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);
router.get('/campaigns/:id', getCampaignReport);
router.get('/contacts/:id/timeline', getContactTimeline);
router.get('/links', listLinkClicks);

export default router;
