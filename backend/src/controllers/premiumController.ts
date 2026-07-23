import { Response, NextFunction } from 'express';
import { ABTest } from '../models/ABTest.js';
import { MessageTemplate } from '../models/MessageTemplate.js';
import { WebhookIntegration } from '../models/WebhookIntegration.js';
import { APIKey } from '../models/APIKey.js';
import { ABTestingService } from '../services/abTestingService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

// --- A/B TESTING ---
export const listABTests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tests = await ABTest.find({ createdBy: req.user?.userId }).sort({ createdAt: -1 });
    return sendSuccess(res, 'A/B tests retrieved', tests);
  } catch (error) {
    next(error);
  }
};

export const createABTest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const test = await ABTest.create({
      name: req.body.name,
      variantA: req.body.variantA,
      variantB: req.body.variantB,
      metric: req.body.metric,
      durationDays: req.body.durationDays,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'A/B test created', test, 201);
  } catch (error) {
    next(error);
  }
};

// --- TEMPLATES ---
export const listTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string;
    const industry = req.query.industry as string;
    const query: any = {};
    if (category) query.category = category;
    if (industry) query.industry = industry;

    const templates = await MessageTemplate.find(query).sort({ isFeatured: -1, usageCount: -1 });
    return sendSuccess(res, 'Templates retrieved', templates);
  } catch (error) {
    next(error);
  }
};

// --- API KEYS ---
export const listAPIKeys = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const keys = await APIKey.find({ createdBy: req.user?.userId }).sort({ createdAt: -1 });
    return sendSuccess(res, 'API keys retrieved', keys);
  } catch (error) {
    next(error);
  }
};

export const createAPIKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawKey = `vxr_live_${crypto.randomBytes(16).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await APIKey.create({
      name: req.body.name || 'Production API Key',
      key: hashedKey,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'API key generated successfully (save raw key now, it will not be shown again)', {
      _id: apiKey._id,
      name: apiKey.name,
      rawKey,
      createdAt: apiKey.createdAt,
    }, 201);
  } catch (error) {
    next(error);
  }
};
