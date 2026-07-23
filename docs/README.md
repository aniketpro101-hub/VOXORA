# VOXORA — Enterprise Bulk WhatsApp Automation & CRM Platform

**Lead Developer:** Mr. Aniket Samant (Telegram: [@actasiff](https://t.me/actasiff))  
**Software Version:** 1.0.0 (Phase 1 Infrastructure Complete)

---

## 🚀 Overview

VOXORA is a high-performance, enterprise-grade Bulk WhatsApp Automation and CRM Software. It features anti-ban humanized delay algorithms, multi-number rotation, automated keyword flow bots, SpinTax variation engines, lead scoring CRM, and comprehensive real-time transmission analytics.

---

## 🏗️ Monorepo Architecture

- **`backend/`**: Node.js 20+ Express server written in strict TypeScript.
  - **Models**: 11 Mongoose Schemas (`User`, `Instance`, `Contact`, `Campaign`, `MessageLog`, `BlacklistNumber`, `AutoReplyRule`, `Template`, `Team`, `ActivityLog`, `Settings`).
  - **Auth**: JWT Access & Refresh Token system with HTTP-only cookies and bcrypt hashing.
  - **Security**: Rate limiting, Helmet headers, Zod validation middleware.
- **`frontend/`**: Next.js 15 App Router application styled with Tailwind CSS, Shadcn UI, and Lucide icons.
  - **Pages**: `/login`, `/register`, `/dashboard`, `/about`, `/settings`, `404`, `error`.
  - **Theme**: Dark Mode & Light Mode support via `next-themes`.
- **`docker/`**: `docker-compose.yml` orchestrating MongoDB, Redis, Evolution API gateway, Backend, and Frontend.

---

## 👨‍💻 Developer & License Info

Developed by **Mr. Aniket Samant**.  
For support or custom feature inquiries, contact via Telegram: **[@actasiff](https://t.me/actasiff)**.
