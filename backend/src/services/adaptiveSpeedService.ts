import { Campaign } from '../models/Campaign.js';
import { MessageLog } from '../models/MessageLog.js';
import { SpeedModeService } from './speedModeService.js';
import { logger } from '../utils/logger.js';

export class AdaptiveSpeedService {
  /**
   * Analyzes live campaign engagement metrics
   */
  static async analyzeCampaignEngagement(campaignId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return null;

    const messagesSent = campaign.sentCount || 0;
    if (messagesSent < 15) return null; // Need minimum sample size

    const replies = await MessageLog.countDocuments({
      campaignId,
      'reply.received': true,
    });

    const buttonClicks = await MessageLog.countDocuments({
      campaignId,
      buttonClicks: { $exists: true, $not: { $size: 0 } },
    });

    const unsubscribes = (campaign as any).buttonBehavior?.totalUnsubscribes || 0;
    const failures = campaign.failedCount || 0;

    const replyRate = (replies / messagesSent) * 100;
    const clickRate = (buttonClicks / messagesSent) * 100;
    const unsubscribeRate = (unsubscribes / messagesSent) * 100;
    const failureRate = (failures / messagesSent) * 100;
    const engagementScore = replyRate + clickRate;

    const recommendation = this.getSpeedRecommendation({
      engagementScore,
      unsubscribeRate,
      failureRate,
    });

    return {
      messagesSent,
      replyRate,
      clickRate,
      unsubscribeRate,
      failureRate,
      engagementScore,
      recommendation,
    };
  }

  /**
   * Generates adaptive speed recommendations based on performance
   */
  private static getSpeedRecommendation(metrics: {
    engagementScore: number;
    unsubscribeRate: number;
    failureRate: number;
  }): { action: 'stop' | 'slow_down' | 'speed_up' | 'maintain'; reason: string; newSpeed?: string } {
    if (metrics.unsubscribeRate > 15) {
      return {
        action: 'stop',
        reason: `High unsubscribe rate (${metrics.unsubscribeRate.toFixed(1)}%). Auto-pausing campaign to prevent account bans.`,
      };
    }

    if (metrics.failureRate > 10) {
      return {
        action: 'slow_down',
        reason: `High failure rate (${metrics.failureRate.toFixed(1)}%). Auto-adjusting speed to Safe mode.`,
        newSpeed: 'safe',
      };
    }

    if (metrics.engagementScore > 20 && metrics.unsubscribeRate < 5) {
      return {
        action: 'speed_up',
        reason: `High audience engagement (${metrics.engagementScore.toFixed(1)}%). Safely increasing speed to Fast mode.`,
        newSpeed: 'fast',
      };
    }

    if (metrics.engagementScore > 10) {
      return {
        action: 'maintain',
        reason: 'Optimal engagement detected. Maintaining current sending speed.',
      };
    }

    return {
      action: 'slow_down',
      reason: 'Low audience interaction. Adjusting speed to Safe mode to preserve sender reputation.',
      newSpeed: 'safe',
    };
  }

  /**
   * Dynamically auto-adjusts speed during campaign execution
   */
  static async autoAdjustSpeed(campaignId: string) {
    const analysis = await this.analyzeCampaignEngagement(campaignId);
    if (!analysis || !analysis.recommendation) return;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    const currentMode = (campaign as any).speedMode || 'medium';
    const rec = analysis.recommendation;

    if (rec.action === 'stop') {
      await Campaign.updateOne(
        { _id: campaignId },
        {
          status: 'paused',
          pauseReason: rec.reason,
          pausedByAutoAntiban: true,
        }
      );
      logger.warn(`[AdaptiveSpeed] Campaign ${campaignId} auto-paused: ${rec.reason}`);
      return;
    }

    if (rec.newSpeed && rec.newSpeed !== currentMode) {
      if (campaign.instanceIds?.[0]) {
        await SpeedModeService.applySpeedMode(campaign.instanceIds[0], rec.newSpeed);
      }

      await Campaign.updateOne(
        { _id: campaignId },
        {
          speedMode: rec.newSpeed,
          speedAdjustedAt: new Date(),
          speedAdjustmentReason: rec.reason,
        }
      );

      logger.info(`[AdaptiveSpeed] Campaign ${campaignId} speed updated: ${currentMode} → ${rec.newSpeed}. ${rec.reason}`);
    }
  }
}
