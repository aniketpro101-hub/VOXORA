import { Router, Request, Response } from 'express';
import { APIKey } from '../models/APIKey.js';
import { MessageService } from '../services/messageService.js';
import { Contact } from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

// Middleware: Validate API Key
const validateAPIKey = async (req: Request, res: Response, next: any) => {
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!apiKeyHeader) {
    return sendError(res, 'API key required in X-API-KEY header', 401);
  }

  const keyRecord = await APIKey.findOne({ key: apiKeyHeader, isActive: true });
  if (!keyRecord) {
    return sendError(res, 'Invalid or disabled API key', 401);
  }

  keyRecord.lastUsed = new Date();
  keyRecord.totalCalls += 1;
  await keyRecord.save();

  next();
};

router.use(validateAPIKey);

// Send Single Message API
router.post('/send-message', async (req: Request, res: Response) => {
  try {
    const { instanceName, recipientPhone, messageText } = req.body;
    if (!instanceName || !recipientPhone || !messageText) {
      return sendError(res, 'Missing required parameters: instanceName, recipientPhone, messageText', 400);
    }

    const result = await MessageService.sendTextMessage(instanceName, recipientPhone, messageText);
    return sendSuccess(res, 'Message dispatched via Developer API', result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to send message via API', 500);
  }
});

// Contacts API
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().limit(50);
    return sendSuccess(res, 'Contacts retrieved', contacts);
  } catch (error) {
    return sendError(res, 'Failed to fetch contacts', 500);
  }
});

export default router;
