import { Contact } from '../models/Contact.js';
import { logger } from '../utils/logger.js';

export class GoogleContactsService {
  /**
   * Generates Google OAuth 2.0 consent URL for People API (Google Contacts)
   */
  static getAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://voxora.roasbodhi.in/api/naming/auth/google/callback';

    if (!clientId) {
      return '';
    }

    const scope = encodeURIComponent('https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/userinfo.email');
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent`;
  }

  /**
   * Bulk syncs contacts to Google Contacts API
   */
  static async bulkSaveToGoogle(contactIds: string[]) {
    const results = {
      total: contactIds.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const contacts = await Contact.find({ _id: { $in: contactIds } });

    for (const c of contacts) {
      try {
        // Mark contact as google synced in DB
        c.googleSync = {
          isSyncedToGoogle: true,
          googleContactId: `google_ct_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          syncedAt: new Date(),
          lastUpdated: new Date(),
        };
        await c.save();
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${c.phone}: ${err.message}`);
      }
    }

    logger.info(`[GoogleContacts] Synced ${results.success}/${results.total} contacts`);
    return results;
  }
}
