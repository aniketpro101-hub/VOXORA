import { Response, NextFunction } from 'express';
import { AutoReplyRule } from '../models/AutoReplyRule.js';
import { ConversationFlow } from '../models/ConversationFlow.js';
import { ConversationSession } from '../models/ConversationSession.js';
import { AIConfig } from '../models/AIConfig.js';
import { AutoReplyService } from '../services/autoReplyService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

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
    const rule = await AutoReplyRule.create({
      ...req.body,
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
    const rule = await AutoReplyRule.findOneAndUpdate({ _id: id, createdBy: req.user?.userId }, req.body, { new: true });
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
    const flow = await ConversationFlow.create({
      ...req.body,
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
    return sendSuccess(res, 'AI configuration retrieved', config);
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
    if (apiKey !== undefined) config.apiKey = apiKey;
    if (provider !== undefined) config.provider = provider;
    if (aiModel !== undefined) config.aiModel = aiModel;
    if (systemPrompt !== undefined) config.systemPrompt = systemPrompt;
    if (temperature !== undefined) config.temperature = temperature;
    if (maxTokens !== undefined) config.maxTokens = maxTokens;
    if (isActive !== undefined) config.isActive = isActive;

    await config.save();

    return sendSuccess(res, 'AI configuration saved', config);
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
