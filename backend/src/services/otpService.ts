import crypto from 'crypto';
import { OTPRecord } from '../models/OTPRecord.js';
import { BaileysEngine } from './baileysEngine.js';
import { Instance } from '../models/Instance.js';
import { logger } from '../utils/logger.js';

export class OTPService {
  /**
   * Generates a 6-digit cryptographic random OTP code
   */
  static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Normalizes phone number into international format digits only
   */
  static normalizePhone(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      const defaultCC = process.env.DEFAULT_COUNTRY_CODE || '91';
      clean = defaultCC + clean;
    }
    return clean;
  }

  /**
   * Request an OTP for a phone number
   */
  static async requestOTP(phone: string): Promise<{ success: boolean; message: string; devCode?: string }> {
    const cleanPhone = this.normalizePhone(phone);
    if (cleanPhone.length < 10) {
      throw new Error('Invalid phone number. Please enter a valid number with country code.');
    }

    // Delete existing unverified OTP for this phone
    await OTPRecord.deleteMany({ phone: cleanPhone });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    await OTPRecord.create({
      phone: cleanPhone,
      code,
      expiresAt,
    });

    const otpMessage = `🔑 *VOXORA Verification Code*\n\nYour 6-digit OTP is: *${code}*\n\nThis code will expire in 5 minutes. Do not share this code with anyone.`;

    // Find any open WhatsApp instance to dispatch OTP
    let sentViaWhatsApp = false;
    try {
      const activeInstance = await Instance.findOne({ status: 'open' });
      if (!activeInstance?.instanceId) {
        throw new Error('System WhatsApp Gateway is offline. Admin must connect at least 1 WhatsApp account in /instances to send OTPs to WhatsApp.');
      }

      await BaileysEngine.sendMessage(activeInstance.instanceId, cleanPhone, otpMessage);
      sentViaWhatsApp = true;
      logger.info(`[OTP Service] Sent OTP to ${cleanPhone} via instance ${activeInstance.instanceId}`);
    } catch (err: any) {
      logger.error(`[OTP Service] WhatsApp dispatch error: ${err.message}`);
      throw new Error(err.message || 'Failed to dispatch WhatsApp OTP');
    }

    return {
      success: true,
      message: `OTP code sent directly to your WhatsApp number (+${cleanPhone})`,
    };
  }

  /**
   * Verifies an OTP code
   */
  static async verifyOTP(phone: string, code: string): Promise<boolean> {
    const cleanPhone = this.normalizePhone(phone);
    const record = await OTPRecord.findOne({ phone: cleanPhone, isVerified: false }).sort({ createdAt: -1 });

    if (!record) {
      throw new Error('OTP expired or not requested. Please click resend.');
    }

    if (record.attempts >= 5) {
      await OTPRecord.deleteOne({ _id: record._id });
      throw new Error('Too many invalid attempts. Please request a new OTP.');
    }

    if (new Date() > record.expiresAt) {
      await OTPRecord.deleteOne({ _id: record._id });
      throw new Error('OTP has expired. Please request a new OTP.');
    }

    if (record.code !== code.trim()) {
      record.attempts += 1;
      await record.save();
      throw new Error(`Invalid OTP code. ${5 - record.attempts} attempts remaining.`);
    }

    record.isVerified = true;
    await record.save();
    return true;
  }
}
