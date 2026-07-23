import { BlacklistNumber, IBlacklistNumber, BlacklistCategory } from '../models/BlacklistNumber.js';
import { BlacklistAction } from '../models/BlacklistAction.js';
import { Contact } from '../models/Contact.js';
import { OptOutKeyword } from '../models/OptOutKeyword.js';
import { PhoneNormalizer } from '../utils/phoneNormalizer.js';
import { MessageService } from './messageService.js';
import { logger } from '../utils/logger.js';

const DEFAULT_OPTOUT = ['stop', 'unsubscribe', 'cancel', 'opt out', 'remove me', 'band karo', 'mat bhejo', 'ruk jao', 'nahi chahiye'];
const DEFAULT_ANGRY = ['report', 'complain', 'spam', 'police', 'lawyer', 'sue', 'fir', 'cybercrime'];

export class BlacklistEngine {
  /**
   * 1. Analyzes incoming replies for opt-out, angry, and negative trigger words
   */
  static async analyzeIncomingMessage(phone: string, message: string, campaignId?: string, instanceName?: string) {
    const normalized = PhoneNormalizer.normalize(phone);
    if (!normalized) return { shouldBan: false };

    const lower = message.toLowerCase();

    // Fetch custom opt-out keywords
    const customKeywords = (await OptOutKeyword.find({ isActive: true })).map((k) => k.keyword.toLowerCase());
    const allOptOut = [...DEFAULT_OPTOUT, ...customKeywords];

    const isOptOut = allOptOut.some((kw) => lower.includes(kw));
    const isAngry = DEFAULT_ANGRY.some((kw) => lower.includes(kw));

    if (isAngry) {
      await this.banNumber(normalized, {
        category: 'angry',
        reason: `Angry reply: "${message}"`,
        confidence: 100,
        triggerCampaign: campaignId,
      });
      if (instanceName) {
        await this.sendUnsubscribeConfirmation(normalized, instanceName);
      }
      return { shouldBan: true, category: 'angry', reason: 'Angry reply' };
    }

    if (isOptOut) {
      await this.banNumber(normalized, {
        category: 'opt_out',
        reason: `Opt-Out keyword matched: "${message}"`,
        confidence: 100,
        triggerCampaign: campaignId,
      });
      if (instanceName) {
        await this.sendUnsubscribeConfirmation(normalized, instanceName);
      }
      return { shouldBan: true, category: 'opt_out', reason: 'Opt-Out keyword' };
    }

    return { shouldBan: false };
  }

  /**
   * 2. Blacklists a phone number and updates contact opt-out status
   */
  static async banNumber(
    phone: string,
    options: {
      category?: BlacklistCategory;
      reason?: string;
      confidence?: number;
      triggerCampaign?: string;
      addedBy?: string;
    } = {}
  ) {
    const normalized = PhoneNormalizer.normalize(phone);
    if (!normalized) throw new Error('Invalid phone number');

    const category = options.category || 'opt_out';
    const reason = options.reason || 'Auto-blacklisted by system';

    let record = await BlacklistNumber.findOne({ phone: normalized });
    if (!record) {
      record = await BlacklistNumber.create({
        phone: normalized,
        normalizedPhone: normalized,
        category,
        reason,
        confidence: options.confidence ?? 100,
        sourceCampaigns: options.triggerCampaign ? [options.triggerCampaign as any] : [],
        addedBy: options.addedBy || undefined,
      });
    }

    // Update Contact status
    await Contact.updateMany({ phone: normalized }, { isOptedOut: true });

    // Log Action Audit
    await BlacklistAction.create({
      phone: normalized,
      action: 'added',
      reason,
      triggeredBy: options.addedBy ? 'user' : 'system',
      performedBy: options.addedBy || undefined,
    });

    logger.info(`[BlacklistEngine] Banned number: ${normalized} (${reason})`);
    return record;
  }

  /**
   * 3. Unbans a phone number (Admin feature)
   */
  static async unbanNumber(phone: string, userId: string, reason = 'Manually unbanned by admin') {
    const normalized = PhoneNormalizer.normalize(phone);
    if (!normalized) throw new Error('Invalid phone number');

    const record = await BlacklistNumber.findOne({ phone: normalized });
    if (!record) throw new Error('Number is not blacklisted');

    await BlacklistNumber.deleteOne({ phone: normalized });
    await Contact.updateMany({ phone: normalized }, { isOptedOut: false });

    await BlacklistAction.create({
      phone: normalized,
      action: 'removed',
      reason,
      triggeredBy: 'user',
      performedBy: userId as any,
    });

    logger.info(`[BlacklistEngine] Unbanned number: ${normalized} by user ${userId}`);
    return { success: true };
  }

  /**
   * 4. Checks if a phone number is blacklisted
   */
  static async checkNumber(phone: string): Promise<{ isBanned: boolean; record?: IBlacklistNumber }> {
    const normalized = PhoneNormalizer.normalize(phone);
    if (!normalized) return { isBanned: false };

    const record = await BlacklistNumber.findOne({ phone: normalized });
    return { isBanned: Boolean(record), record: record || undefined };
  }

  /**
   * 5. Bulk bans an array of numbers
   */
  static async bulkBan(phones: string[], reason: string, category: BlacklistCategory = 'manual', userId?: string) {
    let count = 0;
    for (const p of phones) {
      try {
        await this.banNumber(p, { reason, category, addedBy: userId });
        count++;
      } catch (e: any) {
        logger.warn(`[BlacklistEngine] Bulk ban skipped for phone ${p}: ${e.message}`);
      }
    }
    return { count };
  }

  /**
   * 6. Bulk unbans an array of numbers (Admin only)
   */
  static async bulkUnban(phones: string[], userId: string, reason = 'Bulk unban') {
    let count = 0;
    for (const p of phones) {
      try {
        await this.unbanNumber(p, userId, reason);
        count++;
      } catch (e: any) {
        logger.warn(`[BlacklistEngine] Bulk unban skipped for phone ${p}: ${e.message}`);
      }
    }
    return { count };
  }

  /**
   * 7. Auto-bans based on "Not Interested" or "Unsubscribe" button clicks
   */
  static async handleButtonClickForBan(phone: string, buttonId: string, instanceName?: string) {
    const banButtons = ['not_interested', 'unsubscribe', 'stop', 'dont_contact'];
    if (banButtons.includes(buttonId.toLowerCase())) {
      await this.banNumber(phone, {
        category: 'opt_out',
        reason: `Clicked "${buttonId}" button`,
      });
      if (instanceName) {
        await this.sendUnsubscribeConfirmation(phone, instanceName);
      }
      return true;
    }
    return false;
  }

  /**
   * 8. Sends an automatic unsubscribe confirmation WhatsApp message
   */
  static async sendUnsubscribeConfirmation(phone: string, instanceName: string) {
    try {
      const msg = '✅ You have been unsubscribed successfully. You will not receive any more automated messages from us.';
      await MessageService.sendTextMessage(instanceName, phone, msg);
    } catch (e: any) {
      logger.warn(`[BlacklistEngine] Unsubscribe confirmation failed for phone ${phone}: ${e.message}`);
    }
  }
}
