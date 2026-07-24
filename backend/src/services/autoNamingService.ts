import { AutoNameConfig } from '../models/AutoNameConfig.js';
import { Contact } from '../models/Contact.js';
import { logger } from '../utils/logger.js';

export class AutoNamingService {
  /**
   * Gets or creates user's auto-naming configuration (defaults to aRoasBodhi00001 format)
   */
  static async getOrCreateConfig(userId?: string) {
    let query: any = {};
    if (userId) query.userId = userId;

    let config = await AutoNameConfig.findOne(query);

    if (!config) {
      config = await AutoNameConfig.create({
        userId: userId || undefined,
        seriesName: 'aRoasBodhi',
        prefix: 'aRoasBodhi',
        startNumber: 1,
        currentSequence: 0,
        paddingDigits: 5,
        separator: '',
        suffix: '',
        existingNameHandling: 'prefix',
        existingNamePrefix: 'aRoasBodhi_',
        existingNameSuffix: '_aRoasBodhi',
      });
    }

    return config;
  }

  /**
   * Generates the next sequential auto-name for a user
   */
  static async generateNextName(userId?: string): Promise<{ name: string; sequence: number; series: string }> {
    const config = await this.getOrCreateConfig(userId);

    config.currentSequence += 1;
    await config.save();

    const sequenceStr = config.currentSequence.toString().padStart(config.paddingDigits || 5, '0');
    const series = config.prefix || config.seriesName || 'aRoasBodhi';
    const name = `${series}${config.separator || ''}${sequenceStr}${config.suffix || ''}`;

    return { name, sequence: config.currentSequence, series };
  }

  /**
   * Auto-names a single contact according to user config and collision rules
   */
  static async autoNameContact(contactId: string, userId?: string) {
    const contact = await Contact.findById(contactId);
    if (!contact) throw new Error('Contact not found');

    const config = await this.getOrCreateConfig(userId);

    const hasOriginalName = Boolean(contact.name && contact.name.trim() && !contact.isAutoNamed);

    let finalName = '';
    let seqNumber = 0;
    let seriesName = config.seriesName;

    if (hasOriginalName) {
      if (config.existingNameHandling === 'keep') {
        return contact; // Do not touch existing name
      } else if (config.existingNameHandling === 'prefix') {
        finalName = `${config.existingNamePrefix || 'aRoasBodhi_'}${contact.name}`;
      } else if (config.existingNameHandling === 'suffix') {
        finalName = `${contact.name}${config.existingNameSuffix || '_aRoasBodhi'}`;
      } else {
        // replace mode
        const generated = await this.generateNextName(userId);
        finalName = generated.name;
        seqNumber = generated.sequence;
        seriesName = generated.series;
      }
    } else {
      const generated = await this.generateNextName(userId);
      finalName = generated.name;
      seqNumber = generated.sequence;
      seriesName = generated.series;
    }

    contact.autoName = finalName;
    contact.autoNameSeries = seriesName;
    contact.isAutoNamed = true;
    contact.name = finalName;
    contact.displayName = finalName;

    contact.autoNaming = {
      isAutoNamed: true,
      autoName: finalName,
      namingSeries: seriesName,
      sequenceNumber: seqNumber,
      originalName: contact.name || '',
    };

    await contact.save();
    return contact;
  }

  /**
   * Bulk auto-names an array of contacts
   */
  static async bulkAutoName(contactIds: string[], userId?: string) {
    const results = {
      total: contactIds.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of contactIds) {
      try {
        await this.autoNameContact(id, userId);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${id}: ${err.message}`);
      }
    }

    logger.info(`[AutoNaming] Bulk named ${results.success}/${results.total} contacts`);
    return results;
  }

  /**
   * Updates user's auto-naming configuration
   */
  static async updateConfig(userId: string | undefined, updates: any) {
    const config = await this.getOrCreateConfig(userId);
    Object.assign(config, updates);
    await config.save();
    return config;
  }

  /**
   * Generates a preview of the next N auto-names
   */
  static previewNames(config: any, count: number = 5): string[] {
    const preview: string[] = [];
    const startSeq = config.currentSequence || 0;
    const padding = config.paddingDigits || 5;
    const series = config.prefix || config.seriesName || 'aRoasBodhi';
    const sep = config.separator || '';
    const suf = config.suffix || '';

    for (let i = 1; i <= count; i++) {
      const numStr = (startSeq + i).toString().padStart(padding, '0');
      preview.push(`${series}${sep}${numStr}${suf}`);
    }

    return preview;
  }
}
