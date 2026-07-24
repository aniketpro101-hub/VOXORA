import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { Instance } from '../models/Instance.js';
import { MessageLog } from '../models/MessageLog.js';
import { Contact } from '../models/Contact.js';
import { WhatsAppGroup } from '../models/WhatsAppGroup.js';
import { WhatsAppStatus } from '../models/WhatsAppStatus.js';
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

      // Listen for incoming messages, button clicks, reactions, and presence
      socket.ev.on('messages.upsert', async (m) => {
        for (const msg of m.messages) {
          if (!msg.message || msg.key.fromMe) continue;
          const senderPhone = (msg.key.remoteJid || '').replace('@s.whatsapp.net', '');

          // Check if button click or list selection response
          const responseMsg = (msg.message.interactiveResponseMessage || msg.message.buttonsResponseMessage || msg.message.listResponseMessage) as any;
          if (responseMsg) {
            const buttonId = responseMsg.nativeFlowResponseMessage?.paramsJson
              ? JSON.parse(responseMsg.nativeFlowResponseMessage.paramsJson).id
              : responseMsg.selectedButtonId || responseMsg.singleSelectReply?.selectedRowId;

            const buttonText = responseMsg.selectedButtonId || responseMsg.singleSelectReply?.selectedRowId || 'Clicked Option';

            logger.info(`[Baileys Event] Received button click/selection from +${senderPhone}: ${buttonId}`);

            await MessageLog.findOneAndUpdate(
              { instanceId, recipientPhone: senderPhone },
              {
                $push: {
                  buttonClicks: {
                    buttonId: buttonId || 'btn_click',
                    buttonText: buttonText,
                    buttonType: 'interactive',
                    clickedAt: new Date(),
                  },
                },
              },
              { sort: { createdAt: -1 } }
            );

            // Auto-blacklist if button clicked is an unsubscribe / opt-out button
            try {
              const { BlacklistEngine } = await import('./blacklistService.js');
              const wasBanned = await BlacklistEngine.handleButtonClickForBan(
                senderPhone,
                buttonId || buttonText || '',
                instanceId
              );
              if (wasBanned) {
                logger.info(`[Baileys] Auto-blacklisted +${senderPhone} for clicking "${buttonId}"`);
                emitInstanceEvent('contact:unsubscribed', {
                  phone: senderPhone,
                  instanceId,
                  buttonId,
                  timestamp: new Date(),
                });
              }
            } catch (banErr: any) {
              logger.error(`[Baileys] Failed to process button click blacklist: ${banErr.message}`);
            }
          }

          // Check reaction message
          if (msg.message.reactionMessage) {
            const emoji = msg.message.reactionMessage.text;
            const targetMessageId = msg.message.reactionMessage.key?.id;

            logger.info(`[Baileys Event] Received reaction ${emoji} from +${senderPhone}`);

            if (targetMessageId) {
              await MessageLog.findOneAndUpdate(
                { _id: targetMessageId },
                {
                  $push: {
                    reactions: {
                      emoji: emoji || '👍',
                      reactedBy: senderPhone,
                      reactedAt: new Date(),
                    },
                  },
                }
              );
            }
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
   * FEATURE 1 & 2: Send OTP with Copy Code Native Flow Button (UNIQUE FEATURE)
   */
  static async sendOTP(
    instanceId: string,
    phone: string,
    data: {
      otp: string;
      header?: string;
      body?: string;
      footer?: string;
      buttonText?: string;
      isAutoGenerated?: boolean;
      template?: string;
    }
  ) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected.');

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;

    const otpMessage: any = {
      interactiveMessage: {
        header: {
          title: data.header || '🔐 Verification Code',
          hasMediaAttachment: false,
        },
        body: {
          text: data.body || `Your OTP verification code is:\n\n*${data.otp}*\n\nTap the button below to copy the code to your clipboard.`,
        },
        footer: {
          text: data.footer || '⏱️ Valid for 5 minutes • Powered by VOXORA',
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: data.buttonText || `Copy ${data.otp}`,
                copy_code: data.otp,
              }),
            },
          ],
          messageParamsJson: '',
        },
      },
    };

    try {
      const res = await socket.sendMessage(jid, { viewOnce: true, ...otpMessage });

      // Log OTP dispatch in database
      await MessageLog.create({
        instanceId,
        recipientPhone: cleanNumber,
        messageType: 'otp',
        content: { otp: data.otp, template: data.template || 'login' },
        status: 'delivered',
        hasButtons: true,
        sentAt: new Date(),
        deliveredAt: new Date(),
        otpData: {
          code: data.otp,
          isAutoGenerated: !!data.isAutoGenerated,
          template: data.template || 'login',
          isCopied: false,
        },
      });

      logger.info(`[Baileys Engine] OTP ${data.otp} with Copy button sent successfully to +${cleanNumber}`);
      return { success: true, messageId: res.key?.id };
    } catch (err: any) {
      logger.warn(`[Baileys Engine] Native OTP button failed (${err.message}). Using Text Fallback.`);
      const fallbackText = `🔐 *${data.header || 'Verification Code'}*\n\nYour OTP code is: *${data.otp}*\n\n_Copy and enter code to verify._\n\n${data.footer || ''}`;
      const res = await this.sendMessage(instanceId, phone, fallbackText);
      return { success: true, fallbackUsed: true, messageId: res.key?.id };
    }
  }

  /**
   * FEATURE 3: Send Multi-Card Carousel Showcase Messages
   */
  static async sendCarousel(
    instanceId: string,
    phone: string,
    data: {
      text: string;
      cards: Array<{
        image?: string;
        title: string;
        body?: string;
        footer?: string;
        buttons: ButtonItem[];
      }>;
    }
  ) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance not connected.');

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;

    try {
      const carouselCards = data.cards.map((card) => {
        const cardButtons = card.buttons.map((btn, idx) => {
          const params: any = { display_text: btn.text };
          let name = 'quick_reply';

          if (btn.type === 'url' || btn.url) {
            name = 'cta_url';
            params.url = btn.url;
          } else if (btn.type === 'call' || btn.phone) {
            name = 'cta_call';
            params.phone_number = btn.phone;
          } else {
            params.id = btn.id || `btn_${idx + 1}`;
          }

          return { name, buttonParamsJson: JSON.stringify(params) };
        });

        const cardMsg: any = {
          body: { text: card.title + (card.body ? '\n\n' + card.body : '') },
          footer: card.footer ? { text: card.footer } : undefined,
          nativeFlowMessage: { buttons: cardButtons },
        };

        if (card.image) {
          cardMsg.header = { hasMediaAttachment: true, imageMessage: { url: card.image } };
        }

        return cardMsg;
      });

      const message = {
        interactiveMessage: {
          body: { text: data.text },
          carouselMessage: { cards: carouselCards },
        },
      };

      const res = await socket.sendMessage(jid, { viewOnce: true, ...message });
      return { success: true, messageId: res.key?.id };
    } catch (err: any) {
      logger.warn(`[Baileys Engine] Native carousel failed (${err.message}). Using Text Fallback.`);
      const fallbackText = messageFallbackEngine.carouselToText(data.text, data.cards as any);
      const res = await this.sendMessage(instanceId, phone, fallbackText);
      return { success: true, fallbackUsed: true, messageId: res.key?.id };
    }
  }

  /**
   * FEATURE 5: Group Grabber Engine - Fetch All Groups
   */
  static async getAllGroups(instanceId: string) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected.');

    try {
      const groupsMap = await socket.groupFetchAllParticipating();
      const groups = Object.values(groupsMap).map((g: any) => ({
        groupJid: g.id,
        name: g.subject || 'Unnamed Group',
        description: g.desc || '',
        memberCount: g.participants?.length || 0,
        isAdmin: g.participants?.some((p: any) => p.id === socket.user?.id && (p.admin === 'admin' || p.admin === 'superadmin')),
        creationDate: g.creation ? new Date(g.creation * 1000) : new Date(),
        creator: g.owner || '',
      }));

      // Cache in database
      for (const g of groups) {
        await WhatsAppGroup.findOneAndUpdate(
          { instanceId, groupJid: g.groupJid },
          { ...g, instanceId, lastSyncedAt: new Date() },
          { upsert: true }
        );
      }

      return groups;
    } catch (err: any) {
      logger.error(`[Group Grabber] Error fetching groups: ${err.message}`);
      throw err;
    }
  }

  /**
   * FEATURE 5: Group Grabber Engine - Extract Members of a Specific Group
   */
  static async getGroupMembers(instanceId: string, groupJid: string) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected.');

    try {
      const metadata = await socket.groupMetadata(groupJid);
      const members = metadata.participants.map((p: any) => {
        const phone = p.id.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
        return {
          phone,
          jid: p.id,
          name: `Member +${phone.slice(-4)}`,
          isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
          isSuperAdmin: p.admin === 'superadmin',
          joinedAt: new Date(),
        };
      });

      await WhatsAppGroup.findOneAndUpdate(
        { instanceId, groupJid },
        {
          name: metadata.subject,
          description: metadata.desc || '',
          memberCount: members.length,
          members,
          lastSyncedAt: new Date(),
        },
        { upsert: true }
      );

      return {
        groupJid,
        groupName: metadata.subject,
        memberCount: members.length,
        members,
      };
    } catch (err: any) {
      logger.error(`[Group Grabber] Error extracting group members: ${err.message}`);
      throw err;
    }
  }

  /**
   * FEATURE 5: Sync Extracted Group Members into Contacts Database
   */
  static async syncGroupToContacts(
    instanceId: string,
    groupJid: string,
    options?: { tagName?: string; onlyAdmins?: boolean }
  ) {
    const extracted = await this.getGroupMembers(instanceId, groupJid);
    let members = extracted.members;

    if (options?.onlyAdmins) {
      members = members.filter((m: { phone: string; isAdmin: boolean }) => m.isAdmin);
    }

    const tagName = options?.tagName || `group-${extracted.groupName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

    let newContactsCount = 0;
    let existingContactsCount = 0;

    for (const m of members) {
      const existing = await Contact.findOne({ phone: m.phone });
      if (existing) {
        existingContactsCount++;
        if (!existing.tags.includes(tagName)) {
          existing.tags.push(tagName);
          await existing.save();
        }
      } else {
        newContactsCount++;
        await Contact.create({
          phone: m.phone,
          name: m.name,
          source: 'group_grabber',
          sourceDetails: extracted.groupName,
          tags: [tagName, 'group-grabbed'],
          isOnWhatsApp: true,
          whatsappStatus: 'verified_on_whatsapp',
        });
      }
    }

    logger.info(`[Group Grabber] Synced ${members.length} members from "${extracted.groupName}" to contacts (${newContactsCount} new, ${existingContactsCount} updated).`);

    return {
      groupName: extracted.groupName,
      totalMembers: members.length,
      newContacts: newContactsCount,
      updatedContacts: existingContactsCount,
      tagName,
    };
  }

  /**
   * FEATURE 6: WhatsApp Status / Story Posting (Text Status)
   */
  static async postTextStatus(instanceId: string, data: { text: string; backgroundColor?: string; font?: number }) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected.');

    try {
      const res = await socket.sendMessage('status@broadcast', {
        text: data.text,
        backgroundColor: data.backgroundColor || '#25D366',
        font: data.font || 0,
      });

      await WhatsAppStatus.create({
        instanceId,
        type: 'text',
        content: data.text,
        backgroundColor: data.backgroundColor || '#25D366',
        font: data.font || 0,
        postedAt: new Date(),
        status: 'posted',
      });

      logger.info(`[WhatsApp Status] Text status posted for instance ${instanceId}`);
      return { success: true, statusId: res.key?.id };
    } catch (err: any) {
      logger.error(`[WhatsApp Status] Error posting text status: ${err.message}`);
      throw err;
    }
  }

  /**
   * FEATURE 6: WhatsApp Status / Story Posting (Media Status)
   */
  static async postImageStatus(instanceId: string, data: { mediaUrl: string; caption?: string }) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected.');

    try {
      const res = await socket.sendMessage('status@broadcast', {
        image: { url: data.mediaUrl },
        caption: data.caption || '',
      });

      await WhatsAppStatus.create({
        instanceId,
        type: 'image',
        content: data.caption || '',
        mediaUrl: data.mediaUrl,
        postedAt: new Date(),
        status: 'posted',
      });

      logger.info(`[WhatsApp Status] Media status posted for instance ${instanceId}`);
      return { success: true, statusId: res.key?.id };
    } catch (err: any) {
      logger.error(`[WhatsApp Status] Error posting media status: ${err.message}`);
      throw err;
    }
  }

  /**
   * FEATURE 10: Send Emoji Reactions to Messages
   */
  static async sendReaction(instanceId: string, phone: string, messageId: string, emoji: string) {
    const socket = this.getSession(instanceId);
    if (!socket) throw new Error('WhatsApp instance is not connected.');

    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;

    try {
      await socket.sendMessage(jid, {
        react: {
          text: emoji,
          key: { remoteJid: jid, id: messageId, fromMe: true },
        },
      });
      return { success: true };
    } catch (err: any) {
      logger.error(`[Baileys Engine] Send reaction failed: ${err.message}`);
      throw err;
    }
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
