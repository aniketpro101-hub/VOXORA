# 🛡️ VOXORA PHASE A: 10-PILLAR ANTI-BAN FOUNDATION
DEVELOPER: Mr. Aniket Samant (Telegram: @actasiff)
PRIORITY: URGENT - Foundation for enterprise-grade safety

---

## 🎯 PHASE A OVERVIEW

Build enterprise-grade Anti-Ban Engine with 10 pillars:

1. **Gaussian Delay Jitter** (Bell curve distribution)
2. **Zero-Width Character Injection** (Unique message hashes `\u200B`, `\u200C`)
3. **Typing/Recording Status Simulation** (2–8 seconds dynamic)
4. **Circadian Work-Hour Restraints** (9 AM – 9 PM local time)
5. **Number Warmup System** (7-day gradual volume increase)
6. **463 Error Circuit Breaker** (Auto-pause 1 hour on 463 warning)
7. **Reply Ratio Enforcement** (>10% engagement monitoring)
8. **Batch Break System** (Rest every 15–20 msgs)
9. **Multi-SIM Smart Rotation** (Health-based round robin)
10. **Consecutive Error & Failure Spike Monitoring**

---

## 📊 DATABASE UPDATES

UPDATE Instance model - Add fields:
- `antibanHealth`: `consecutiveErrors`, `last463Error`, `circuitBreakerActive`, `circuitBreakerUntil`, `totalMessagesToday`, `totalRepliesReceived`, `replyRatio`, `needsRest`, `restUntil`, `lastMessageAt`, `currentBatchCount`.
- `messageTiming`: `minDelay`, `maxDelay`, `avgDelay`, `useGaussianDistribution`, `batchSize`, `batchBreakMin`, `batchBreakMax`.
- `businessHours`: `enabled`, `startHour`, `endHour`, `timezone`.

---

## 🔧 ANTI-BAN SERVICE
File: `backend/src/services/antibanService.ts`
Implement methods:
- `calculateRandomDelay` / `calculateGaussianDelay`
- `injectZeroWidthChars`
- `simulateTyping`
- `isSleepTime` / `isWithinBusinessHours`
- `getWarmupLimit`
- `calculateBanRisk`
- `detectFailureSpike`
- `shouldTakeBreak` / `shouldTakeBatchBreak`
- `numberValidator` / `spamKeywordChecker`

---

## 🔧 CAMPAIGN DISPATCH INTEGRATION
File: `backend/src/services/campaignService.ts`
- Inject zero-width invisible characters into message text.
- Trigger typing indicator before dispatch.
- Apply Gaussian randomized delays between recipients.
- Check circadian work-hours and batch breaks.
