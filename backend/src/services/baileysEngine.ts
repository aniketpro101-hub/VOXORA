import makeWASocket, { useMultiFileAuthState, DisconnectReason, proto } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { Instance } from '../models/Instance.js';
import { emitInstanceEvent } from './socketService.js';
import messageFallbackEngine, { ButtonItem, ListSection, CarouselCard } from './messageFallbackEngine.js';

export class BaileysEngine {
  private static sessions: Map<string, any> = new Map();
  private static qrCodes: Map<string, string> = new Map();

  static async initSession(instanceId: string, forceFresh: boolean = false) {
    try {
      const authFolder = path.join(process.cwd(), 'uploads', 'sessions', instanceId);
      if (forceFresh && fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
      }
      if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(authFolder);

      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['VOXORA Desktop', 'Chrome', '1.0.0'],
        syncFullHistory: false,
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            this.qrCodes.set(instanceId, qrDataUrl);
            const updated = await Instance.findOneAndUpdate(
              { instanceId },
              { qrCode: qrDataUrl, status: 'qr' },
              { new: true, upsert: true }
            );
            if (updated) {
              emitInstanceEvent('qrCode:updated', {
                id: updated._id.toString(),
                instanceId: updated.instanceId,
                qrCode: qrDataUrl,
              });
            }
            logger.info(`[Baileys] Generated QR Code for instance: ${instanceId}`);
          } catch (err: any) {
            logger.error(`[Baileys] QR Generation error: ${err.message}`);
          }
        }

        if (connection === 'open') {
          const userJid = socket.user?.id || '';
          const phone = userJid.split(':')[0] || userJid.split('@')[0] || '';
          this.qrCodes.delete(instanceId);
          const updated = await Instance.findOneAndUpdate(
            { instanceId },
            { status: 'open', phoneNumber: phone, qrCode: '' },
            { new: true, upsert: true }
          );
          if (updated) {
            emitInstanceEvent('status:changed', {
              id: updated._id.toString(),
              instanceId: updated.instanceId,
              status: 'open',
              phoneNumber: phone,
            });
          }
          logger.info(`[Baileys] WhatsApp Connected for instance ${instanceId}: +${phone}`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          if (shouldReconnect) {
            logger.info(`[Baileys] Reconnecting instance: ${instanceId}...`);
            setTimeout(() => this.initSession(instanceId), 3000);
          } else {
            const updated = await Instance.findOneAndUpdate({ instanceId }, { status: 'close', qrCode: '' }, { new: true });
            this.sessions.delete(instanceId);
            this.qrCodes.delete(instanceId);
            if (updated) {
              emitInstanceEvent('status:changed', {
                id: updated._id.toString(),
                instanceId: updated.instanceId,
                status: 'close',
              });
            }
            logger.warn(`[Baileys] Instance logged out: ${instanceId}`);
          }
        }
      });

      this.sessions.set(instanceId, socket);
      return socket;
    } catch (err: any) {
      logger.error(`[Baileys Engine Error]: ${err.message}`);
      return null;
    }
  }

  static getSession(instanceId: string): any {
    if (instanceId && this.sessions.has(instanceId)) {
      return this.sessions.get(instanceId);
    }
    return null;
  }

  static async getPairingCode(instanceId: string, phone: string): Promise<string> {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp session not initialized');
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const code = await socket.requestPairingCode(cleanPhone);
    return code;
  }

  static getQRCode(instanceId: string): string {
    return this.qrCodes.get(instanceId) || '';
  }

  static getStatus(instanceId: string): string {
    const socket = this.sessions.get(instanceId);
    if (!socket) return 'close';
    if (socket.user) return 'open';
    return 'connecting';
  }

  static async disconnect(instanceId: string) {
    const socket = this.sessions.get(instanceId);
    if (socket) {
      try {
        socket.end();
      } catch (err) {}
      this.sessions.delete(instanceId);
      this.qrCodes.delete(instanceId);
    }
  }

  /**
   * Primary text & media message sender
   */
  static async sendMessage(
    instanceId: string,
    phone: string,
    content: string | { text?: string; mediaUrl?: string; mediaType?: string },
    options?: { mediaUrl?: string; mediaType?: string }
  ) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected. Please scan QR Code first in WhatsApp Accounts tab.');

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;

    const textContent = typeof content === 'string' ? content : content.text || '';
    const mediaUrl = typeof content === 'object' ? content.mediaUrl : options?.mediaUrl;

    if (mediaUrl) {
      let localFilePath = '';
      if (mediaUrl.includes('/uploads/')) {
        const relative = mediaUrl.substring(mediaUrl.indexOf('/uploads/'));
        localFilePath = path.join(process.cwd(), relative);
      } else if (fs.existsSync(mediaUrl)) {
        localFilePath = mediaUrl;
      }

      const lower = mediaUrl.toLowerCase();
      if (lower.match(/\.(jpg|jpeg|png|webp|gif)/) || options?.mediaType === 'image') {
        const imagePayload = localFilePath && fs.existsSync(localFilePath)
          ? fs.readFileSync(localFilePath)
          : { url: mediaUrl };
        return await socket.sendMessage(jid, { image: imagePayload, caption: textContent });
      } else if (lower.match(/\.(mp4|mov|avi|mkv)/) || options?.mediaType === 'video') {
        const videoPayload = localFilePath && fs.existsSync(localFilePath)
          ? fs.readFileSync(localFilePath)
          : { url: mediaUrl };
        return await socket.sendMessage(jid, { video: videoPayload, caption: textContent });
      } else if (lower.match(/\.(pdf|doc|docx|xls|xlsx|txt)/) || options?.mediaType === 'document') {
        const docPayload = localFilePath && fs.existsSync(localFilePath)
          ? fs.readFileSync(localFilePath)
          : { url: mediaUrl };
        const fileName = path.basename(mediaUrl);
        return await socket.sendMessage(jid, { document: docPayload, fileName, caption: textContent });
      }
    }

    return await socket.sendMessage(jid, { text: textContent });
  }

  /**
   * Phase C: Interactive Quick Reply & CTA Buttons Sender
   */
  static async sendButtons(instanceId: string, phone: string, data: { text: string; buttons: ButtonItem[]; footer?: string }) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance not connected.');

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;

    const buttonMessage: any = {
      text: data.text,
      footer: data.footer || 'Powered by VOXORA',
      buttons: data.buttons.map((b, idx) => ({
        buttonId: b.id || `btn_${idx + 1}`,
        buttonText: { displayText: b.text },
        type: 1,
      })),
      headerType: 1,
    };

    return await socket.sendMessage(jid, buttonMessage);
  }

  /**
   * Phase C: Interactive List Menu Sender
   */
  static async sendList(instanceId: string, phone: string, data: { title: string; text: string; buttonText?: string; sections: ListSection[]; footer?: string }) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance not connected.');

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;

    const listMessage: any = {
      text: data.text,
      title: data.title,
      buttonText: data.buttonText || 'Select Option',
      footer: data.footer || 'VOXORA Interactive',
      sections: data.sections,
    };

    return await socket.sendMessage(jid, listMessage);
  }

  /**
   * Phase C: Interactive Buttons with Automatic Graceful Fallback Engine
   */
  static async sendWithFallback(
    instanceId: string,
    phone: string,
    payload: {
      text: string;
      mediaUrl?: string;
      buttons?: ButtonItem[];
      listMenu?: { title: string; text: string; sections: ListSection[] };
      carouselCards?: CarouselCard[];
    }
  ) {
    const { text, mediaUrl, buttons, listMenu, carouselCards } = payload;

    // 1. If buttons exist, attempt native button dispatch first
    if (buttons && buttons.length > 0) {
      try {
        return await this.sendButtons(instanceId, phone, { text, buttons });
      } catch (buttonErr: any) {
        logger.warn(`[Baileys Engine] Native button dispatch failed (${buttonErr.message}). Switching to Automatic Text Fallback.`);
        const fallbackText = messageFallbackEngine.buttonsToText(text, buttons);
        return await this.sendMessage(instanceId, phone, fallbackText, { mediaUrl });
      }
    }

    // 2. If list menu exists, attempt native list dispatch first
    if (listMenu) {
      try {
        return await this.sendList(instanceId, phone, listMenu);
      } catch (listErr: any) {
        logger.warn(`[Baileys Engine] Native list menu dispatch failed (${listErr.message}). Switching to Automatic Text Fallback.`);
        const fallbackText = messageFallbackEngine.listToText(listMenu);
        return await this.sendMessage(instanceId, phone, fallbackText, { mediaUrl });
      }
    }

    // 3. If carousel cards exist, format as multi-section fallback
    if (carouselCards && carouselCards.length > 0) {
      const fallbackText = messageFallbackEngine.carouselToText(text, carouselCards);
      return await this.sendMessage(instanceId, phone, fallbackText, { mediaUrl });
    }

    // 4. Default plain text / media dispatch
    return await this.sendMessage(instanceId, phone, text, { mediaUrl });
  }

  static async checkOnWhatsApp(instanceId: string, phone: string): Promise<boolean> {
    const socket = this.getSession(instanceId);
    if (!socket) return false;
    try {
      const cleanNumber = phone.replace(/[^0-9]/g, '');
      const jid = `${cleanNumber}@s.whatsapp.net`;
      const [result] = await socket.onWhatsApp(jid);
      return !!result?.exists;
    } catch (err) {
      return false;
    }
  }

  /**
   * Auto-reconnect all active instances with saved credentials on server boot
   */
  static async autoReconnectSavedSessions() {
    try {
      const sessionsDir = path.join(process.cwd(), 'uploads', 'sessions');
      if (!fs.existsSync(sessionsDir)) return;

      const activeInstances = await Instance.find({ status: { $in: ['open', 'qr', 'connecting'] } });
      const folderNames = fs.readdirSync(sessionsDir);

      logger.info(`[Baileys Engine] Auto-reconnecting ${activeInstances.length} WhatsApp accounts...`);

      for (const inst of activeInstances) {
        if (folderNames.includes(inst.instanceId)) {
          logger.info(`[Baileys Engine] Re-hydrating saved session for: ${inst.name} (${inst.instanceId})`);
          this.initSession(inst.instanceId).catch((err) => {
            logger.warn(`[Baileys Engine] Re-hydration warning for ${inst.instanceId}: ${err.message}`);
          });
        }
      }
    } catch (err: any) {
      logger.error(`[Baileys Engine] Auto-reconnect error: ${err.message}`);
    }
  }
}
