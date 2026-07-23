import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { LicenseKey, ILicenseKey } from '../models/LicenseKey.js';
import { logger } from '../utils/logger.js';

// Non-ambiguous uppercase characters (excluding 0, O, 1, I, L)
const CHAR_POOL = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export class KeyGenService {
  /**
   * Generates a 1-character checksum for a given string key
   */
  private static calculateChecksum(str: string): string {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i) * (i + 1);
    }
    return CHAR_POOL[sum % CHAR_POOL.length];
  }

  /**
   * Generates a single unique key: VXR-XXXX-XXXX-XXXX-XXXX
   */
  static generateSingleKey(): string {
    const getRandomSection = (len = 4) => {
      let result = '';
      for (let i = 0; i < len; i++) {
        const idx = crypto.randomInt(0, CHAR_POOL.length);
        result += CHAR_POOL[idx];
      }
      return result;
    };

    const s1 = getRandomSection(4);
    const s2 = getRandomSection(4);
    const s3 = getRandomSection(4);
    const s4Base = getRandomSection(3);
    const checksum = this.calculateChecksum(`VXR-${s1}-${s2}-${s3}-${s4Base}`);
    const s4 = `${s4Base}${checksum}`;

    return `VXR-${s1}-${s2}-${s3}-${s4}`;
  }

  /**
   * Validates format and checksum
   */
  static validateKeyFormat(key: string): { valid: boolean; formatted: string } {
    if (!key) return { valid: false, formatted: '' };
    const formatted = key.trim().toUpperCase();

    const regex = /^VXR-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
    if (!regex.test(formatted)) {
      return { valid: false, formatted };
    }

    const basePart = formatted.substring(0, 22);
    const expectedChecksum = formatted.charAt(22);
    const actualChecksum = this.calculateChecksum(basePart);

    return {
      valid: expectedChecksum === actualChecksum,
      formatted,
    };
  }

  /**
   * Bulk generates N keys (default 10) and saves them in local database
   */
  static async generateBulkKeys(count = 10, adminNotes = 'Testing Batch 1'): Promise<ILicenseKey[]> {
    const createdKeys: ILicenseKey[] = [];

    for (let i = 0; i < count; i++) {
      let keyStr = this.generateSingleKey();
      let exists = await LicenseKey.findOne({ key: keyStr });

      while (exists) {
        keyStr = this.generateSingleKey();
        exists = await LicenseKey.findOne({ key: keyStr });
      }

      const record = await LicenseKey.create({
        key: keyStr,
        status: 'unused',
        validityDays: 30,
        adminNotes,
        generatedAt: new Date(),
      });

      createdKeys.push(record);
    }

    logger.info(`[KeyGenService] Generated ${count} new VOXORA license keys`);
    return createdKeys;
  }

  /**
   * Exports all license keys to Excel binary buffer
   */
  static async exportKeysToExcel(): Promise<Buffer> {
    const keys = await LicenseKey.find().sort({ createdAt: -1 });

    const rows = keys.map((k) => ({
      'License Key': k.key,
      'Status': k.status.toUpperCase(),
      'Assigned To': k.assignedTo || 'Unassigned',
      'Validity (Days)': k.validityDays,
      'Bound PC': k.boundPCName || 'None',
      'Bound HWID': k.boundHWID || 'None',
      'Activated At': k.activatedAt ? new Date(k.activatedAt).toLocaleString() : 'N/A',
      'Expires At': k.expiresAt ? new Date(k.expiresAt).toLocaleString() : 'N/A',
      'Admin Notes': k.adminNotes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'VOXORA License Keys');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
