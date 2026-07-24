import { Instance, IInstance } from '../models/Instance.js';
import { logger } from '../utils/logger.js';

export interface AgeTierLimits {
  daily: number;
  hourly: number;
  minDelay: number;
  maxDelay: number;
}

export class SmartLimitsService {
  private ageLimits: Record<string, AgeTierLimits> = {
    new: { daily: 20, hourly: 5, minDelay: 30000, maxDelay: 90000 },
    young: { daily: 50, hourly: 10, minDelay: 25000, maxDelay: 75000 },
    growing: { daily: 100, hourly: 15, minDelay: 20000, maxDelay: 60000 },
    established: { daily: 200, hourly: 25, minDelay: 15000, maxDelay: 45000 },
    mature: { daily: 300, hourly: 35, minDelay: 12000, maxDelay: 40000 },
    veteran: { daily: 500, hourly: 50, minDelay: 10000, maxDelay: 30000 },
  };

  /**
   * Determine age category string from number of days
   */
  getCategoryFromDays(days: number): 'new' | 'young' | 'growing' | 'established' | 'mature' | 'veteran' {
    if (days <= 7) return 'new';
    if (days <= 14) return 'young';
    if (days <= 30) return 'growing';
    if (days <= 90) return 'established';
    if (days <= 180) return 'mature';
    return 'veteran';
  }

  /**
   * Get quota and timing limits for an age category
   */
  getLimits(category: string): AgeTierLimits {
    return this.ageLimits[category] || this.ageLimits.new;
  }

  /**
   * Apply calculated limits to a given instance
   */
  async applyToInstance(instanceId: string, days: number, isVerifiedEnterprise = false) {
    const category = isVerifiedEnterprise ? 'veteran' : this.getCategoryFromDays(days);
    const limits = this.getLimits(category);

    const instance = await Instance.findById(instanceId);
    if (!instance) throw new Error('Instance not found');

    // Skip auto-calculation if manual admin override is enabled
    if (instance.adminOverride?.enabled) {
      logger.info(`[SmartLimits] Admin override enabled for ${instance.name}. Skipping auto-calculation.`);
      return { category: instance.accountAge?.ageCategory || category, limits };
    }

    instance.accountAge = {
      days,
      ageCategory: category,
      isEstimated: false,
      addedToVoxora: instance.accountAge?.addedToVoxora || new Date(),
      lastAgedAt: new Date(),
    };

    instance.smartLimits = {
      dailyLimit: limits.daily,
      hourlyLimit: limits.hourly,
      currentDayCount: instance.smartLimits?.currentDayCount || 0,
      currentHourCount: instance.smartLimits?.currentHourCount || 0,
      lastResetDay: instance.smartLimits?.lastResetDay || new Date(),
      lastResetHour: instance.smartLimits?.lastResetHour || new Date(),
    };

    instance.messageTiming = {
      minDelay: limits.minDelay,
      maxDelay: limits.maxDelay,
      avgDelay: (limits.minDelay + limits.maxDelay) / 2,
      useGaussianDistribution: true,
      batchSize: category === 'new' ? 5 : category === 'young' ? 8 : 15,
      batchBreakMin: 300000,
      batchBreakMax: 900000,
    };

    instance.dailyLimit = limits.daily;
    await instance.save();

    logger.info(`[SmartLimits] Applied ${category.toUpperCase()} tier limits to ${instance.name} (${days} days old, Daily limit: ${limits.daily})`);

    return { category, limits };
  }

  /**
   * Apply super-admin manual override settings
   */
  async applyAdminOverride(
    instanceId: string,
    overrideData: {
      enabled: boolean;
      customDailyLimit?: number;
      customHourlyLimit?: number;
      customMinDelay?: number;
      customMaxDelay?: number;
      isVerifiedEnterprise?: boolean;
      overrideBy?: string;
      overrideReason?: string;
    }
  ) {
    const instance = await Instance.findById(instanceId);
    if (!instance) throw new Error('Instance not found');

    instance.adminOverride = {
      enabled: overrideData.enabled,
      customDailyLimit: overrideData.customDailyLimit,
      customHourlyLimit: overrideData.customHourlyLimit,
      customMinDelay: overrideData.customMinDelay,
      customMaxDelay: overrideData.customMaxDelay,
      isVerifiedEnterprise: !!overrideData.isVerifiedEnterprise,
      overrideBy: overrideData.overrideBy || 'Admin',
      overrideAt: new Date(),
      overrideReason: overrideData.overrideReason || 'Manual admin override applied',
    };

    if (overrideData.enabled) {
      if (overrideData.isVerifiedEnterprise) {
        const veteranLimits = this.getLimits('veteran');
        instance.smartLimits.dailyLimit = overrideData.customDailyLimit || veteranLimits.daily;
        instance.smartLimits.hourlyLimit = overrideData.customHourlyLimit || veteranLimits.hourly;
        instance.dailyLimit = instance.smartLimits.dailyLimit;
        instance.accountAge.ageCategory = 'veteran';
      } else if (overrideData.customDailyLimit) {
        instance.smartLimits.dailyLimit = overrideData.customDailyLimit;
        instance.dailyLimit = overrideData.customDailyLimit;
        if (overrideData.customHourlyLimit) {
          instance.smartLimits.hourlyLimit = overrideData.customHourlyLimit;
        }
      }

      if (overrideData.customMinDelay && overrideData.customMaxDelay) {
        instance.messageTiming.minDelay = overrideData.customMinDelay;
        instance.messageTiming.maxDelay = overrideData.customMaxDelay;
        instance.messageTiming.avgDelay = (overrideData.customMinDelay + overrideData.customMaxDelay) / 2;
      }
    }

    await instance.save();
    logger.info(`[SmartLimits] Admin override ${overrideData.enabled ? 'ENABLED' : 'DISABLED'} for instance ${instance.name}`);

    return instance;
  }

  /**
   * Daily cron job: Increment account age by +1 day every 24 hours
   */
  async ageAllAccounts() {
    const instances = await Instance.find({ status: 'open' });

    for (const inst of instances) {
      if (inst.adminOverride?.enabled) continue;

      const currentDays = inst.accountAge?.days || 1;
      const newDays = currentDays + 1;
      const newCategory = this.getCategoryFromDays(newDays);

      if (newCategory !== inst.accountAge?.ageCategory) {
        logger.info(`[SmartLimits] 🎉 Account ${inst.name} upgraded tier: ${inst.accountAge?.ageCategory} → ${newCategory}!`);
      }

      await this.applyToInstance(String(inst._id), newDays);
    }
  }
}

export default new SmartLimitsService();
