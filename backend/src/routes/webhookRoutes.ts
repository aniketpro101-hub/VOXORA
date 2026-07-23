import { Router, Request, Response } from 'express';
import { AutoReplyService } from '../services/autoReplyService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  console.warn('[Webhook] WARNING: WEBHOOK_SECRET not set. Webhook authentication is DISABLED. Set WEBHOOK_SECRET env var for production.');
}

router.post('/evolution', async (req: Request, res: Response) => {
  try {
    if (WEBHOOK_SECRET) {
      const providedSecret = req.headers['x-webhook-secret'] || req.query.secret;
      if (providedSecret !== WEBHOOK_SECRET) {
        return res.status(403).json({ status: 'forbidden', message: 'Invalid webhook secret' });
      }
    }

    const { event, instance, data } = req.body;
    logger.info(`[Webhook] Event: ${event} from Instance: ${instance}`);

    if (event === 'messages.upsert' && data) {
      await AutoReplyService.handleIncomingMessage(instance || 'default', data);
    }

    return res.status(200).json({ status: 'success' });
  } catch (error: any) {
    logger.error(`[Webhook] Processing error: ${error.message}`);
    return res.status(200).json({ status: 'error_handled' });
  }
});

export default router;
