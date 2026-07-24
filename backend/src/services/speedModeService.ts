import { Instance } from '../models/Instance.js';
import { logger } from '../utils/logger.js';

export interface ISpeedMode {
  id: string;
  name: string;
  description: string;
  minDelay: number; // in ms
  maxDelay: number; // in ms
  avgDelay: number; // in ms
  batchSize: number;
  batchBreakMin: number; // in ms
  batchBreakMax: number; // in ms
  hourlyLimit: number;
  dailyLimit: number;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  riskColor: string;
  banProbability: string;
  recommendedFor: string;
  speedMultiplier: number;
  icon: string;
  warningMessage?: string;
  allowedAccountAgeDays?: number; // Account age requirement
}

export const SPEED_MODES: Record<string, ISpeedMode> = {
  ultra_safe: {
    id: 'ultra_safe',
    name: '🐢 Ultra Safe',
    description: 'Slowest, safest option. Zero ban risk.',
    minDelay: 60000,
    maxDelay: 180000,
    avgDelay: 120000,
    batchSize: 5,
    batchBreakMin: 900000,
    batchBreakMax: 1800000,
    hourlyLimit: 30,
    dailyLimit: 300,
    riskLevel: 'minimal',
    riskColor: 'green',
    banProbability: '0.1%',
    recommendedFor: 'New accounts, cold outreach, sensitive content',
    speedMultiplier: 0.3,
    icon: '🐢',
    allowedAccountAgeDays: 0,
  },
  safe: {
    id: 'safe',
    name: '🚶 Safe',
    description: 'Slow and steady. Very low ban risk.',
    minDelay: 30000,
    maxDelay: 90000,
    avgDelay: 60000,
    batchSize: 10,
    batchBreakMin: 600000,
    batchBreakMax: 1200000,
    hourlyLimit: 60,
    dailyLimit: 500,
    riskLevel: 'low',
    riskColor: 'green',
    banProbability: '1-2%',
    recommendedFor: 'Regular campaigns, warmed accounts',
    speedMultiplier: 0.5,
    icon: '🚶',
    allowedAccountAgeDays: 7,
  },
  medium: {
    id: 'medium',
    name: '🏃 Medium (Recommended)',
    description: 'Balanced speed and safety. Best for most cases.',
    minDelay: 15000,
    maxDelay: 45000,
    avgDelay: 30000,
    batchSize: 15,
    batchBreakMin: 300000,
    batchBreakMax: 900000,
    hourlyLimit: 120,
    dailyLimit: 800,
    riskLevel: 'medium',
    riskColor: 'yellow',
    banProbability: '3-5%',
    recommendedFor: 'Established accounts, engaged audiences',
    speedMultiplier: 1.0,
    icon: '🏃',
    allowedAccountAgeDays: 14,
  },
  fast: {
    id: 'fast',
    name: '🚀 Fast',
    description: 'Quick sending. Higher risk but faster results.',
    minDelay: 8000,
    maxDelay: 25000,
    avgDelay: 15000,
    batchSize: 25,
    batchBreakMin: 180000,
    batchBreakMax: 600000,
    hourlyLimit: 240,
    dailyLimit: 1500,
    riskLevel: 'high',
    riskColor: 'orange',
    banProbability: '10-15%',
    recommendedFor: 'Old aged accounts (6+ months), warm audiences',
    speedMultiplier: 2.0,
    icon: '🚀',
    warningMessage: '⚠️ WARNING: Higher ban risk. Recommended only for established WhatsApp accounts.',
    allowedAccountAgeDays: 30,
  },
  turbo: {
    id: 'turbo',
    name: '⚡ Turbo (Risky!)',
    description: 'Maximum speed. High ban risk!',
    minDelay: 3000,
    maxDelay: 10000,
    avgDelay: 6000,
    batchSize: 50,
    batchBreakMin: 60000,
    batchBreakMax: 300000,
    hourlyLimit: 500,
    dailyLimit: 3000,
    riskLevel: 'critical',
    riskColor: 'red',
    banProbability: '25-40%',
    recommendedFor: 'Emergency campaigns, willing to accept account risk',
    speedMultiplier: 4.0,
    icon: '⚡',
    warningMessage: '🚨 DANGER: High ban risk! Number may be flagged or restricted by Meta algorithm if report rate increases.',
    allowedAccountAgeDays: 60,
  },
};

export class SpeedModeService {
  /**
   * Calculates precise estimated completion time for a campaign
   */
  static calculateEstimatedTime(
    contactCount: number,
    speedModeId: string,
    instanceCount: number = 1
  ) {
    const mode = SPEED_MODES[speedModeId] || SPEED_MODES.medium;
    const messagesPerInstance = Math.ceil(contactCount / Math.max(1, instanceCount));
    const batches = Math.ceil(messagesPerInstance / mode.batchSize);

    // Message transmission duration + typing simulation overhead
    const timePerMessageMs = mode.avgDelay + 3000;
    const messagingTimeMs = messagesPerInstance * timePerMessageMs;

    // Batch break overhead
    const avgBreakMs = (mode.batchBreakMin + mode.batchBreakMax) / 2;
    const breakTimeMs = Math.max(0, batches - 1) * avgBreakMs;

    const totalMs = messagingTimeMs + breakTimeMs;
    const totalSeconds = Math.ceil(totalMs / 1000);

    return {
      totalSeconds,
      humanReadable: this.formatDuration(totalSeconds),
      estimatedCompletion: new Date(Date.now() + totalMs),
    };
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  /**
   * Applies selected speed mode parameters to an active WhatsApp Instance
   */
  static async applySpeedMode(instanceId: string, speedModeId: string) {
    const mode = SPEED_MODES[speedModeId] || SPEED_MODES.medium;

    await Instance.findOneAndUpdate(
      { instanceId },
      {
        $set: {
          'messageTiming.minDelay': Math.floor(mode.minDelay / 1000),
          'messageTiming.maxDelay': Math.floor(mode.maxDelay / 1000),
          'messageTiming.batchSize': mode.batchSize,
          'smartLimits.hourlyLimit': mode.hourlyLimit,
          'smartLimits.dailyLimit': mode.dailyLimit,
        },
      }
    );

    logger.info(`[SpeedMode] Applied mode "${mode.name}" to instance ${instanceId}`);
    return mode;
  }

  /**
   * Returns all speed modes accompanied by time estimates for a given contact count
   */
  static getAllModesWithEstimates(contactCount: number, instanceCount: number = 1) {
    return Object.values(SPEED_MODES).map((mode) => ({
      ...mode,
      estimate: this.calculateEstimatedTime(contactCount, mode.id, instanceCount),
    }));
  }
}
