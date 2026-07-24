import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { Settings } from '../models/Settings.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Default Feature Toggles (OTP turned OFF by default as requested!)
let globalFeatureToggles = {
  enableOtpSender: false, // Turned OFF by default!
  enableGroupGrabber: true,
  enableStatusComposer: true,
  enableCarousel: true,
  enableButtons: true,
  enableAutoReply: true,
  enableBlacklist: true,
};

router.get('/health', (req: Request, res: Response) => {
  return sendSuccess(res, 'VOXORA System Operational', {
    status: 'online',
    software: 'VOXORA - Bulk WhatsApp Software',
    version: '1.0.0',
    developer: 'Mr. Aniket Samant',
    telegram: '@actasiff',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/system/features - Public for frontend to read active toggles
router.get('/features', async (req: Request, res: Response) => {
  try {
    const adminSettings = await Settings.findOne();
    if (adminSettings && (adminSettings as any).featureToggles) {
      globalFeatureToggles = { ...globalFeatureToggles, ...(adminSettings as any).featureToggles };
    }
    return sendSuccess(res, 'Feature toggles retrieved', globalFeatureToggles);
  } catch (err) {
    return sendSuccess(res, 'Feature toggles retrieved (default)', globalFeatureToggles);
  }
});

// POST /api/system/features - Admin toggle update
router.post('/features', authenticateToken, async (req: any, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Super-admin role required to modify feature settings', 403);
    }

    const {
      enableOtpSender,
      enableGroupGrabber,
      enableStatusComposer,
      enableCarousel,
      enableButtons,
      enableAutoReply,
      enableBlacklist,
    } = req.body;

    globalFeatureToggles = {
      enableOtpSender: !!enableOtpSender,
      enableGroupGrabber: !!enableGroupGrabber,
      enableStatusComposer: !!enableStatusComposer,
      enableCarousel: !!enableCarousel,
      enableButtons: !!enableButtons,
      enableAutoReply: !!enableAutoReply,
      enableBlacklist: !!enableBlacklist,
    };

    // Save to Admin Settings in DB
    await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { featureToggles: globalFeatureToggles },
      { upsert: true, new: true }
    );

    return sendSuccess(res, 'Admin feature toggles updated successfully', globalFeatureToggles);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update feature toggles', 500);
  }
});

export default router;
