# ShipProcure — AI-Powered B2B Procurement Platform

A full-stack procurement tool that uses Claude AI to find vendors worldwide, verify their contact emails, send RFQs, capture quotes, and issue formal tenders.

## Features

- **AI Vendor Discovery** — Claude + SerpAPI find vendors globally or in specific regions
- **Email Verification** — 4-layer pipeline: format → MX record → domain match → Hunter.io
- **RFQ Engine** — Send branded RFQ emails to one or all vendors via SendGrid
- **Quote Capture** — Vendor email replies parsed by Claude into structured quote data
- **Quote Comparison** — Side-by-side table with lowest price and fastest lead time highlights
- **Tender Issuance** — Formal tender document generated and emailed to approved vendor
- **Multi-tenant Auth** — Company accounts with JWT (15m access + 7d refresh)
- **Real-time Search Progress** — SSE stream shows search pipeline stages live
- **Advanced Animations** — Framer Motion stagger animations, spring transitions, shared layout

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Framer Motion + TailwindCSS |
| State | Zustand + TanStack Query |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| AI | Claude API (claude-sonnet-4-6) |
| Search | SerpAPI + Brave Search (fallback) |
| Email Out | SendGrid |
| Email In | SendGrid Inbound Parse |
| Ratings | Google Places API |
| Email Verify | DNS MX + Hunter.io |
| Auth | JWT |

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis)

### 2. Start databases

```bash
docker-compose up -d
```

### 3. Backend setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit http://localhost:5173

## Environment Variables

### Backend (`backend/.env`)

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shipping_procurement
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<random-32-char-hex>
JWT_REFRESH_SECRET=<random-32-char-hex>
ANTHROPIC_API_KEY=sk-ant-...
SERPAPI_KEY=<your-serpapi-key>
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourplatform.com
SENDGRID_INBOUND_PARSE_HOST=inbound.yourplatform.com

# Optional
GOOGLE_PLACES_API_KEY=<key>
HUNTER_API_KEY=<key>
ENCRYPTION_KEY=<32-char-hex>
AWS_S3_BUCKET=<bucket>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<key>
```

## Architecture

```
Search Request
     │
     ▼
POST /api/search
  └── BullMQ job queued → returns sessionId immediately
        │
        ├── Claude: interpret query
        ├── SerpAPI: 3 targeted searches
        ├── Claude: extract + score vendors
        ├── Google Places: ratings
        ├── Email extraction (SerpAPI + Hunter.io)
        └── Email verification (format → MX → domain match → Hunter)

SSE /api/search/:id/stream
  └── Real-time progress: SEARCHING → ENRICHING → VERIFYING → COMPLETED

RFQ Send
  └── SendGrid with Reply-To: replies+rfq_{id}_vendor_{id}@inbound.domain

Vendor Reply Email
  └── SendGrid Inbound Parse → POST /api/webhooks/sendgrid/inbound
        └── Claude extracts: price, lead time, terms, validity
```

## Email Verification Logic

```
Format invalid OR MX invalid     → INVALID (never auto-sent)
MX valid + domain mismatch       → RISKY (user override required)
MX valid + hunterScore < 50      → RISKY
MX valid + domain match          → VERIFIED ✓
MX valid + hunterScore >= 50     → VERIFIED ✓
```

## API Endpoints

| Module | Endpoint | Description |
|---|---|---|
| Auth | POST /api/auth/register | Create company + admin |
| Auth | POST /api/auth/login | Get JWT tokens |
| Search | POST /api/search | Start async vendor search |
| Search | GET /api/search/:id/stream | SSE progress stream |
| Vendors | GET /api/vendors/:id | Vendor details + emails |
| RFQ | POST /api/rfq | Create RFQ |
| RFQ | POST /api/rfq/:id/send | Send to vendors |
| Quotes | GET /api/rfq/:rfqId/quotes/compare | Comparison data |
| Quotes | PATCH /api/quotes/:id/status | Approve/reject |
| Tenders | POST /api/tenders | Create from quote |
| Tenders | POST /api/tenders/:id/issue | Send via email |
| Webhook | POST /api/webhooks/sendgrid/inbound | Vendor reply capture |

## Project Structure

```
shipping-procurement/
├── backend/
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, search, rfq, etc.)
│   │   ├── services/        # Shared services (Claude, SendGrid, etc.)
│   │   ├── middleware/       # Auth, error handling
│   │   └── app.ts           # Express app + worker startup
│   └── prisma/schema.prisma # Database schema
├── frontend/
│   └── src/
│       ├── pages/           # Route-level pages
│       ├── components/      # Reusable UI components
│       ├── store/           # Zustand state
│       └── utils/           # Formatters + Framer Motion variants
└── docker-compose.yml       # PostgreSQL + Redis
```
