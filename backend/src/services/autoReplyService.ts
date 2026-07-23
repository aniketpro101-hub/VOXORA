import OpenAI from 'openai';
import { AutoReplyRule, IAutoReplyRule } from '../models/AutoReplyRule.js';
import { ConversationSession, IConversationSession } from '../models/ConversationSession.js';
import { ConversationFlow } from '../models/ConversationFlow.js';
import { AIConfig } from '../models/AIConfig.js';
import { BlacklistNumber } from '../models/BlacklistNumber.js';
import { MessageLog } from '../models/MessageLog.js';
import { MessageService } from './messageService.js';
import { AntibanEngine } from './antibanService.js';
import { SpintaxProcessor } from '../utils/spintax.js';
import { logger } from '../utils/logger.js';

export class AutoReplyService {
  /**
   * 1. Main entry point when webhook receives an incoming message
   */
  static async handleIncomingMessage(instanceName: string, payload: any) {
    try {
      const from = payload.from || payload.key?.remoteJid;
      if (!from || from.includes('@g.us')) return; // Ignore group messages

      const cleanPhone = from.replace(/[^0-9]/g, '');

      // Check Blacklist
      const isBlacklisted = await BlacklistNumber.exists({ phone: cleanPhone });
      if (isBlacklisted) {
        logger.info(`[AutoReply] Ignored message from blacklisted phone: ${cleanPhone}`);
        return;
      }

      const textMessage = (payload.body || payload.message?.conversation || payload.message?.extendedTextMessage?.text || '').trim();
      const buttonReplyId = payload.selectedButtonId || payload.message?.buttonsResponseMessage?.selectedButtonId;
      const listReplyId = payload.selectedRowId || payload.message?.listResponseMessage?.singleSelectReply?.selectedRowId;

      // Check Active Session
      let session = await ConversationSession.findOne({ phone: cleanPhone, status: 'active' });

      if (session) {
        session.history.push({ sender: 'user', content: textMessage || buttonReplyId || listReplyId || 'Media', timestamp: new Date() });
        session.lastInteractionAt = new Date();
        await session.save();

        if (session.status === 'handedOver') return; // Human agent in control
      }

      // Check Button or List Reply First
      if (buttonReplyId || listReplyId) {
        const rule = await AutoReplyRule.findOne({
          isActive: true,
          triggerType: buttonReplyId ? 'button_click' : 'list_select',
          keywords: buttonReplyId || listReplyId,
        }).sort({ priority: 1 });

        if (rule) {
          await this.executeRule(rule, { phone: cleanPhone }, instanceName, textMessage);
          return;
        }
      }

      // Handle Numeric Responses (1, 2, 3) from Button/List Fallback Text
      if (/^\d+$/.test(textMessage)) {
        const handled = await this.handleNumberReply(instanceName, cleanPhone, textMessage);
        if (handled) return;
      }

      // Match Keyword Auto-Reply Rules
      if (textMessage) {
        const activeRules = await AutoReplyRule.find({ isActive: true, triggerType: 'keyword' }).sort({ priority: 1 });

        for (const rule of activeRules) {
          const isMatch = this.matchKeywords(textMessage, rule.keywords, rule.matchType, rule.caseSensitive);
          const hasExclusion = rule.excludeKeywords.some((ex) => textMessage.toLowerCase().includes(ex.toLowerCase()));

          if (isMatch && !hasExclusion) {
            await this.executeRule(rule, { phone: cleanPhone }, instanceName, textMessage);
            return; // Highest priority rule executed
          }
        }
      }

      // AI Fallback if configured
      const aiConfig = await AIConfig.findOne({ isActive: true });
      if (aiConfig && aiConfig.apiKey && textMessage) {
        const aiResponse = await this.generateAIResponse(textMessage, session?.history || [], aiConfig);
        if (aiResponse) {
          await MessageService.sendTextMessage(instanceName, cleanPhone, aiResponse);
        }
      }
    } catch (error: any) {
      logger.warn(`[AutoReplyService] Error handling incoming message: ${error.message}`);
    }
  }

  /**
   * 2. Evaluates multi-type keyword matching algorithms
   */
  static matchKeywords(text: string, keywords: string[], matchType: string, caseSensitive = false): boolean {
    if (!keywords || keywords.length === 0) return false;

    const source = caseSensitive ? text : text.toLowerCase();

    return keywords.some((kw) => {
      const target = caseSensitive ? kw : kw.toLowerCase();
      if (matchType === 'exact') return source.trim() === target.trim();
      if (matchType === 'starts_with') return source.startsWith(target);
      if (matchType === 'ends_with') return source.endsWith(target);
      if (matchType === 'regex') {
        try {
          return new RegExp(target, caseSensitive ? '' : 'i').test(source);
        } catch (e) {
          return false;
        }
      }
      return source.includes(target);
    });
  }

  /**
   * 3. Executes matching rule and dispatches formatted reply
   */
  static async executeRule(rule: IAutoReplyRule, contact: { phone: string; name?: string }, instanceName: string, originalMessage: string) {
    // Check Business Hours if enabled
    if (rule.businessHoursOnly) {
      const isSleep = AntibanEngine.isSleepTime({ sleepModeEnabled: true, sleepStartHour: 22, sleepEndHour: 8 });
      if (isSleep) {
        logger.info(`[AutoReply] Rule ${rule.name} skipped: Outside business hours`);
        return;
      }
    }

    // Delay & Typing Simulation
    if (rule.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, rule.delayMs));
    }

    if (rule.typingSimulation) {
      await AntibanEngine.simulateTyping(instanceName, contact.phone, 50);
    }

    const compiledContent = SpintaxProcessor.compileMessage(
      typeof rule.replyContent === 'string' ? rule.replyContent : rule.replyContent?.text || 'Hello!',
      contact
    );

    try {
      if (rule.replyType === 'buttons' && rule.replyButtons && rule.replyButtons.length > 0) {
        await MessageService.sendButtonMessage(instanceName, contact.phone, {
          text: compiledContent,
          buttons: rule.replyButtons,
        });
      } else if (rule.replyType === 'media' && rule.replyMedia) {
        await MessageService.sendImageMessage(instanceName, contact.phone, rule.replyMedia.url, compiledContent);
      } else if (rule.replyType === 'list' && rule.replyList) {
        await MessageService.sendListMessage(instanceName, contact.phone, rule.replyList);
      } else {
        await MessageService.sendTextMessage(instanceName, contact.phone, compiledContent);
      }

      rule.executionCount += 1;
      rule.successCount += 1;
      rule.lastExecuted = new Date();
      await rule.save();
    } catch (e: any) {
      rule.failureCount += 1;
      await rule.save();
    }
  }

  /**
   * 4. Generates AI response using OpenAI ChatGPT API
   */
  static async generateAIResponse(userMessage: string, history: any[], aiConfig: any): Promise<string | null> {
    try {
      const openai = new OpenAI({ apiKey: aiConfig.apiKey });
      const messages: any[] = [{ role: 'system', content: aiConfig.systemPrompt || 'You are a customer support assistant.' }];

      history.slice(-5).forEach((h) => {
        messages.push({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.content });
      });

      messages.push({ role: 'user', content: userMessage });

      const completion = await openai.chat.completions.create({
        model: aiConfig.aiModel || aiConfig.model || 'gpt-4o-mini',
        messages,
        max_tokens: aiConfig.maxTokens || 200,
        temperature: aiConfig.temperature || 0.7,
      });

      return completion.choices[0]?.message?.content || null;
    } catch (e: any) {
      logger.warn(`[AutoReply] AI response generation failed: ${e.message}`);
      return null;
    }
  }

  /**
   * 5. Simple language detector (English / Hindi / Marathi)
   */
  static detectLanguage(text: string): 'english' | 'hindi' | 'marathi' {
    const devanagariRegex = /[\u0900-\u097F]/;
    if (devanagariRegex.test(text)) {
      if (text.includes('नमस्कार') || text.includes('आहे')) return 'marathi';
      return 'hindi';
    }
    return 'english';
  }

  /**
   * 6. Transitions session state to human agent takeover
   */
  static async sendHumanHandover(sessionId: string, agentId: string) {
    const session = await ConversationSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'handedOver';
    await session.save();

    logger.info(`[AutoReply] Conversation session ${sessionId} handed over to agent ${agentId}`);
    return session;
  }

  /**
   * 7. Smart handler for numeric replies (1, 2, 3) sent in response to button text fallbacks
   */
  static async handleNumberReply(instanceName: string, phone: string, textMessage: string): Promise<boolean> {
    try {
      const optionNum = parseInt(textMessage, 10);
      if (isNaN(optionNum) || optionNum <= 0) return false;

      // Find recent message log sent to this contact with buttons or list menu
      const recentLog = await MessageLog.findOne({
        recipientPhone: phone,
        $or: [{ hasButtons: true }, { hasListMenu: true }],
      }).sort({ createdAt: -1 });

      if (!recentLog) return false;

      if (recentLog.hasButtons && Array.isArray(recentLog.buttons)) {
        const button = recentLog.buttons[optionNum - 1];
        if (!button) {
          await MessageService.sendTextMessage(
            instanceName,
            phone,
            `❌ Invalid option "${textMessage}". Please reply with a number between 1 and ${recentLog.buttons.length}.`
          );
          return true;
        }

        const bText = button.text || button;
        if (button.type === 'url' && button.url) {
          await MessageService.sendTextMessage(instanceName, phone, `🌐 *${bText}*\n\nVisit: ${button.url}`);
        } else if (button.type === 'call' && button.phone) {
          await MessageService.sendTextMessage(instanceName, phone, `📞 *${bText}*\n\nCall Us: ${button.phone}`);
        } else {
          await MessageService.sendTextMessage(instanceName, phone, `✅ *Thank you for choosing option ${optionNum} (${bText})!*\n\nOur team has received your response and will assist you shortly.`);
        }
        return true;
      }
    } catch (err: any) {
      logger.warn(`[AutoReply] handleNumberReply failed: ${err.message}`);
    }
    return false;
  }
}
