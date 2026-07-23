import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LicenseKey, ILicenseKey } from '../models/LicenseKey.js';
import { KeyGenService } from './keyGenService.js';
import { logger } from '../utils/logger.js';

const ENCRYPTION_SECRET = process.env.LICENSE_SECRET || 'voxora_dev_license_secret';

export class LicenseService {
  /**
   * 1. Activates a license key for a specific Hardware ID (HWID)
   */
  static async activateLicense(key: string, hwid: string, pcName = '', osInfo = '') {
    const { valid, formatted } = KeyGenService.validateKeyFormat(key);
    if (!valid) {
      throw new Error('Invalid key format. Key must be VXR-XXXX-XXXX-XXXX-XXXX');
    }

    const providedKey = formatted;
    const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
    const record = await LicenseKey.findOne({ $or: [{ key: hashedKey }, { key: providedKey }] });
    if (!record) {
      throw new Error('License key not found');
    }

    if (record.status === 'revoked') {
      throw new Error('License key has been revoked by admin');
    }

    if (record.status === 'expired') {
      throw new Error('License key has expired');
    }

    // HWID Binding Check
    if (record.status === 'active') {
      if (record.boundHWID && record.boundHWID !== hwid) {
        throw new Error('This key is already activated on another PC');
      }
      // Same HWID re-activating
      const daysRemaining = this.getDaysRemaining(record.expiresAt!);
      return {
        success: true,
        alreadyActive: true,
        assignedTo: record.assignedTo || 'User',
        expiresAt: record.expiresAt,
        daysRemaining,
      };
    }

    // Activate Unused Key
    const now = new Date();
    const expiresAt = new Date(now.getTime() + record.validityDays * 24 * 60 * 60 * 1000);

    record.status = 'active';
    record.boundHWID = hwid;
    record.boundPCName = pcName;
    record.boundOSInfo = osInfo;
    record.activatedAt = now;
    record.expiresAt = expiresAt;
    record.lastVerifiedAt = now;
    record.activationCount += 1;
    await record.save();

    const daysRemaining = record.validityDays;

    // Save encrypted local license cache
    this.saveLicenseLocally({
      key: record.key,
      hwid,
      assignedTo: record.assignedTo,
      expiresAt,
    });

    logger.info(`[LicenseService] Key ${record.key} activated on PC ${pcName} (${hwid})`);

    return {
      success: true,
      assignedTo: record.assignedTo || 'Valued User',
      expiresAt,
      daysRemaining,
    };
  }

  /**
   * 2. Verifies license status on startup and periodic background check
   */
  static async verifyLicense(key: string, hwid: string) {
    const providedKey = key;
    const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
    const record = await LicenseKey.findOne({ $or: [{ key: hashedKey }, { key: providedKey }] });
    if (!record) {
      return { valid: false, reason: 'License key not found' };
    }

    if (record.status === 'revoked') {
      return { valid: false, reason: 'License key has been revoked by admin' };
    }

    if (record.boundHWID && record.boundHWID !== hwid) {
      return { valid: false, reason: 'Hardware ID mismatch' };
    }

    const now = new Date();
    if (record.expiresAt && now > record.expiresAt) {
      record.status = 'expired';
      await record.save();
      return { valid: false, reason: 'License key has expired', expiredAt: record.expiresAt };
    }

    record.lastVerifiedAt = now;
    await record.save();

    const daysRemaining = this.getDaysRemaining(record.expiresAt!);

    return {
      valid: true,
      assignedTo: record.assignedTo || 'Valued User',
      expiresAt: record.expiresAt,
      daysRemaining,
      boundPCName: record.boundPCName,
    };
  }

  /**
   * 3. Helper to compute days remaining
   */
  static getDaysRemaining(expiresAt: Date): number {
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * 4. Encrypts and saves license data locally to %APPDATA%/VOXORA/license.dat
   */
  static saveLicenseLocally(licenseData: any) {
    try {
      const appDataDir = process.env.APPDATA || path.join(process.env.HOME || '.', '.voxora');
      const voxoraDir = path.join(appDataDir, 'VOXORA');

      if (!fs.existsSync(voxoraDir)) {
        fs.mkdirSync(voxoraDir, { recursive: true });
      }

      const jsonStr = JSON.stringify(licenseData);
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(ENCRYPTION_SECRET, 'voxora_scrypt_salt_2026', 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const payload = iv.toString('hex') + ':' + encrypted;
      fs.writeFileSync(path.join(voxoraDir, 'license.dat'), payload, 'utf8');
    } catch (e) {
      logger.error('[LicenseService] Failed to save local encrypted license', e);
    }
  }

  /**
   * 5. Loads and decrypts local license file
   */
  static loadLocalLicense(): any | null {
    try {
      const appDataDir = process.env.APPDATA || path.join(process.env.HOME || '.', '.voxora');
      const filePath = path.join(appDataDir, 'VOXORA', 'license.dat');

      if (!fs.existsSync(filePath)) return null;

      const payload = fs.readFileSync(filePath, 'utf8');
      if (!payload.includes(':')) return null;

      const [ivHex, encrypted] = payload.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = crypto.scryptSync(ENCRYPTION_SECRET, 'voxora_scrypt_salt_2026', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (e) {
      return null;
    }
  }
}
