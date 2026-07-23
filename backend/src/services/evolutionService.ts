import { logger } from '../utils/logger.js';
import { BaileysEngine } from './baileysEngine.js';

export interface CreateInstanceOptions {
  qrcode?: boolean;
  number?: string;
  webhookUrl?: string;
}

export class EvolutionService {
  /**
   * Fast Embedded Baileys Session Initialization (< 100ms)
   */
  static async createInstanceFast(name: string) {
    BaileysEngine.initSession(name);
    return { instance: { instanceName: name, status: 'connecting' } };
  }

  /**
   * Instant Local QR Code Retrieval (0ms delay)
   */
  static async getQRCodeFast(instanceName: string) {
    const localQr = BaileysEngine.getQRCode(instanceName);
    const localStatus = BaileysEngine.getStatus(instanceName);
    return { qrCode: localQr || null, pairingCode: null, status: localStatus };
  }

  static async createInstance(instanceName: string, options: CreateInstanceOptions = {}) {
    return this.createInstanceFast(instanceName);
  }

  static async getQRCode(instanceName: string) {
    return this.getQRCodeFast(instanceName);
  }

  static async getPairingCode(instanceName: string, phoneNumber: string) {
    return '';
  }

  static async getConnectionStatus(instanceName: string) {
    return BaileysEngine.getStatus(instanceName);
  }

  static async disconnectInstance(instanceName: string) {
    BaileysEngine.disconnect(instanceName);
  }

  static async deleteInstance(instanceName: string) {
    BaileysEngine.disconnect(instanceName);
  }

  static async restartInstance(instanceName: string) {
    BaileysEngine.initSession(instanceName);
  }

  static async getContacts(instanceId: string) {
    return [];
  }

  static async getAllGroups(instanceId: string) {
    return [];
  }

  static async getGroupParticipants(instanceId: string, groupId: string) {
    return { participants: [] };
  }

  static async checkNumberExists(instanceId: string, phone: string) {
    const exists = await BaileysEngine.checkOnWhatsApp(instanceId, phone);
    return { exists, jid: `${phone.replace(/[^0-9]/g, '')}@s.whatsapp.net` };
  }
}
