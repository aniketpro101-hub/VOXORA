import { Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaignService.js';
import { Campaign } from '../models/Campaign.js';
import { CampaignJob } from '../models/CampaignJob.js';
import { PreflightService } from '../services/preflightService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

export const createCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await CampaignService.createCampaign(req.body, req.user!.userId);
    return sendSuccess(res, 'Campaign created successfully', campaign, 201);
  } catch (error) {
    next(error);
  }
};

export const startCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CampaignService.startCampaign(id, req.user!.userId);
    return sendSuccess(res, 'Campaign started successfully', result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to start campaign', 400);
  }
};

export const pauseCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await CampaignService.pauseCampaign(id, req.user!.userId, req.body.reason || 'User paused', true);
    return sendSuccess(res, 'Campaign paused successfully', campaign);
  } catch (error) {
    next(error);
  }
};

export const resumeCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CampaignService.resumeCampaign(id, req.user!.userId);
    return sendSuccess(res, 'Campaign resumed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const stopCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await CampaignService.stopCampaign(id, req.user!.userId);
    return sendSuccess(res, 'Campaign stopped successfully', campaign);
  } catch (error) {
    next(error);
  }
};

export const cloneCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cloned = await CampaignService.cloneCampaign(id, req.body.name, req.user!.userId);
    return sendSuccess(res, 'Campaign cloned successfully', cloned, 201);
  } catch (error) {
    next(error);
  }
};

export const scheduleCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campaignData, scheduledAt } = req.body;
    if (!campaignData || !scheduledAt) {
      return sendError(res, 'campaignData and scheduledAt required', 400);
    }
    const campaign = await CampaignService.scheduleCampaign(campaignData, new Date(scheduledAt), req.user!.userId);
    return sendSuccess(res, 'Campaign scheduled successfully', campaign);
  } catch (error) {
    next(error);
  }
};

export const retryFailedMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CampaignService.retryFailedMessages(id, req.user!.userId);
    return sendSuccess(res, `Retrying ${result.retriedCount} failed messages`, result);
  } catch (error) {
    next(error);
  }
};

export const listCampaigns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const query: any = { owner: req.user?.userId };
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    return sendSuccess(res, 'Campaigns retrieved', {
      campaigns,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findOne({ _id: id, owner: req.user?.userId });
    if (!campaign) return sendError(res, 'Campaign not found', 404);
    return sendSuccess(res, 'Campaign retrieved', campaign);
  } catch (error) {
    next(error);
  }
};

export const getCampaignProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const progress = await CampaignService.getCampaignProgress(id);
    return sendSuccess(res, 'Campaign progress retrieved', progress);
  } catch (error) {
    next(error);
  }
};

export const getCampaignLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const jobs = await CampaignJob.find({ campaignId: id }).sort({ updatedAt: -1 }).limit(50);
    return sendSuccess(res, 'Campaign logs retrieved', jobs);
  } catch (error) {
    next(error);
  }
};

export const runCampaignPreflight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campaignData, instanceId } = req.body;
    const report = await PreflightService.runPreflightCheck(campaignData, instanceId, req.user!.userId);
    return sendSuccess(res, 'Campaign preflight audit completed', report);
  } catch (error) {
    next(error);
  }
};
