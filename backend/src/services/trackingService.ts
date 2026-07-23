import crypto from 'crypto';
import { LinkClick } from '../models/LinkClick.js';
import { MediaInteraction } from '../models/MediaInteraction.js';
import { CallEvent } from '../models/CallEvent.js';
import { MessageLog } from '../models/MessageLog.js';
import { logger } from '../utils/logger.js';

export class TrackingService {
  /**
   * 1. Creates a unique short tracking URL (e.g. voxora.co/abc123)
   */
  static async createShortUrl(url: string, messageId?: string, contactId?: string): Promise<string> {
    const shortCode = crypto.randomBytes(3).toString('hex');
    const shortUrl = `voxora.co/${shortCode}`;

    await LinkClick.create({
      url,
      shortUrl,
      messageId: messageId ? (messageId as any) : undefined,
      contactId: contactId ? (contactId as any) : undefined,
      clickedAt: new Date(),
    });

    return shortUrl;
  }

  /**
   * 2. Registers a URL link click event and updates MessageLog metrics
   */
  static async recordLinkClick(shortUrl: string, ipAddress = '', userAgent = '') {
    const click = await LinkClick.findOne({ shortUrl });
    if (!click) return null;

    click.clickedAt = new Date();
    click.ipAddress = ipAddress;
    click.userAgent = userAgent;
    await click.save();

    if (click.messageId) {
      await MessageLog.findByIdAndUpdate(click.messageId, { $inc: { linkClickCount: 1 } });
    }

    logger.info(`[Tracking] Short URL clicked: ${shortUrl} -> ${click.url}`);
    return click.url;
  }

  /**
   * 3. Records a media view/download event
   */
  static async recordMediaInteraction(messageId: string, contactId: string, mediaUrl: string, mediaType: string, action: 'viewed' | 'downloaded') {
    await MediaInteraction.create({
      messageId: messageId as any,
      contactId: contactId as any,
      mediaUrl,
      mediaType,
      action,
      timestamp: new Date(),
    });

    const updateField = action === 'viewed' ? { $inc: { mediaViewCount: 1 } } : { $inc: { mediaDownloadCount: 1 } };
    await MessageLog.findByIdAndUpdate(messageId, updateField);
  }
}
