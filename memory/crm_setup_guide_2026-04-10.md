# CRM Setup & Usage (Cosmo)

## Overview
This document describes how to install, migrate, and run the CRM frontend (`crm`) with the Cosmo server backend.

## Prerequisites
- Node.js 18+
- npm
- PostgreSQL (via `docker-compose.yml` in repo root or your own DB)

## 1. Install Dependencies
```bash
cd server
npm install
cd ..\crm
npm install
```

## 2. Configure Environment
### Server
Ensure `server/.env` contains:
- `DATABASE_URL=...`
- `JWT_SECRET=...`

You can start from `server/.env.example`.

### CRM
Create `.env` in `crm` from the example:
```bash
cd crm
copy .env.example .env
```
Edit `VITE_API_URL` if your server is not on `http://localhost:3000`.

## 3. Database Migration
```bash
cd server
npx prisma migrate dev --name crm_init
```

## 4. Run Services
### Start API server
```bash
cd server
npm run dev
```

### Start CRM frontend
```bash
cd crm
npm run dev
```

Open the CRM at `http://localhost:5174`.

## 5. First Login
- Use the **Register** tab to create the first account.
- Then sign in with the same credentials.

## API Endpoints (CRM)
All routes require JWT auth (Bearer token).

- `GET /crm/me`
- `GET /crm/overview`
- `GET /crm/accounts`
- `POST /crm/accounts`
- `PATCH /crm/accounts/:id`
- `DELETE /crm/accounts/:id`
- `GET /crm/leads`
- `POST /crm/leads`
- `PATCH /crm/leads/:id`
- `DELETE /crm/leads/:id`
- `GET /crm/deals`
- `POST /crm/deals`
- `PATCH /crm/deals/:id`
- `DELETE /crm/deals/:id`
- `GET /crm/activities`
- `POST /crm/activities`
- `PATCH /crm/activities/:id`
- `DELETE /crm/activities/:id`

## Notes
- CRM auth relies on existing `/auth/login`, `/auth/register`, `/auth/refresh`.
- `crm/.env` controls the backend URL.
- CORS is enabled on the server for the CRM frontend.
