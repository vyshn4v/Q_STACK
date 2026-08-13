# QStack Platform

A Stack Overflow-style developer knowledge-community platform featuring cached per-question AI answers, Pinecone-backed conversational AI chat, event-driven activity feeds, nightly reputation/badge calculations, and a 4-tier RBAC administration system.

---

## 📁 Repository Structure

```
Q_STACK/
├── .agents/skills/qstack-platform/  # Architecture & design specifications skill
├── .github/workflows/ci.yml         # Continuous Integration workflow
├── backend/                         # NestJS Backend (Raw SQL, PostgreSQL, Redis Streams)
│   ├── migrations/                  # Version-numbered raw SQL migrations & release notes
│   │   ├── 001_initial_schema.sql
│   │   └── 001_initial_schema.md
│   ├── src/
│   │   ├── config/                  # Validated environment configuration
│   │   ├── database/                # PostgreSQL Pool & Migrator Service (Raw SQL)
│   │   ├── redis/                   # Redis client & Redis Streams EventBus
│   │   ├── common/                  # Global decorators, filters, interceptors & enums
│   │   ├── modules/                 # Monolithic domain modules
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── client/                      # Main Community React + Vite Web App (Port 5173)
│   └── admin/                       # Administrative React + Vite Web App (Port 5174)
├── docker-compose.yml               # Local PostgreSQL 16 & Redis 7 services
├── .env.example                     # Root environment variable template
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` or `backend/.env`:
```bash
cp .env.example backend/.env
```

### 3. Start Backend API
```bash
cd backend
npm install
npm run start:dev
```
Backend will start at: `http://localhost:4000/api/v1`

### 4. Start Client Frontend
```bash
cd frontend/client
npm install
npm run dev
```
Client app will run at: `http://localhost:5173`

### 5. Start Admin Frontend
```bash
cd frontend/admin
npm install
npm run dev
```
Admin panel will run at: `http://localhost:5174`

---

## 📋 Technology Stack
- **Backend**: NestJS, TypeScript, PostgreSQL (Raw SQL with `pg.Pool`), Redis Streams EventBus, BullMQ.
- **AI & Vectors**: Google Gemini API, Pinecone Vector Database.
- **Frontend**: React 18, Vite, TypeScript, Vanilla CSS Design System.
- **Admin**: React 18, Vite, TypeScript (Dedicated administrative build).
