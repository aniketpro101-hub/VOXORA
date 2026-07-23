import { Campaign } from '../models/Campaign.js';
import { CampaignService } from './campaignService.js';
import { logger } from '../utils/logger.js';

export class SchedulerService {
  private static timer: NodeJS.Timeout | null = null;

  static startScheduler() {
    if (this.timer) return;

    logger.info('[Scheduler] Campaign Scheduler Service initialized (10s polling interval)');
    this.timer = setInterval(async () => {
      try {
        const now = new Date();
        const dueCampaigns = await Campaign.find({
          status: 'scheduled',
          scheduledAt: { $lte: now },
        });

        for (const c of dueCampaigns) {
          logger.info(`[Scheduler] Triggering scheduled campaign ${c.name} (${c._id})`);
          const ownerId = c.owner ? c.owner.toString() : c.createdBy ? c.createdBy.toString() : '';
          await CampaignService.startCampaign(c._id.toString(), ownerId);
        }
      } catch (err: any) {
        logger.error(`[Scheduler Error] ${err.message}`);
      }
    }, 10000);
  }

  static stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
