import { Worker, Job } from 'bullmq';
import { connection } from '../queues/index.js';
import { Campaign } from '../models/Campaign.js';
import { CampaignJob } from '../models/CampaignJob.js';
import { Instance } from '../models/Instance.js';
import { AntibanSettings } from '../models/AntibanSettings.js';
import { MessageLog } from '../models/MessageLog.js';
import { AntibanEngine } from '../services/antibanService.js';
import { MessageService } from '../services/messageService.js';
import { getSocketIO } from '../services/socketService.js';
import { logger } from '../utils/logger.js';

let campaignWorkerInstance: Worker | null = null;

export function initCampaignWorker() {
  if (campaignWorkerInstance) return campaignWorkerInstance;
  try {
    campaignWorkerInstance = new Worker(
      'campaign-sending-queue',
      async (job: Job) => {
        const { campaignJobId } = job.data;
        const dbJob = await CampaignJob.findById(campaignJobId);

        if (!dbJob || dbJob.status === 'sent' || dbJob.status === 'skipped') {
          return;
        }

        const campaign = await Campaign.findById(dbJob.campaignId);
        if (!campaign || campaign.status !== 'running' || campaign.pausedByUser) {
          logger.info(`[Worker] Skipping job ${campaignJobId} because campaign is ${campaign?.status}`);
          return;
        }

        const instance = await Instance.findById(dbJob.instanceId);
        if (!instance || instance.status !== 'open') {
          logger.warn(`[Worker] Instance ${dbJob.instanceId} not ready`);
          throw new Error('Instance disconnected');
        }

        const settings: any = (await AntibanSettings.findOne({ userId: campaign.owner || campaign.createdBy })) || {
          minDelay: 20,
          maxDelay: 55,
          messagesPerBatch: 50,
          batchBreakDuration: 10,
          sleepModeEnabled: true,
          sleepStartHour: 22,
          sleepEndHour: 8,
          pauseOnConsecutiveFailures: 5,
        };

        // 1. Sleep Time Check
        if (AntibanEngine.isSleepTime(settings as any)) {
          logger.info(`[Worker] Sleep mode active. Delaying campaign job.`);
          await job.moveToDelayed(Date.now() + 300000); // Retry in 5 minutes
          return;
        }

        // 2. Daily Limit Check
        const dailyCheck = await AntibanEngine.checkDailyLimit(instance);
        if (!dailyCheck.allowed) {
          logger.warn(`[Worker] Instance daily limit reached (${instance.dailyLimit})`);
          await job.moveToDelayed(dailyCheck.resetAt.getTime());
          return;
        }

        // 3. Hourly Limit Check
        const hourlyCheck = await AntibanEngine.checkHourlyLimit(instance);
        if (!hourlyCheck.allowed) {
          logger.warn(`[Worker] Hourly limit reached for ${instance.name}. Delaying 10m.`);
          await job.moveToDelayed(Date.now() + 600000);
          return;
        }

        // 4. Batch Break Check
        const breakCheck = AntibanEngine.shouldTakeBreak(campaign.currentBatch, settings.messagesPerBatch);
        if (breakCheck.breakNeeded) {
          campaign.currentBatch = 0;
          await campaign.save();
          logger.info(`[Worker] Taking batch break for ${breakCheck.durationMinutes} minutes`);
          await job.moveToDelayed(Date.now() + breakCheck.durationMinutes * 60000);
          return;
        }

        // Update job status to processing
        dbJob.status = 'processing';
        dbJob.attempts += 1;
        dbJob.lastAttemptAt = new Date();
        await dbJob.save();

        // 5. Anti-Ban Human Simulation (Delays & Typing)
        const randomDelayMs = AntibanEngine.calculateRandomDelay(settings as any);
        await new Promise((resolve) => setTimeout(resolve, randomDelayMs));

        await AntibanEngine.simulateTyping(instance.instanceId, dbJob.phone, String(dbJob.messageData.content || '').length);

        // 6. Send Message via MessageService
        try {
          const result = await MessageService.sendTestMessage(instance.instanceId, dbJob.phone, dbJob.messageData);

          dbJob.status = 'sent';
          dbJob.sentAt = new Date();
          dbJob.messageId = result?.key?.id || `msg_${Date.now()}`;
          await dbJob.save();

          // Update counters
          await Campaign.updateOne(
            { _id: campaign._id },
            { $inc: { sentCount: 1, currentBatch: 1 }, $set: { consecutiveFailures: 0 } }
          );
          await Instance.updateOne(
            { _id: instance._id },
            { $inc: { currentDayCount: 1, currentHourCount: 1, totalMessagesSent: 1 }, $set: { consecutiveFailures: 0 } }
          );

          // Socket.IO Progress Broadcast (Room Targeted)
          const io = getSocketIO();
          if (io) {
            const freshCampaign = await Campaign.findById(campaign._id);
            io.to(`campaign:${campaign._id}`).emit(`campaign:${campaign._id}:progress`, {
              sentCount: freshCampaign?.sentCount || 0,
              totalContacts: campaign.totalContacts,
              recentPhone: dbJob.phone,
              status: 'sent',
            });
          }
        } catch (error: any) {
          dbJob.status = 'failed';
          dbJob.failedAt = new Date();
          dbJob.errorMessage = error.message || 'Send failed';
          await dbJob.save();

          campaign.failedCount += 1;
          instance.consecutiveFailures += 1;
          await campaign.save();
          await instance.save();

          // Auto-pause if failures exceed threshold
          if (instance.consecutiveFailures >= (settings.pauseOnConsecutiveFailures || 5)) {
            campaign.status = 'paused';
            campaign.pausedByAutoAntiban = true;
            campaign.pauseReason = `Auto-paused: ${instance.consecutiveFailures} consecutive failures`;
            await campaign.save();
            logger.warn(`[Antiban] Auto-paused campaign ${campaign._id} due to consecutive failures`);
          }

          throw error;
        }
      },
      {
        connection,
        concurrency: 2,
      }
    );
    return campaignWorkerInstance;
  } catch (err: any) {
    logger.warn(`[Campaign Worker] Failed to initialize BullMQ worker (Redis offline): ${err.message}`);
    return null;
  }
}

export const campaignWorker = initCampaignWorker();
