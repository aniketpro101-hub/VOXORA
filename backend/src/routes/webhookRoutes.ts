import { Router, Request, Response } from 'express';
import { AutoReplyService } from '../services/autoReplyService.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/evolution', async (req: Request, res: Response) => {
  try {
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
