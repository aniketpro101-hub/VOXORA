# 📊 VOXORA PHASE B: MULTI-ACCOUNT INTELLIGENCE & AGE TRACKING
DEVELOPER: Mr. Aniket Samant (Telegram: @actasiff)
PRIORITY: HIGH - Build after Phase A completion
PREREQUISITE: Phase A (Anti-Ban) must be complete and tested

---

## 🎯 PHASE B OVERVIEW

Build intelligent multi-account system with:

1. **Post-QR Scan Age Onboarding Modal**: Interactive modal asking "How old is this WhatsApp account?" (`New`, `Young`, `Growing`, `Established`, `Mature`, `Veteran`).
2. **Age Categories & Limits**:
   - `New (1-7 days)`: 20 msgs/day, 30-90s delays.
   - `Young (8-14 days)`: 50 msgs/day, 25-75s delays.
   - `Growing (15-30 days)`: 100 msgs/day, 20-60s delays.
   - `Established (1-3 months)`: 200 msgs/day, 15-45s delays.
   - `Mature (3-6 months)`: 300 msgs/day, 12-40s delays.
   - `Veteran (6+ months)`: 500 msgs/day, 10-30s delays.
3. **SmartLimitsService**: Calculate age categories, apply daily/hourly quotas, run daily aging cron.
4. **IntelligentDistributor**: Priority scoring algorithm to pick best instance based on health, capacity, success rate, and age priority.
5. **Super-Admin Manual Override**:
   - Manual age override toggle & exact days setter.
   - Custom limits override (daily/hourly limits & delay ranges).
   - "Verified Enterprise Number" checkbox (veteran tier limits).
   - Warning modal: `"⚠️ Manual override bypasses safety. Are you sure?"`
6. **Frontend Dashboard Widgets**: Age badges, daily usage progress bars, success rate indicators.
7. **Automated Daily Age Cron**: Auto-increment account age +1 day every 24 hours at 00:00.
