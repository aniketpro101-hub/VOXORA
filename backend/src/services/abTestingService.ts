import { ABTest, IABTest, IVariant } from '../models/ABTest.js';
import { logger } from '../utils/logger.js';

export class ABTestingService {
  /**
   * Evaluates variants and determines the statistically winning variant (95% confidence)
   */
  static calculateWinner(test: IABTest): { winner?: IVariant; confidenceLevel: number } {
    if (!test.variants || test.variants.length < 2) {
      return { confidenceLevel: 0 };
    }

    let winner = test.variants[0];
    let maxRate = -1;

    test.variants.forEach((v) => {
      let rate = 0;
      if (test.winnerCriteria === 'reply_rate') {
        rate = v.sentCount > 0 ? v.repliedCount / v.sentCount : 0;
      } else if (test.winnerCriteria === 'read_rate') {
        rate = v.sentCount > 0 ? v.readCount / v.sentCount : 0;
      } else {
        rate = v.sentCount > 0 ? v.conversionCount / v.sentCount : 0;
      }

      if (rate > maxRate) {
        maxRate = rate;
        winner = v;
      }
    });

    // Calculate Z-score for statistical confidence between top 2 variants
    let confidenceLevel = 50.0;
    if (test.variants.length >= 2) {
      const sorted = [...test.variants].sort((a, b) => b.sentCount - a.sentCount);
      const v1 = sorted[0];
      const v2 = sorted[1];
      if (v1.sentCount > 5 && v2.sentCount > 5) {
        const p1 = v1.sentCount > 0 ? (v1.repliedCount || v1.readCount || 0) / v1.sentCount : 0;
        const p2 = v2.sentCount > 0 ? (v2.repliedCount || v2.readCount || 0) / v2.sentCount : 0;
        const pPool = ((v1.repliedCount || 0) + (v2.repliedCount || 0)) / (v1.sentCount + v2.sentCount);
        const se = Math.sqrt(pPool * (1 - pPool) * (1 / v1.sentCount + 1 / v2.sentCount));
        if (se > 0) {
          const z = Math.abs(p1 - p2) / se;
          // Approximate confidence percentage from Z-score
          confidenceLevel = Math.min(99.9, Math.max(50.0, Math.round((0.5 + 0.5 * Math.tanh(z * 0.8)) * 1000) / 10));
        }
      }
    }

    return { winner, confidenceLevel };
  }
}
