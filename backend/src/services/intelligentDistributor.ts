import { Instance, IInstance } from '../models/Instance.js';
import { logger } from '../utils/logger.js';

export class IntelligentDistributor {
  /**
   * Selects the optimal healthy WhatsApp instance for campaign message dispatch
   */
  async getBestInstance(campaignId?: string): Promise<IInstance> {
    // 1. Fetch connected instances that are not circuit-broken or resting
    const instances = await Instance.find({
      status: 'open',
      'antibanHealth.circuitBreakerActive': false,
      'antibanHealth.needsRest': false,
      isBlocked: false,
    });

    if (instances.length === 0) {
      throw new Error('No healthy active WhatsApp numbers connected. Please connect a WhatsApp instance in /instances.');
    }

    // 2. Reset daily and hourly counters if needed
    for (const inst of instances) {
      await this.resetCountersIfNeeded(inst);
    }

    // 3. Filter by available daily & hourly capacity
    const available = instances.filter((inst) => {
      const dailyCap = inst.adminOverride?.enabled
        ? inst.adminOverride.customDailyLimit || inst.smartLimits?.dailyLimit || inst.dailyLimit
        : inst.smartLimits?.dailyLimit || inst.dailyLimit;

      const hourlyCap = inst.adminOverride?.enabled
        ? inst.adminOverride.customHourlyLimit || inst.smartLimits?.hourlyLimit || 10
        : inst.smartLimits?.hourlyLimit || 10;

      const currentDay = inst.smartLimits?.currentDayCount ?? inst.currentDayCount;
      const currentHour = inst.smartLimits?.currentHourCount ?? inst.currentHourCount;

      return currentDay < dailyCap && currentHour < hourlyCap;
    });

    if (available.length === 0) {
      throw new Error('All connected WhatsApp numbers have reached their safe daily/hourly capacity limits.');
    }

    // 4. Score each candidate instance based on health, capacity, success rate, and age tier
    const scored = available.map((inst) => ({
      instance: inst,
      score: this.calculateScore(inst),
    }));

    // 5. Sort descending by priority score
    scored.sort((a, b) => b.score - a.score);

    const chosen = scored[0].instance;
    logger.info(`[Intelligent Distributor] Selected instance ${chosen.name} (${chosen.instanceId}) for dispatch. Score: ${scored[0].score.toFixed(1)}`);

    return chosen;
  }

  /**
   * Calculates priority score (0 - 100) for a given instance candidate
   */
  private calculateScore(instance: IInstance): number {
    let score = 0;

    // A. Success Rate (0 - 40 points)
    const successRate = instance.successRate ?? 100;
    score += (successRate / 100) * 40;

    // B. Available Daily Capacity Percentage (0 - 30 points)
    const dailyCap = instance.smartLimits?.dailyLimit || instance.dailyLimit || 30;
    const currentDay = instance.smartLimits?.currentDayCount ?? instance.currentDayCount;
    const usagePercent = Math.min(1, currentDay / Math.max(1, dailyCap));
    score += (1 - usagePercent) * 30;

    // C. Recency / Time since last use (0 - 15 points)
    const minutesSinceLastUse = instance.lastUsedAt
      ? (Date.now() - new Date(instance.lastUsedAt).getTime()) / 60000
      : 60;
    score += Math.min(minutesSinceLastUse / 60, 1) * 15;

    // D. Account Age Category Bonus (0 - 10 points)
    const ageCategoryBonus: Record<string, number> = {
      veteran: 10,
      mature: 8,
      established: 6,
      growing: 4,
      young: 2,
      new: 1,
    };
    const cat = instance.accountAge?.ageCategory || 'new';
    score += ageCategoryBonus[cat] || 1;

    // E. Custom Rotation Priority (0 - 5 points)
    score += instance.rotationPriority || 5;

    return score;
  }

  /**
   * Resets daily and hourly usage counters if time windows have elapsed
   */
  private async resetCountersIfNeeded(instance: IInstance) {
    const now = new Date();
    const todayStr = now.toDateString();
    const currentHour = now.getHours();

    let modified = false;

    // Daily reset at midnight
    const lastResetDay = instance.smartLimits?.lastResetDay
      ? new Date(instance.smartLimits.lastResetDay).toDateString()
      : new Date(instance.lastResetDate).toDateString();

    if (lastResetDay !== todayStr) {
      instance.smartLimits = instance.smartLimits || ({} as any);
      instance.smartLimits.currentDayCount = 0;
      instance.smartLimits.lastResetDay = now;
      instance.currentDayCount = 0;
      instance.lastResetDate = now;
      if (instance.antibanHealth) {
        instance.antibanHealth.totalMessagesToday = 0;
        instance.antibanHealth.totalRepliesReceived = 0;
      }
      modified = true;
    }

    // Hourly reset
    const lastResetHour = instance.smartLimits?.lastResetHour
      ? new Date(instance.smartLimits.lastResetHour).getHours()
      : new Date(instance.lastHourReset).getHours();

    if (lastResetHour !== currentHour) {
      instance.smartLimits = instance.smartLimits || ({} as any);
      instance.smartLimits.currentHourCount = 0;
      instance.smartLimits.lastResetHour = now;
      instance.currentHourCount = 0;
      instance.lastHourReset = now;
      modified = true;
    }

    if (modified) {
      await instance.save();
    }
  }

  /**
   * Records usage metrics after successful or failed message dispatch
   */
  async recordUsage(instanceId: string, success: boolean) {
    const instance = await Instance.findById(instanceId);
    if (!instance) return;

    instance.smartLimits = instance.smartLimits || ({} as any);
    instance.smartLimits.currentDayCount = (instance.smartLimits.currentDayCount || 0) + 1;
    instance.smartLimits.currentHourCount = (instance.smartLimits.currentHourCount || 0) + 1;
    instance.currentDayCount = (instance.currentDayCount || 0) + 1;
    instance.currentHourCount = (instance.currentHourCount || 0) + 1;
    instance.totalUses = (instance.totalUses || 0) + 1;
    instance.totalMessagesSent = (instance.totalMessagesSent || 0) + 1;
    instance.lastUsedAt = new Date();
    instance.lastSendTime = new Date();

    if (success) {
      if (instance.antibanHealth) {
        instance.antibanHealth.consecutiveErrors = 0;
      }
    } else {
      instance.consecutiveFailures = (instance.consecutiveFailures || 0) + 1;
      if (instance.antibanHealth) {
        instance.antibanHealth.consecutiveErrors = (instance.antibanHealth.consecutiveErrors || 0) + 1;
        if (instance.antibanHealth.consecutiveErrors >= 5) {
          instance.antibanHealth.needsRest = true;
          const restUntil = new Date();
          restUntil.setMinutes(restUntil.getMinutes() + 30);
          instance.antibanHealth.restUntil = restUntil;
          logger.warn(`[Intelligent Distributor] Instance ${instance.name} auto-resting for 30 min due to 5 consecutive errors.`);
        }
      }
    }

    await instance.save();
  }
}

export default new IntelligentDistributor();
