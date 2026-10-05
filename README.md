# RailMitra AI — Mumbai Local Railway

> AI-powered Mumbai Local Railway web app covering Central, Western & Harbour lines.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript + Prisma |
| Database | PostgreSQL (Docker) |
| Cache | Redis (Docker) |
| Real-time | Socket.IO |
| AI | Google Gemini API |

## Quick Start

### 1. Start the database (Docker required)
```bash
docker compose up -d
```

### 2. Set up environment variables
```bash
cp .env.example server/.env
# Edit GEMINI_API_KEY in server/.env
```

### 3. Run Prisma migrations
```bash
npm run prisma:migrate
```

### 4. Start the backend
```bash
cd server && npm run dev
```


### 5. Start the frontend
```bash
cd client && npm run dev
```

Open http://localhost:5173

## Health Check
```
GET http://localhost:5000/api/health
```

## Build Phases

- [x] Phase 1 — Project Setup
- [ ] Phase 2 — UI Foundation
- [ ] Phase 3 — Authentication
- [ ] Phase 4 — Railway Data
- [ ] Phase 5 — Train Search
- [ ] Phase 6 — AI Journey Planner
- [ ] Phase 7 — Live Train Tracking
- [ ] Phase 8 — Crowd Prediction
- [ ] Phase 9 — Delay Prediction
- [ ] Phase 10 — Ticket System
- [ ] Phase 11 — Pass System
- [ ] Phase 12 — Platform Ticket
- [ ] Phase 13 — AI Assistant
- [ ] Phase 14 — Smart Notifications
- [ ] Phase 15 — Safety
- [ ] Phase 16 — Passenger Reports
- [ ] Phase 17 — User Dashboard
- [ ] Phase 18 — Admin Dashboard
- [ ] Phase 19 — Advanced AI
- [ ] Phase 20 — Security
- [ ] Phase 21 — Testing
