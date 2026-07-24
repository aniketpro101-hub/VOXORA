import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AutoReplyRule } from '../models/AutoReplyRule.js';
import { ConversationFlow } from '../models/ConversationFlow.js';
import { ConversationSession } from '../models/ConversationSession.js';
import { AIConfig } from '../models/AIConfig.js';
import { AutoReplyService } from '../services/autoReplyService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

const ENCRYPTION_KEY = process.env.AI_CONFIG_ENCRYPTION_KEY || 'voxora_ai_encryption_key_dev_change_in_production';
const ALGORITHM = 'aes-256-cbc';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.AI_CONFIG_ENCRYPTION_KEY || process.env.AI_CONFIG_ENCRYPTION_KEY.includes('dev_change')) {
    throw new Error('FATAL SECURITY ERROR: AI_CONFIG_ENCRYPTION_KEY environment variable is required in production mode.');
  }
}

function encryptApiKey(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText; // Return as-is if decryption fails (legacy plaintext)
  }
}

export const listRules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await AutoReplyRule.find({ createdBy: req.user?.userId }).sort({ priority: 1 });
    return sendSuccess(res, 'Auto-reply rules retrieved', rules);
  } catch (error) {
    next(error);
  }
};

export const createRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, triggerKeywords, triggerPattern, responseText, responseMediaUrl, priority, isActive, matchType, caseSensitive } = req.body;
    const rule = await AutoReplyRule.create({
      name,
      triggerKeywords,
      triggerPattern,
      responseText,
      responseMediaUrl,
      priority,
      isActive,
      matchType,
      caseSensitive,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'Auto-reply rule created', rule, 201);
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, triggerKeywords, triggerPattern, responseText, responseMediaUrl, priority, isActive, matchType, caseSensitive } = req.body;
    const allowedUpdates: any = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (triggerKeywords !== undefined) allowedUpdates.triggerKeywords = triggerKeywords;
    if (triggerPattern !== undefined) allowedUpdates.triggerPattern = triggerPattern;
    if (responseText !== undefined) allowedUpdates.responseText = responseText;
    if (responseMediaUrl !== undefined) allowedUpdates.responseMediaUrl = responseMediaUrl;
    if (priority !== undefined) allowedUpdates.priority = priority;
    if (isActive !== undefined) allowedUpdates.isActive = isActive;
    if (matchType !== undefined) allowedUpdates.matchType = matchType;
    if (caseSensitive !== undefined) allowedUpdates.caseSensitive = caseSensitive;

    const rule = await AutoReplyRule.findOneAndUpdate({ _id: id, createdBy: req.user?.userId }, allowedUpdates, { new: true });
    if (!rule) return sendError(res, 'Rule not found', 404);
    return sendSuccess(res, 'Rule updated successfully', rule);
  } catch (error) {
    next(error);
  }
};

export const deleteRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await AutoReplyRule.deleteOne({ _id: id, createdBy: req.user?.userId });
    return sendSuccess(res, 'Rule deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const toggleRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const rule = await AutoReplyRule.findOne({ _id: id, createdBy: req.user?.userId });
    if (!rule) return sendError(res, 'Rule not found', 404);

    rule.isActive = !rule.isActive;
    await rule.save();

    return sendSuccess(res, `Rule ${rule.isActive ? 'enabled' : 'disabled'}`, rule);
  } catch (error) {
    next(error);
  }
};

export const testRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, ruleId } = req.body;
    const rule = await AutoReplyRule.findById(ruleId);
    if (!rule) return sendError(res, 'Rule not found', 404);

    const isMatch = AutoReplyService.matchKeywords(message, rule.keywords, rule.matchType, rule.caseSensitive);
    return sendSuccess(res, 'Rule match evaluation complete', { isMatch, keywords: rule.keywords });
  } catch (error) {
    next(error);
  }
};

export const listFlows = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const flows = await ConversationFlow.find({ createdBy: req.user?.userId });
    return sendSuccess(res, 'Conversation flows retrieved', flows);
  } catch (error) {
    next(error);
  }
};

export const createFlow = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, nodes, edges, isActive } = req.body;
    const flow = await ConversationFlow.create({
      name,
      description,
      nodes,
      edges,
      isActive,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'Conversation flow created', flow, 201);
  } catch (error) {
    next(error);
  }
};

export const getAIConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let config = await AIConfig.findOne({ userId: req.user?.userId });
    if (!config) {
      config = await AIConfig.create({ userId: req.user?.userId });
    }
    const safeConfig = config.toObject();
    safeConfig.apiKey = decryptApiKey(safeConfig.apiKey);
    return sendSuccess(res, 'AI configuration retrieved', safeConfig);
  } catch (error) {
    next(error);
  }
};

export const updateAIConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let config = await AIConfig.findOne({ userId: req.user?.userId });
    if (!config) {
      config = new AIConfig({ userId: req.user?.userId });
    }

    const { apiKey, provider, aiModel, systemPrompt, temperature, maxTokens, isActive } = req.body;
    if (apiKey !== undefined) config.apiKey = apiKey ? encryptApiKey(apiKey) : '';
    if (provider !== undefined) config.provider = provider;
    if (aiModel !== undefined) config.aiModel = aiModel;
    if (systemPrompt !== undefined) config.systemPrompt = systemPrompt;
    if (temperature !== undefined) config.temperature = temperature;
    if (maxTokens !== undefined) config.maxTokens = maxTokens;
    if (isActive !== undefined) config.isActive = isActive;

    await config.save();

    const safeConfig = config.toObject();
    safeConfig.apiKey = decryptApiKey(safeConfig.apiKey);

    return sendSuccess(res, 'AI configuration saved', safeConfig);
  } catch (error) {
    next(error);
  }
};

export const getActiveSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = req.user?.role === 'admin' || !req.user?.userId ? {} : { userId: req.user.userId };
    const sessions = await ConversationSession.find({ status: { $ne: 'completed' }, ...filter }).sort({ lastInteractionAt: -1 });
    return sendSuccess(res, 'Active conversation sessions retrieved', sessions);
  } catch (error) {
    next(error);
  }
};

export const handoverSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const session = await AutoReplyService.sendHumanHandover(id, req.user!.userId);
    return sendSuccess(res, 'Session handed over to agent', session);
  } catch (error) {
    next(error);
  }
};
