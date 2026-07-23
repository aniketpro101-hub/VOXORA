# VOXORA Phase 1 — Setup & Quickstart Guide

## 🛠️ Prerequisites

- Docker & Docker Compose
- Node.js 20+ & npm

---

## ⚡ Running with Docker (Recommended)

To start the entire stack (MongoDB, Redis, Evolution API, Backend, Frontend) with a single command:

```bash
cd docker
docker-compose up -d
```

### Accessing Services:
- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Healthcheck**: http://localhost:4000/api/system/health
- **Evolution API Gateway**: http://localhost:8080

---

## 💻 Local Development Setup

### 1. Start Backend:
```bash
cd backend
npm install
npm run dev
```

### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

First registered user on `/register` automatically receives `admin` role privileges.
