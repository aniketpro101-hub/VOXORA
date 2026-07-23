import { Contact, IContact } from '../models/Contact.js';
import { logger } from '../utils/logger.js';

export type LeadCategory = 'cold' | 'warm' | 'hot' | 'vip';

export class LeadScoringEngine {
  /**
   * 1. Real-time lead score adjustment based on engagement events
   */
  static async updateScoreOnEvent(contactId: string, event: string, pointsDelta: number) {
    try {
      const contact = await Contact.findById(contactId);
      if (!contact) return;

      const newScore = Math.max(0, Math.min(100, (contact.engagementScore || 0) + pointsDelta));
      contact.engagementScore = newScore;
      contact.lastActivity = new Date();
      await contact.save();

      logger.info(`[LeadScoring] Contact ${contactId} score updated to ${newScore} (${event})`);
      return newScore;
    } catch (e: any) {
      logger.warn(`[LeadScoring] Error updating score: ${e.message}`);
    }
  }

  /**
   * 2. Classifies lead into Cold, Warm, Hot, or VIP tier based on score
   */
  static classifyLead(score: number): { tier: LeadCategory; badge: string; label: string } {
    if (score >= 76) return { tier: 'vip', badge: '⭐', label: 'VIP Lead' };
    if (score >= 51) return { tier: 'hot', badge: '🔥', label: 'Hot Lead' };
    if (score >= 26) return { tier: 'warm', badge: '🌤️', label: 'Warm Lead' };
    return { tier: 'cold', badge: '❄️', label: 'Cold Lead' };
  }

  /**
   * 3. Recommends AI next action based on engagement score and recency
   */
  static suggestNextAction(score: number): string {
    if (score >= 76) return 'Assign to senior sales manager & schedule direct VIP call';
    if (score >= 51) return 'Send product demo link or closing offer discount';
    if (score >= 26) return 'Follow up with pricing sheet & customer testimonial video';
    return 'Include in automated re-engagement drip sequence';
  }
}
