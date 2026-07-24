# 🚀 VOXORA — Master Feature Roadmap & Anti-Ban Architecture

This document serves as the master backlog and blueprint for upcoming features, enhancements, and safety systems in **VOXORA Enterprise WhatsApp Automation Platform**.

---

## 🛡️ SECTION 1: ANTI-BAN ARCHITECTURE & ADVANCED NUMBER SAFETY

### 1.1 Human Mimicry & Behavior Simulation Engine
- [ ] **Dynamic Typing & Recording Simulation**: Simulate realistic `composing...` and `recording_audio...` status indicators for variable durations calculated from message text length before sending.
- [ ] **Organic Gaussian Delay Jitter**: Implement Gaussian (normal distribution) delay intervals rather than simple linear ranges (e.g. 15s–45s with natural bell-curve clustering around ~28s).
- [ ] **Natural Reading & Pause Delays**: Inject simulated "reading" pauses (1–3 minutes) after every batch of 10–25 messages to mimic genuine human interaction patterns.
- [ ] **Natural Work-Hour Restraints**: Automatically restrict bulk dispatches to configured business hours (e.g. 9:00 AM – 9:00 PM local time), pausing campaigns outside active hours.

### 1.2 Multi-Number Rotation & SIM Load Balancing
- [ ] **Multi-SIM Round-Robin & Priority Score Engine**: Intelligently score and pick instances based on health score (0-100%), remaining daily quota, success rate, and age priority.
- [ ] **Dynamic Reputation Load Balancing**: Automatically route heavy campaign volume to older high-reputation SIMs while restricting new SIMs to safe low-volume limits.
- [ ] **Automated Instance Failover & Rest Period**: Automatically trigger a 1-hour rest period for any instance exhibiting 5+ consecutive transmission errors, failing over to standby instances.

### 1.3 Account Age Classification & Warmup Engine
- [ ] **Account Age Onboarding Modal (Post-QR Scan)**: Interactive UI modal presented upon QR connection asking user to select or enter exact account age (`New <7d`, `Young 1-2w`, `Growing 2-4w`, `Established 1-3m`, `Mature 3-6m`, `Veteran 6m+`).
- [ ] **Dynamic Age-Based Quotas & Delays**:
  - `New (<7d)`: Max 20 msgs/day, 30–90s delay.
  - `Young (1-2w)`: Max 50 msgs/day, 25–75s delay.
  - `Growing (2-4w)`: Max 100 msgs/day, 20–60s delay.
  - `Established (1-3m)`: Max 200 msgs/day, 15–45s delay.
  - `Mature (3-6m)`: Max 300 msgs/day, 12–40s delay.
  - `Veteran (6m+)`: Max 500+ msgs/day, 10–30s delay.
- [ ] **Automated Daily Age Escalation Cron**: Automatically age accounts by +1 day every 24 hours, automatically upgrading tier limits as accounts mature.
- [ ] **Peer-to-Peer Warmup Network**: Automated internal peer messaging between connected system numbers to build bi-directional conversation history.

### 1.4 Smart Spintax & Message Variation System
- [ ] **Multi-Level Spintax Engine**: Support nested syntax like `{Hello|Hi|Greetings} {name}, {check out|explore|view} our {offers|deals|catalog}` to ensure no two sent messages are identical.
- [ ] **Invisible Zero-Width Character Injection**: Inject randomized, invisible zero-width unicode spaces (`\u200B`, `\u200C`) into text payloads to break automated string hashing by spam filters.
- [ ] **Dynamic Variable Interpolation**: Enforce rich per-contact dynamic fields (`{name}`, `{city}`, `{custom_field_1}`) so every message carries unique metadata.

### 1.5 Real-Time Risk Monitoring & Health Scoring
- [ ] **Ban-Risk Health Score (0–100%)**: Calculate real-time health scores for each WhatsApp instance based on delivery rates, read rates, block/report signals, and reply rates.
- [ ] **Automated Circuit Breaker & 463 Error Detection**: Instantly halt campaigns on an instance if error 463 is thrown or if the incoming report/block rate exceeds a configurable threshold (e.g. >2% block rate within 10 minutes).
- [ ] **Opt-Out & Unsubscribe Guard**: Auto-detect negative replies (`STOP`, `UNSUBSCRIBE`, `REMOVE`, `DON'T MSG`) and instantly add numbers to the Global Blacklist.
- [ ] **Pre-Flight WhatsApp Number Validation**: Filter and verify numbers on WhatsApp *before* initiating campaign dispatches to eliminate soft/hard bounce penalties.

### 1.6 Baileys Fork Upgrade & Native Button Architecture
- [ ] **Package Migration (`@whiskeysockets/baileys` → `@itsukichan/baileys`)**: Upgrade backend to use button-capable Baileys fork maintaining `<biz>` node payload manipulation.
- [ ] **Interactive Buttons Suite**: Enable Quick Reply, CTA URL (`cta_url`), CTA Call (`cta_call`), and Copy Code (`cta_copy`) buttons.
- [ ] **Carousel Cards & Native Flow**: Enable multi-card swipeable carousels with individual card CTA buttons.
- [ ] **Automatic Text & Link Fallback**: Implement automatic graceful degradation to clean formatted links if Meta updates button protocol on specific numbers.

---

## 📦 SECTION 2: FUTURE MODULE BACKLOG & EXPANSIONS

### 2.1 Bulk Message Sending Engine
- [ ] **Multi-format list import**: Support Excel (`.xlsx`), `.csv`, `.txt`, and direct Google Sheets sync.
- [ ] **Advanced queue management**: Live priority re-ordering, batch pausing, and emergency campaign abort.
- [ ] **Automatic DND and invalid contact filtering**: Skip unverified numbers automatically.

### 2.2 Rich Media & Interactive Messages
- [ ] **Native media support**: Send images (JPG, PNG, WEBP), PDFs, MP4 videos, and OGG/MP3 voice notes.
- [ ] **WhatsApp Interactive Buttons**: CTA (Call-to-Action) and Quick Reply button builders.
- [ ] **VCard sharing**: Bulk-send business contact cards.

### 2.3 Personalisation & Variable Engine
- [ ] **Personalized media captions**: Attach per-contact invoices and custom documents.
- [ ] **Automated event triggers**: Birthday & Anniversary auto-send from date columns.
- [ ] **Custom group labels**: Segment contacts for targeted broadcasts.

### 2.4 Campaign Scheduler & Drip Sequences
- [ ] **Multi-step Drip Sequences**: Automated follow-up messages on Day 1, Day 3, and Day 7 based on user engagement.
- [ ] **Pre-loaded Festival Calendar**: Automated holiday & festival auto-reminders (Diwali, Eid, Christmas, New Year).
- [ ] **Timezone-aware scheduling**: Auto-adjust dispatches to local target recipient time zones.

### 2.5 Auto-Reply Bot & Conversational AI
- [ ] **Keyword & regex-based auto-responder**: Instant automated replies (e.g., `PRICE` -> price list).
- [ ] **Interactive menu flows**: Numbered option replies (1 for Sales, 2 for Support).
- [ ] **Out-of-hours away messages**: Custom messaging outside active business hours.
- [ ] **AI-powered Chatbot integration**: Connect ChatGPT / Claude / Gemini for intelligent conversations.
- [ ] **Hot-Lead flagging**: Automatically flag leads with >= 3 replies for high-priority sales alerts.

### 2.6 Analytics, Reports & A/B Testing
- [ ] **Real-time analytics dashboard**: Live metrics for sent, delivered, read, failed, and replied messages.
- [ ] **Exportable reports**: One-click Excel & PDF export for executive sharing.
- [ ] **A/B testing suite**: Compare template versions against sample audiences to measure response rates.

### 2.7 Contact Management & CRM Sync
- [ ] **Smart deduplication**: Detect and merge duplicate contacts automatically.
- [ ] **Kanban CRM Pipeline**: Track deal stages (New, Contacted, Qualified, Closed).
- [ ] **Contact activity log**: Detailed per-contact message timeline.

### 2.8 Template Library & Multi-Language
- [ ] **25+ Industry Template Kits**: Pre-configured templates for Retail, Real Estate, Education, Healthcare, etc.
- [ ] **Multi-language support**: English, Hindi, Marathi, Gujarati, Tamil, Telugu.
- [ ] **Official WhatsApp Business API import**: Import approved templates for verified businesses.

---

## 📝 SECTION 3: NOTES & USER DISCUSSION IDEAS

*(Paste your notes, ideas, and custom requirements below as we discuss!)*

