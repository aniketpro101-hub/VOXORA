import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

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

export default router;
