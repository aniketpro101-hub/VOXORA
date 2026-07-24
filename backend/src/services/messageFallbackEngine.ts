import { logger } from '../utils/logger.js';

export interface ButtonItem {
  id?: string;
  type?: 'reply' | 'url' | 'call' | 'copy';
  text: string;
  url?: string;
  phone?: string;
  code?: string;
}

export interface ListSection {
  title: string;
  rows: { id: string; title: string; description?: string }[];
}

export interface CarouselCard {
  title: string;
  body?: string;
  mediaUrl?: string;
  buttons?: ButtonItem[];
}

export class MessageFallbackEngine {
  /**
   * Converts interactive button payload into a clean, beautifully formatted text fallback.
   */
  buttonsToText(baseText: string, buttons: ButtonItem[]): string {
    if (!buttons || buttons.length === 0) return baseText;

    let formatted = (baseText || '').trim();
    formatted += '\n\n━━━━━━━━━━━━━━━━━━━━━\n';
    formatted += '👇 *Please choose from the options below:*\n\n';

    buttons.forEach((btn, index) => {
      const num = index + 1;
      const emoji = this.getButtonEmoji(btn.type);

      if (btn.type === 'url' || btn.url) {
        formatted += `*${num}.* ${emoji} *${btn.text}*\n   🔗 ${btn.url}\n\n`;
      } else if (btn.type === 'call' || btn.phone) {
        formatted += `*${num}.* ${emoji} *${btn.text}*\n   📞 ${btn.phone}\n\n`;
      } else if (btn.type === 'copy' || btn.code) {
        formatted += `*${num}.* 📋 *${btn.text}*\n   Code: \`${btn.code}\`\n\n`;
      } else {
        formatted += `*${num}.* ${emoji} *${btn.text}*\n\n`;
      }
    });

    formatted += '━━━━━━━━━━━━━━━━━━━━━\n';
    formatted += '_💡 Reply with the option number (e.g., "1") to respond_';

    return formatted;
  }

  /**
   * Converts interactive list menu payload into a clean formatted text menu fallback.
   */
  listToText(data: { title?: string; text?: string; footer?: string; sections: ListSection[] }): string {
    let formatted = (data.text || '').trim();
    formatted += '\n\n━━━━━━━━━━━━━━━━━━━━━\n';
    formatted += `📋 *${data.title || 'Interactive Menu'}:*\n\n`;

    let counter = 1;
    data.sections?.forEach((section) => {
      if (section.title) {
        formatted += `*${section.title}*\n─────────────\n`;
      }
      section.rows?.forEach((row) => {
        formatted += `*${counter}.* ${row.title}\n`;
        if (row.description) {
          formatted += `   _${row.description}_\n`;
        }
        counter++;
      });
      formatted += '\n';
    });

    formatted += '━━━━━━━━━━━━━━━━━━━━━\n';
    formatted += '_💡 Reply with option number (e.g., "1")_';

    return formatted;
  }

  /**
   * Converts carousel cards payload into a multi-section structured text fallback.
   */
  carouselToText(baseText: string, cards: CarouselCard[]): string {
    let formatted = (baseText || '').trim() + '\n\n';

    cards?.forEach((card, idx) => {
      formatted += `━━━━━ 🃏 *Card ${idx + 1}: ${card.title}* ━━━━━\n`;
      if (card.body) formatted += `${card.body}\n`;

      if (card.buttons && card.buttons.length > 0) {
        card.buttons.forEach((btn) => {
          if (btn.url) {
            formatted += `🔗 *${btn.text}*: ${btn.url}\n`;
          } else if (btn.phone) {
            formatted += `📞 *${btn.text}*: ${btn.phone}\n`;
          } else {
            formatted += `💬 *${btn.text}*\n`;
          }
        });
      }
      formatted += '\n';
    });

    formatted += '━━━━━━━━━━━━━━━━━━━━━\n';
    formatted += '_💡 Reply with card number to choose_';

    return formatted;
  }

  private getButtonEmoji(type?: string): string {
    switch (type) {
      case 'url':
        return '🌐';
      case 'call':
        return '📞';
      case 'copy':
        return '📋';
      default:
        return '💬';
    }
  }
}

export default new MessageFallbackEngine();
