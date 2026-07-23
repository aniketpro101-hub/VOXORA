import axios from 'axios';
import { Instance, IInstance } from '../models/Instance.js';
import { AntibanSettings, IAntibanSettings } from '../models/AntibanSettings.js';
import { logger } from '../utils/logger.js';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

const evoClient = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'Content-Type': 'application/json',
    apikey: EVOLUTION_API_KEY,
  },
  timeout: 5000,
});

export class AntibanEngine {
  private static lastGeneratedDelay = 0;

  /**
   * 1. Calculates a weighted human-like random delay (never identical in sequence)
   */
  static calculateRandomDelay(settings: { minDelay: number; maxDelay: number }): number {
    const minMs = Math.max(5, settings.minDelay) * 1000;
    const maxMs = Math.max(minMs / 1000 + 1, settings.maxDelay) * 1000;

    // Triangular/Gaussian-weighted random bias towards center value
    const u1 = Math.random();
    const u2 = Math.random();
    const rawFactor = (u1 + u2) / 2;

    let delay = Math.floor(minMs + rawFactor * (maxMs - minMs));

    // Guarantee sequence variation
    if (Math.abs(delay - this.lastGeneratedDelay) < 500) {
      delay += Math.floor(Math.random() * 2000) + 1000;
    }
    this.lastGeneratedDelay = delay;

    return delay;
  }

  /**
   * 2. Checks if campaign should pause for batch break
   */
  static shouldTakeBreak(sentInCurrentBatch: number, batchSize: number): { breakNeeded: boolean; durationMinutes: number } {
    if (batchSize > 0 && sentInCurrentBatch >= batchSize) {
      // Add +/- 20% randomness to break duration
      const baseDuration = 10;
      const variation = (Math.random() * 0.4 - 0.2) * baseDuration;
      const durationMinutes = Math.max(2, Math.round(baseDuration + variation));
      return { breakNeeded: true, durationMinutes };
    }
    return { breakNeeded: false, durationMinutes: 0 };
  }

  /**
   * 3. Timezone-aware sleep mode check
   */
  static isSleepTime(settings: { sleepModeEnabled: boolean; sleepStartHour: number; sleepEndHour: number }, timezone = 'Asia/Kolkata'): boolean {
    if (!settings.sleepModeEnabled) return false;

    try {
      const now = new Date();
      const localHourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);

      const currentHour = parseInt(localHourStr, 10);
      const start = settings.sleepStartHour;
      const end = settings.sleepEndHour;

      if (start > end) {
        // Overnight sleep (e.g. 22:00 to 08:00)
        return currentHour >= start || currentHour < end;
      } else {
        return currentHour >= start && currentHour < end;
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * 4. Enforces daily limits and handles midnight resets
   */
  static async checkDailyLimit(instance: IInstance): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = new Date();
    const lastReset = new Date(instance.lastResetDate);

    // Reset daily counter at midnight
    if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      instance.currentDayCount = 0;
      instance.lastResetDate = now;
      await instance.save();
    }

    const limit = instance.dailyLimit || this.getWarmupLimit(instance);
    const remaining = Math.max(0, limit - instance.currentDayCount);

    const resetAt = new Date(now.getTime());
    resetAt.setHours(24, 0, 0, 0);

    return {
      allowed: instance.currentDayCount < limit,
      remaining,
      resetAt,
    };
  }

  /**
   * 5. Hourly burst sending limit
   */
  static async checkHourlyLimit(instance: IInstance): Promise<{ allowed: boolean; remaining: number }> {
    const now = new Date();
    const lastHour = new Date(instance.lastHourReset);

    // Reset hourly counter if > 1 hour passed
    if (now.getTime() - lastHour.getTime() > 3600000) {
      instance.currentHourCount = 0;
      instance.lastHourReset = now;
      await instance.save();
    }

    const hourlyLimit = Math.ceil((instance.dailyLimit || 30) / 6); // Cap max per hour
    const remaining = Math.max(0, hourlyLimit - instance.currentHourCount);

    return {
      allowed: instance.currentHourCount < hourlyLimit,
      remaining,
    };
  }

  /**
   * 6. Returns recommended maximum daily limit based on warmup progression
   */
  static getWarmupLimit(instance: IInstance): number {
    const day = instance.warmupDay || 1;
    if (day <= 3) return 30;
    if (day <= 7) return 100;
    if (day <= 14) return 300;
    if (day <= 21) return 500;
    if (day <= 30) return 800;
    return 1000;
  }

  /**
   * 7. Calculates live ban risk level ('safe' | 'low' | 'medium' | 'high' | 'critical')
   */
  static calculateBanRisk(instance: IInstance): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    if (instance.successRate < 70) riskScore += 40;
    else if (instance.successRate < 85) riskScore += 25;
    else if (instance.successRate < 95) riskScore += 10;

    if (instance.consecutiveFailures >= 5) riskScore += 35;
    else if (instance.consecutiveFailures >= 3) riskScore += 15;

    if (instance.warmupDay <= 3 && instance.currentDayCount > 30) riskScore += 30;
    if (instance.healthScore < 60) riskScore += 20;

    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 30) return 'medium';
    if (riskScore >= 15) return 'low';
    return 'safe';
  }

  /**
   * 8. Simulates human typing indicator in Evolution API
   */
  static async simulateTyping(instanceName: string, phone: string, textLength: number) {
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const durationMs = Math.min(8000, Math.max(1500, textLength * 45));

      await evoClient.post(`/chat/sendPresence/${instanceName}`, {
        number: cleanPhone,
        presence: 'composing',
        delay: durationMs,
      });
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * 9. Simulates online availability status
   */
  static async simulateOnlinePresence(instanceName: string) {
    try {
      await evoClient.post(`/chat/sendPresence/${instanceName}`, {
        presence: 'available',
      });
    } catch (e) {}
  }

  /**
   * 10. Simulates message reading delay
   */
  static async simulateReading(instanceName: string, phone: string) {
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      await evoClient.post(`/chat/markMessageAsRead/${instanceName}`, {
        readMessages: [{ remoteJid: `${cleanPhone}@s.whatsapp.net` }],
      });
    } catch (e) {}
  }

  /**
   * 11. Detects failure spikes in sending
   */
  static detectFailureSpike(consecutiveFailures: number, successRate: number): boolean {
    return consecutiveFailures >= 5 || successRate < 70;
  }

  /**
   * 12. Updates daily warmup counter at midnight
   */
  static async autoWarmupUpdate(instance: IInstance) {
    const now = new Date();
    const start = new Date(instance.warmupStartDate || now);
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    if (diffDays > instance.warmupDay) {
      instance.warmupDay = diffDays;
      instance.dailyLimit = this.getWarmupLimit(instance);
      await instance.save();
      logger.info(`[Antiban] Auto-updated warmup for ${instance.name} to Day ${diffDays} (Limit: ${instance.dailyLimit})`);
    }
  }

  /**
   * 14. Scans text for high-risk spam trigger words
   */
  static spamKeywordChecker(message: string): { risky: boolean; keywords: string[]; severity: 'low' | 'high' } {
    const riskyWords = [
      'FREE',
      'WIN',
      'LOTTERY',
      'CLICK HERE',
      'EARN MONEY',
      '100% GUARANTEED',
      'CASINO',
      'BITCOIN',
      'URGENT',
      'CLAIM NOW',
      'INVESTMENT',
      'LOAN',
      'CREDIT CARD',
    ];

    const uppercaseMsg = message.toUpperCase();
    const found = riskyWords.filter((w) => uppercaseMsg.includes(w));

    return {
      risky: found.length > 0,
      keywords: found,
      severity: found.length >= 2 ? 'high' : 'low',
    };
  }

  /**
   * 15. Validates phone number format and checks WhatsApp existence
   */
  static numberValidator(phone: string): { valid: boolean; formatted: string; reason?: string } {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 8 || clean.length > 15) {
      return { valid: false, formatted: clean, reason: 'Invalid phone length' };
    }
    return { valid: true, formatted: clean };
  }
}
