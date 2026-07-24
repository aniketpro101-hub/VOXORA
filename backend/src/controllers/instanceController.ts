import { Response, NextFunction } from 'express';
import { Instance } from '../models/Instance.js';
import { EvolutionService } from '../services/evolutionService.js';
import { BaileysEngine } from '../services/baileysEngine.js';
import { emitInstanceEvent } from '../services/socketService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

export const createInstanceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Instance name must be at least 2 characters'),
    loginMethod: z.enum(['qr', 'phone']),
    phoneNumber: z.string().optional(),
    dailyLimit: z.number().optional().default(500),
  }),
});

export const pairingCodeSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(8, 'Valid phone number required'),
  }),
});

export const createInstance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, loginMethod, phoneNumber, dailyLimit } = req.body;
    const userId = req.user?.userId;

    const instanceId = `voxora_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook`;

    // 1. Create Instance record FIRST in database
    const newInstance = await Instance.create({
      name: name || 'WhatsApp Account',
      instanceId,
      phoneNumber: phoneNumber || '',
      status: 'connecting',
      qrCode: '',
      pairingCode: '',
      dailyLimit: dailyLimit || 500,
      owner: userId,
      webhookUrl,
    });

    // 2. Initialize Baileys session asynchronously in background (non-blocking HTTP response)
    BaileysEngine.initSession(instanceId, true).catch((err: any) => {
      console.warn(`[Baileys Session Warning] ${err?.message}`);
    });

    emitInstanceEvent('status:changed', {
      id: newInstance._id.toString(),
      instanceId: newInstance.instanceId,
      status: 'connecting',
    });

    return sendSuccess(res, 'WhatsApp Instance created successfully', newInstance, 201);
  } catch (error) {
    next(error);
  }
};

export const getQRCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let instance = await Instance.findById(id);
    if (!instance) {
      instance = await Instance.findOne({ instanceId: id });
    }

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    if (!BaileysEngine.getSession(instance.instanceId)) {
      BaileysEngine.initSession(instance.instanceId, instance.status !== 'open').catch(() => {});
    }

    const liveQr = BaileysEngine.getQRCode(instance.instanceId);
    const qrData = await EvolutionService.getQRCode(instance.instanceId);
    const qrCode = liveQr || qrData.qrCode || instance.qrCode || '';

    if (qrCode && qrCode !== instance.qrCode) {
      instance.qrCode = qrCode;
      instance.status = 'qr';
      await instance.save().catch(() => {});
    }

    return sendSuccess(res, 'QR Code retrieved', {
      qrCode: qrCode || instance.qrCode || '',
      status: instance.status || 'connecting',
      expiresInSeconds: 20,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshQR = getQRCode;

export const getPairingCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { phoneNumber } = req.body;
    const instance = await Instance.findById(id);

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    const pairingCode = await EvolutionService.getPairingCode(instance.instanceId, phoneNumber);
    instance.pairingCode = pairingCode;
    await instance.save();

    return sendSuccess(res, 'Pairing code generated', { pairingCode });
  } catch (error) {
    next(error);
  }
};

export const listInstances = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = req.user?.role === 'admin' || !req.user?.userId ? {} : { owner: req.user.userId };
    const instances = await Instance.find(filter).sort({ createdAt: -1 });

    const liveInstances = await Promise.all(
      instances.map(async (inst) => {
        const liveStatus = await EvolutionService.getConnectionStatus(inst.instanceId);
        if (liveStatus !== inst.status) {
          inst.status = liveStatus as any;
          await inst.save();
        }
        return inst;
      })
    );

    return sendSuccess(res, 'Instances fetched successfully', liveInstances);
  } catch (error) {
    next(error);
  }
};

export const getInstances = listInstances;

export const getInstanceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const instance = await Instance.findById(id);

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    return sendSuccess(res, 'Instance details retrieved', instance);
  } catch (error) {
    next(error);
  }
};

export const getInstance = getInstanceById;

export const getStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const instance = await Instance.findById(id);
    if (!instance) return sendError(res, 'Instance not found', 404);
    const status = await EvolutionService.getConnectionStatus(instance.instanceId);
    return sendSuccess(res, 'Status fetched', { status });
  } catch (error) {
    next(error);
  }
};

export const updateInstance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, dailyLimit, antibanEnabled, warmupEnabled } = req.body;
    const allowedUpdates: any = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (dailyLimit !== undefined) allowedUpdates.dailyLimit = dailyLimit;
    if (antibanEnabled !== undefined) allowedUpdates.antibanEnabled = antibanEnabled;
    if (warmupEnabled !== undefined) allowedUpdates.warmupEnabled = warmupEnabled;

    const filter: any = req.user?.role === 'admin' || !req.user?.userId ? { _id: id } : { _id: id, owner: req.user.userId };
    const instance = await Instance.findOneAndUpdate(filter, allowedUpdates, { new: true });
    if (!instance) return sendError(res, 'Instance not found or access denied', 404);
    return sendSuccess(res, 'Instance updated', instance);
  } catch (error) {
    next(error);
  }
};

export const deleteInstance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const instance = await Instance.findById(id);

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    await EvolutionService.deleteInstance(instance.instanceId);
    await instance.deleteOne();

    emitInstanceEvent('status:changed', {
      instanceId: instance._id,
      status: 'deleted',
    });

    return sendSuccess(res, 'Instance deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const disconnectInstance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const instance = await Instance.findById(id);

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    await EvolutionService.disconnectInstance(instance.instanceId);
    instance.status = 'close';
    instance.qrCode = '';
    await instance.save();

    return sendSuccess(res, 'Instance logged out');
  } catch (error) {
    next(error);
  }
};

export const restartInstance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const instance = await Instance.findById(id);

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    await EvolutionService.restartInstance(instance.instanceId);
    instance.status = 'connecting';
    await instance.save();

    return sendSuccess(res, 'Instance restarted');
  } catch (error) {
    next(error);
  }
};

export const logoutInstance = disconnectInstance;

export const updateAccountAge = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { days, isVerifiedEnterprise } = req.body;

    if (days === undefined || isNaN(Number(days))) {
      return sendError(res, 'Please provide valid account age in days', 400);
    }

    const { SmartLimitsService } = await import('../services/smartLimitsService.js');
    const service = new SmartLimitsService();
    const result = await service.applyToInstance(id, Number(days), !!isVerifiedEnterprise);

    return sendSuccess(res, `Account age updated to ${days} days (${result.category.toUpperCase()} tier limits applied)`, result);
  } catch (error) {
    next(error);
  }
};

export const applyAdminOverride = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { enabled, customDailyLimit, customHourlyLimit, customMinDelay, customMaxDelay, isVerifiedEnterprise, overrideReason } = req.body;

    // Verify admin role
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Super-admin role required to modify manual overrides', 403);
    }

    const { SmartLimitsService } = await import('../services/smartLimitsService.js');
    const service = new SmartLimitsService();
    const instance = await service.applyAdminOverride(id, {
      enabled: !!enabled,
      customDailyLimit: customDailyLimit ? Number(customDailyLimit) : undefined,
      customHourlyLimit: customHourlyLimit ? Number(customHourlyLimit) : undefined,
      customMinDelay: customMinDelay ? Number(customMinDelay) : undefined,
      customMaxDelay: customMaxDelay ? Number(customMaxDelay) : undefined,
      isVerifiedEnterprise: !!isVerifiedEnterprise,
      overrideBy: req.user?.email || 'Admin',
      overrideReason: overrideReason || 'Manual admin override',
    });

    return sendSuccess(res, `Admin override ${enabled ? 'enabled' : 'disabled'} for instance`, instance);
  } catch (error) {
    next(error);
  }
};

export const getInstanceStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const instance = await Instance.findById(id);

    if (!instance) {
      return sendError(res, 'Instance not found', 404);
    }

    return sendSuccess(res, 'Instance statistics retrieved', {
      accountAge: instance.accountAge,
      smartLimits: instance.smartLimits,
      adminOverride: instance.adminOverride,
      antibanHealth: instance.antibanHealth,
      messageTiming: instance.messageTiming,
      successRate: instance.successRate,
      totalMessagesSent: instance.totalMessagesSent,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInstancesHealth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const instances = await Instance.find({});
    const healthSummary = instances.map((inst) => ({
      id: inst._id,
      name: inst.name,
      phoneNumber: inst.phoneNumber,
      status: inst.status,
      accountAgeDays: inst.accountAge?.days || 1,
      ageCategory: inst.accountAge?.ageCategory || 'new',
      dailyLimit: inst.adminOverride?.enabled ? inst.adminOverride.customDailyLimit || inst.smartLimits?.dailyLimit || inst.dailyLimit : inst.smartLimits?.dailyLimit || inst.dailyLimit,
      currentDayCount: inst.smartLimits?.currentDayCount || inst.currentDayCount || 0,
      successRate: inst.successRate || 100,
      circuitBreakerActive: inst.antibanHealth?.circuitBreakerActive || false,
      needsRest: inst.antibanHealth?.needsRest || false,
      isHealthy: !inst.antibanHealth?.circuitBreakerActive && !inst.antibanHealth?.needsRest && !inst.isBlocked,
    }));

    return sendSuccess(res, 'Instances health summary retrieved', healthSummary);
  } catch (error) {
    next(error);
  }
};
