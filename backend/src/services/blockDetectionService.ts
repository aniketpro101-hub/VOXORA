import { Instance } from '../models/Instance.js';
import { MessageLog } from '../models/MessageLog.js';
import { logger } from '../utils/logger.js';

export class BlockDetectionService {
  /**
   * Detects potential recipient block events (messages sent but undelivered over 7 days)
   */
  static async detectPotentialBlocks(instanceId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const potentialBlocks = await MessageLog.countDocuments({
      instanceId,
      status: 'sent',
      sentAt: { $lt: sevenDaysAgo },
      deliveredAt: { $exists: false },
      readAt: { $exists: false },
    });

    const totalRecentSent = await MessageLog.countDocuments({
      instanceId,
      sentAt: { $lt: sevenDaysAgo },
    });

    const blockRate = totalRecentSent > 0 ? (potentialBlocks / totalRecentSent) * 100 : 0;

    await Instance.findOneAndUpdate(
      { instanceId },
      {
        $set: {
          'blockMetrics.totalNoDelivery': potentialBlocks,
          'blockMetrics.blockRate': blockRate,
          'blockMetrics.lastBlockRateCheck': new Date(),
        },
      }
    );

    if (blockRate > 5) {
      await Instance.findOneAndUpdate(
        { instanceId },
        {
          $set: {
            'antibanHealth.needsRest': true,
            'antibanHealth.restUntil': new Date(Date.now() + 86400000), // 24h rest
            'blockMetrics.autoStoppedDueToBlocks': true,
          },
        }
      );
      logger.error(`[BlockDetector] Instance ${instanceId} block rate CRITICAL: ${blockRate.toFixed(1)}%. Auto-resting for 24h.`);
    } else if (blockRate > 3) {
      logger.warn(`[BlockDetector] Instance ${instanceId} block rate HIGH: ${blockRate.toFixed(1)}%. Consider switching to Safe speed mode.`);
    }

    return {
      totalSent: totalRecentSent,
      potentialBlocks,
      blockRate,
      status: blockRate > 5 ? 'critical' : blockRate > 3 ? 'warning' : 'safe',
    };
  }
}
