import { Response, NextFunction } from 'express';
import { AntibanSettings } from '../models/AntibanSettings.js';
import { Instance } from '../models/Instance.js';
import { DailyStats } from '../models/DailyStats.js';
import { AntibanEngine } from '../services/antibanService.js';
import { PreflightService } from '../services/preflightService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAntibanSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await AntibanSettings.findOne({ userId: req.user?.userId });
    if (!settings) {
      settings = await AntibanSettings.create({ userId: req.user?.userId });
    }
    return sendSuccess(res, 'Anti-ban settings retrieved', settings);
  } catch (error) {
    next(error);
  }
};

export const updateAntibanSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await AntibanSettings.findOne({ userId: req.user?.userId });
    if (!settings) {
      settings = new AntibanSettings({ userId: req.user?.userId });
    }

    Object.assign(settings, req.body);
    await settings.save();

    return sendSuccess(res, 'Anti-ban settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const getWarmupProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const instance = await Instance.findOne({ _id: instanceId, owner: req.user?.userId });

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    const currentLimit = AntibanEngine.getWarmupLimit(instance);
    const riskLevel = AntibanEngine.calculateBanRisk(instance);

    // Mock history data for day-by-day warmup timeline
    const history = Array.from({ length: Math.min(instance.warmupDay, 14) }, (_, i) => ({
      day: i + 1,
      sent: Math.min(30, (i + 1) * 20),
      limit: i + 1 <= 3 ? 30 : i + 1 <= 7 ? 100 : 300,
      status: i + 1 < instance.warmupDay ? 'completed' : 'in_progress',
    }));

    return sendSuccess(res, 'Warmup progress retrieved', {
      instance,
      warmupDay: instance.warmupDay,
      currentLimit,
      currentDayCount: instance.currentDayCount,
      healthScore: instance.healthScore,
      riskLevel,
      history,
    });
  } catch (error) {
    next(error);
  }
};

export const runPreflight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { campaignData, instanceId } = req.body;
    if (!campaignData || !instanceId) {
      return sendError(res, 'campaignData and instanceId required', 400);
    }

    const report = await PreflightService.runPreflightCheck(campaignData, instanceId, req.user!.userId);
    return sendSuccess(res, 'Preflight safety audit completed', report);
  } catch (error) {
    next(error);
  }
};

export const getInstanceHealthScores = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const instances = await Instance.find({ owner: req.user?.userId });
    const healthData = instances.map((inst) => ({
      id: inst._id,
      name: inst.name,
      phone: inst.phoneNumber,
      healthScore: inst.healthScore,
      riskLevel: AntibanEngine.calculateBanRisk(inst),
      currentDayCount: inst.currentDayCount,
      dailyLimit: inst.dailyLimit,
      successRate: inst.successRate,
    }));

    return sendSuccess(res, 'Instance health scores retrieved', healthData);
  } catch (error) {
    next(error);
  }
};
