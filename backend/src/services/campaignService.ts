import { Campaign, ICampaign } from '../models/Campaign.js';
import { CampaignJob } from '../models/CampaignJob.js';
import { Contact } from '../models/Contact.js';
import { Instance } from '../models/Instance.js';
import { MessageLog } from '../models/MessageLog.js';
import { BaileysEngine } from './baileysEngine.js';
import ContactInfoFormatter from '../utils/contactInfoFormatter.js';
import { BlacklistEngine } from './blacklistService.js';
import { AntibanEngine } from './antibanService.js';
import { AntibanSettings } from '../models/AntibanSettings.js';
import IntelligentDistributor from './intelligentDistributor.js';
import { logger } from '../utils/logger.js';

export class CampaignService {
  /**
   * Helper to parse Spintax: {Hi|Hello|Hey} -> Random choice
   */
  private static parseSpinTax(text: string): string {
    return text.replace(/\{([^{}]+)\}/g, (match, choices) => {
      const arr = choices.split('|');
      return arr[Math.floor(Math.random() * arr.length)];
    });
  }

  /**
   * 1. Create a draft campaign
   */
  static async createCampaign(data: any, userId: string): Promise<ICampaign> {
    let contactIds: any[] = data.contacts || [];

    if (data.recipientNumbers && Array.isArray(data.recipientNumbers)) {
      for (const phone of data.recipientNumbers) {
        const clean = phone.replace(/[^0-9]/g, '');
        if (!clean) continue;
        let c = await Contact.findOne({ phone: clean });
        if (!c) {
          c = await Contact.create({
            name: `Contact ${clean.slice(-4)}`,
            phone: clean,
            source: 'quick_message',
            createdBy: userId,
          });
        }
        contactIds.push(c._id);
      }
    }

    const totalContacts = contactIds.length || data.totalContacts || 0;

    if (data.mediaFiles && data.mediaFiles.length > 0 && !data.mediaUrl) {
      data.mediaUrl = data.mediaFiles[0];
    }

    const campaign = await Campaign.create({
      name: data.name,
      message: data.message,
      messageTemplate: data.messageTemplate || data.message,
      messageTemplates: data.messageTemplates || (data.message ? [data.message] : []),
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      mediaCaption: data.mediaCaption,
      totalContacts,
      contacts: contactIds,
      status: 'draft',
      owner: userId,
      createdBy: userId,
      scheduleAt: data.scheduleAt,
      settings: data.settings,
      stats: {
        totalContacts,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        repliedCount: 0,
        failedCount: 0,
      },
    });

    return campaign;
  }

  /**
   * 2. Start campaign & launch real WhatsApp message execution loop in background
   */
  static async startCampaign(campaignId: string, userId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status === 'running') {
      return { campaign, enqueuedJobs: 0 };
    }

    // Instance fallback check
    let instanceIds = campaign.instanceIds;
    if (!instanceIds || instanceIds.length === 0) {
      const firstActiveInst = await Instance.findOne({ status: 'open' });
      if (firstActiveInst) {
        instanceIds = [firstActiveInst._id as any];
      }
      campaign.instanceIds = instanceIds;
    }

    campaign.status = 'running';
    campaign.startedAt = new Date();
    campaign.pausedByUser = false;
    campaign.pausedByAutoAntiban = false;
    await campaign.save();

    // Trigger asynchronous background dispatch
    this.processCampaignMessages(campaign._id.toString()).catch((err) => {
      logger.error(`[Campaign Engine Error] ${err.message}`);
    });

    logger.info(`[CampaignService] Dispatched campaign ${campaignId} background execution`);
    return { campaign, enqueuedJobs: campaign.totalContacts };
  }

  /**
   * Background runner that actually sends messages via Baileys Engine
   */
  private static async processCampaignMessages(campaignId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    const contacts = await Contact.find({ _id: { $in: campaign.contacts } });
    if (!contacts || contacts.length === 0) {
      campaign.status = 'completed';
      await campaign.save();
      return;
    }

    // Dynamic Capacity-Aware Intelligent SIM Selection (Phase B)
    let activeInstanceDoc = null;
    try {
      activeInstanceDoc = await IntelligentDistributor.getBestInstance(campaignId);
    } catch (distErr: any) {
      logger.warn(`[Intelligent Distributor] Fallback lookup: ${distErr.message}`);
    }

    let instanceIdStr = activeInstanceDoc?.instanceId || '';
    if (!instanceIdStr && campaign.instanceIds && campaign.instanceIds.length > 0) {
      const instDoc = await Instance.findById(campaign.instanceIds[0]);
      instanceIdStr = instDoc?.instanceId || (typeof campaign.instanceIds[0] === 'string' ? campaign.instanceIds[0] : '');
    }
    if (!instanceIdStr) {
      const activeInst = await Instance.findOne({ status: 'open' });
      instanceIdStr = activeInst?.instanceId || '';
    }
    if (!instanceIdStr) {
      logger.error(`[Campaign Engine] No valid connected WhatsApp instance found for campaign ${campaignId}`);
      campaign.status = 'failed';
      await campaign.save();
      return;
    }
    
    // PRIORITY ORDER FOR MESSAGE CONTENT (Never fall back to campaign.name!)
    const messageTemplate =
      campaign.messageTemplates?.[0] ||
      campaign.messageTemplate ||
      campaign.message ||
      '';

    if (!messageTemplate && (!campaign.mediaFiles || campaign.mediaFiles.length === 0) && !campaign.mediaUrl) {
      logger.error(`[Campaign Engine] Campaign ${campaignId} has no text message or media content to send!`);
      campaign.status = 'failed';
      await campaign.save();
      return;
    }

    const mediaFiles: string[] = campaign.mediaFiles?.length
      ? campaign.mediaFiles
      : campaign.mediaUrl
      ? [campaign.mediaUrl]
      : [];

    for (const c of contacts) {
      // Refresh campaign status to check for pause/stop commands
      const currentCampaign = await Campaign.findById(campaignId);
      if (!currentCampaign || currentCampaign.status === 'paused' || currentCampaign.status === 'stopped') {
        logger.info(`[Campaign Engine] Campaign ${campaignId} paused or stopped.`);
        return;
      }

      if (!currentCampaign.stats) {
        currentCampaign.stats = { totalContacts: contacts.length, sentCount: 0, deliveredCount: 0, readCount: 0, repliedCount: 0, failedCount: 0 };
      }

      // Skip if already sent
      const existingLog = await MessageLog.findOne({ campaignId: campaign._id, recipientPhone: c.phone, status: { $in: ['sent', 'delivered'] } });
      if (existingLog) continue;

      // Check Blacklist
      const blacklistCheck = await BlacklistEngine.checkNumber(c.phone);
      if (blacklistCheck.isBanned) {
        logger.info(`[Campaign Engine] Skipping blacklisted contact: ${c.phone}`);
        await Campaign.updateOne({ _id: campaignId }, { $inc: { failedCount: 1, 'stats.failedCount': 1 } });
        continue;
      }

      let processedText = this.parseSpinTax(messageTemplate);

      // Append interactive buttons as ultra-beautiful formatted options list
      if (campaign.buttons && campaign.buttons.length > 0) {
        processedText += '\n\n━━━━━━━━━━━━━━━━━━━━━\n';
        processedText += '👇 *Please reply with:*\n\n';
        campaign.buttons.forEach((b: any, idx: number) => {
          const num = idx + 1;
          const type = b.type || 'reply';
          const text = b.text || b;
          const emoji = type === 'url' ? '🌐' : type === 'call' ? '📞' : '💬';

          if (type === 'url' && b.url) {
            processedText += `${emoji} *${num}* ─ ${text}\n    🔗 ${b.url}\n\n`;
          } else if (type === 'call' && b.phone) {
            processedText += `${emoji} *${num}* ─ ${text}\n    📞 ${b.phone}\n\n`;
          } else {
            processedText += `${emoji} *${num}* ─ ${text}\n`;
          }
        });
        processedText += '━━━━━━━━━━━━━━━━━━━━━\n';
        processedText += '_💡 Just type the number and send_';
      } else if (campaign.listMenu && campaign.listMenu.sections && campaign.listMenu.sections.length > 0) {
        processedText += '\n\n━━━━━━━━━━━━━━━━━━━━━\n';
        processedText += `📋 *${campaign.listMenu.title || 'Available Options'}*\n`;
        if (campaign.listMenu.description) processedText += `${campaign.listMenu.description}\n`;
        processedText += '━━━━━━━━━━━━━━━━━━━━━\n';

        let optNum = 1;
        campaign.listMenu.sections.forEach((sec: any) => {
          if (sec.title) processedText += `\n*${sec.title}*\n─────────────\n`;
          sec.rows?.forEach((row: any) => {
            processedText += `*${optNum}.* ${row.title || row.id}\n`;
            if (row.description) processedText += `   _${row.description}_\n`;
            optNum++;
          });
        });

        processedText += '\n━━━━━━━━━━━━━━━━━━━━━\n';
        processedText += '_💬 Reply with option number (e.g. "1")_';
      }

      // Append Smart Contact Info Links (Website, Call, WhatsApp, Instagram, YouTube, etc.)
      if (campaign.showContactInfo !== false && campaign.contactInfo) {
        if (ContactInfoFormatter.hasContactInfo(campaign.contactInfo)) {
          const contactText = ContactInfoFormatter.formatToMessage(
            campaign.contactInfo,
            campaign.contactInfoHeader || '📞 *Contact Us:*'
          );
          if (contactText) {
            processedText += '\n\n' + contactText;
          }
        }
      }

      // Apply Zero-Width Invisible Character Injection to prevent automated text hashing
      const finalPayloadText = AntibanEngine.injectZeroWidthChars(processedText);

      // Simulate human typing presence before dispatching
      await AntibanEngine.simulateTyping(instanceIdStr, c.phone, finalPayloadText.length);

      try {
        // Multi-image / Multi-media dispatch loop
        if (mediaFiles.length > 0) {
          for (let mIdx = 0; mIdx < mediaFiles.length; mIdx++) {
            const singleMedia = mediaFiles[mIdx];
            // Include caption with the first image
            const caption = mIdx === 0 ? finalPayloadText : '';
            await BaileysEngine.sendMessage(instanceIdStr, c.phone, caption, { mediaUrl: singleMedia });
            if (mIdx < mediaFiles.length - 1) {
              await new Promise((r) => setTimeout(r, 600)); // Delay buffer between multi-images
            }
          }
        } else {
          await BaileysEngine.sendMessage(instanceIdStr, c.phone, finalPayloadText);
        }

        // Log successful message dispatch with button details
        await MessageLog.create({
          campaignId: campaign._id,
          instanceId: instanceIdStr,
          contactId: c._id,
          recipientPhone: c.phone,
          messageType: mediaFiles.length > 0 ? 'media' : 'text',
          content: processedText,
          status: 'delivered',
          sentAt: new Date(),
          deliveredAt: new Date(),
          hasButtons: !!(campaign.buttons && campaign.buttons.length > 0),
          buttons: campaign.buttons || [],
        });

        await Campaign.updateOne(
          { _id: campaignId },
          { $inc: { sentCount: 1, deliveredCount: 1, 'stats.sentCount': 1, 'stats.deliveredCount': 1 } }
        );

        if (activeInstanceDoc?._id) {
          await IntelligentDistributor.recordUsage(String(activeInstanceDoc._id), true);
        }
      } catch (sendErr: any) {
        logger.warn(`[Campaign Engine] Failed sending to ${c.phone}: ${sendErr.message}`);

        await MessageLog.create({
          campaignId: campaign._id,
          instanceId: instanceIdStr,
          contactId: c._id,
          recipientPhone: c.phone,
          messageType: mediaFiles.length > 0 ? 'media' : 'text',
          content: { text: processedText, mediaFiles },
          status: 'failed',
          failureReason: sendErr.message || 'WhatsApp dispatch error',
        });

        await Campaign.updateOne(
          { _id: campaignId },
          { $inc: { failedCount: 1, 'stats.failedCount': 1 } }
        );

        if (activeInstanceDoc?._id) {
          await IntelligentDistributor.recordUsage(String(activeInstanceDoc._id), false);
        }
      }

      // Anti-ban delay driven by user settings (default: 20s - 45s safe interval)
      let minDelay = 20;
      let maxDelay = 45;
      try {
        const abSet = await AntibanSettings.findOne();
        if (abSet) {
          minDelay = abSet.minDelay ?? 20;
          maxDelay = abSet.maxDelay ?? 45;
        }
      } catch (e) {}

      const delayMs = AntibanEngine.calculateRandomDelay({ minDelay, maxDelay });
      logger.info(`[Campaign Engine] Anti-ban delay: ${(delayMs / 1000).toFixed(1)}s before next message`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const finalCampaign = await Campaign.findById(campaignId);
    if (finalCampaign && finalCampaign.status === 'running') {
      finalCampaign.status = 'completed';
      finalCampaign.completedAt = new Date();
      finalCampaign.markModified('stats');
      await finalCampaign.save();
      logger.info(`[Campaign Engine] Campaign ${campaignId} finished execution!`);
    }
  }

  /**
   * 3. Pause campaign
   */
  static async pauseCampaign(campaignId: string, userId: string, reason = 'User paused', byUser = true) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'paused';
    campaign.pausedByUser = byUser;
    campaign.pausedByAutoAntiban = !byUser;
    campaign.pauseReason = reason;
    campaign.pausedAt = new Date();
    await campaign.save();

    return campaign;
  }

  /**
   * 4. Resume campaign
   */
  static async resumeCampaign(campaignId: string, userId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'running';
    await campaign.save();

    this.processCampaignMessages(campaign._id.toString()).catch((err) => {
      logger.error(`[Campaign Engine Error] ${err.message}`);
    });

    return { campaign, enqueuedJobs: campaign.totalContacts };
  }

  /**
   * 5. Stop campaign
   */
  static async stopCampaign(campaignId: string, userId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'stopped';
    await campaign.save();
    return campaign;
  }

  /**
   * 6. Clone campaign
   */
  static async cloneCampaign(campaignId: string, newName: string, userId: string) {
    const original = await Campaign.findById(campaignId);
    if (!original) throw new Error('Original campaign not found');

    const cloned = await Campaign.create({
      name: newName || `${original.name} (Copy)`,
      messageTemplates: original.messageTemplates,
      contacts: original.contacts,
      totalContacts: original.totalContacts,
      status: 'draft',
      owner: userId,
      createdBy: userId,
      stats: {
        totalContacts: original.totalContacts,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        repliedCount: 0,
        failedCount: 0,
      },
    });

    return cloned;
  }

  /**
   * 7. Schedule campaign
   */
  static async scheduleCampaign(campaignData: any, scheduledAt: Date, userId: string) {
    const campaign = await this.createCampaign(campaignData, userId);
    campaign.status = 'scheduled';
    campaign.scheduledAt = scheduledAt;
    await campaign.save();
    return campaign;
  }

  /**
   * 8. Real Retry failed messages via Baileys Engine
   */
  static async retryFailedMessages(campaignId: string, userId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const failedLogs = await MessageLog.find({ campaignId: campaign._id, status: 'failed' });
    let retriedSuccess = 0;

    let instanceIdStr = '';
    if (campaign.instanceIds && campaign.instanceIds.length > 0) {
      const instDoc = await Instance.findById(campaign.instanceIds[0]);
      instanceIdStr = instDoc?.instanceId || (typeof campaign.instanceIds[0] === 'string' ? campaign.instanceIds[0] : '');
    }
    if (!instanceIdStr) {
      const activeInst = await Instance.findOne({ status: 'open' });
      instanceIdStr = activeInst?.instanceId || '';
    }

    for (const log of failedLogs) {
      try {
        const text =
          typeof log.content === 'string'
            ? log.content
            : log.content?.text || campaign.messageTemplates?.[0] || campaign.messageTemplate || campaign.message || '';
        await BaileysEngine.sendMessage(instanceIdStr, log.recipientPhone, text);

        log.status = 'delivered';
        log.failureReason = undefined;
        await log.save();
        retriedSuccess++;
      } catch (err: any) {
        log.failureReason = err.message;
        await log.save();
      }
    }

    if (campaign.stats) {
      campaign.stats.failedCount = Math.max(0, (campaign.stats.failedCount || 0) - retriedSuccess);
      campaign.stats.sentCount = (campaign.stats.sentCount || 0) + retriedSuccess;
      campaign.stats.deliveredCount = (campaign.stats.deliveredCount || 0) + retriedSuccess;
      await campaign.save();
    }

    return { retriedCount: retriedSuccess, totalFailed: failedLogs.length };
  }

  /**
   * 9. Get campaign progress
   */
  static async getCampaignProgress(campaignId: string, userId?: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    return {
      campaignId: campaign._id,
      name: campaign.name,
      status: campaign.status,
      total: campaign.totalContacts,
      sent: campaign.stats?.sentCount || 0,
      delivered: campaign.stats?.deliveredCount || 0,
      read: campaign.stats?.readCount || 0,
      failed: campaign.stats?.failedCount || 0,
    };
  }

  /**
   * Resume campaigns interrupted by server restarts
   */
  static async resumeRunningCampaigns() {
    try {
      const runningCampaigns = await Campaign.find({ status: 'running' });
      if (runningCampaigns.length === 0) return;

      logger.info(`[Campaign Service] Found ${runningCampaigns.length} running campaigns. Resuming background dispatch...`);
      for (const c of runningCampaigns) {
        this.processCampaignMessages(c._id.toString()).catch((err) => {
          logger.error(`[Campaign Service] Resume error for ${c._id}: ${err.message}`);
        });
      }
    } catch (err: any) {
      logger.error(`[Campaign Service] Resume running campaigns failed: ${err.message}`);
    }
  }
}
