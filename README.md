# InquiryDesk — Customer Inquiry Management System

Full-stack technical assessment implementation using **React + Vite**, **Node.js + Express**, and **PostgreSQL**.

## Features
- Staff login with seeded local demo accounts, hashed passwords, signed httpOnly session cookie.
- Backend-enforced ownership: staff only see/update their own inquiries.
- Create an inquiry with frontend and backend validation.
- List, search (customer, contact, subject) and filter inquiries by status.
- View an inquiry and move it **New → In Progress → Resolved**; resolved is final.
- Reliable API errors and optimistic-concurrency checks: two stale tabs cannot silently overwrite status.
- Loading, empty, success, error, and invalid-input states.

## Requirements
Node.js 20+; npm; PostgreSQL 14+ (and `psql` or pgAdmin).

## 1. Create database
In PostgreSQL, create an empty database called `customer_inquiries`. From the repo root run:

```bash
psql -U postgres -d customer_inquiries -f backend/sql/schema.sql
```

Alternatively use pgAdmin Query Tool to run `backend/sql/schema.sql` against that database.

## 2. Start backend
```bash
cd backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# Edit .env: DATABASE_URL and JWT_SECRET (min 32 random characters)
npm install
npm run db:seed
npm run dev
```
Server: http://localhost:4000. **Do not commit `.env` files**.

## 3. Start frontend (second terminal)
```bash
cd frontend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```
Open http://localhost:5173.

## Seeded test accounts
| Name | Email | Password |
|---|---|---|
| Asha Staff | asha@demo.local | DemoPass123! |
| Ravi Staff | ravi@demo.local | DemoPass123! |

These are development-only credentials, not intended for production.

## Tests
```bash
cd backend && npm test
cd ../frontend && npm test
```
Backend tests cover the status workflow, validation, and malformed identifiers. Frontend test covers empty form validation. Additional end-to-end/database integration tests would be beneficial.

## API
| Method | Route | Result |
|---|---|---|
| POST | `/api/auth/login` | Authenticate, set httpOnly cookie |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user |
| GET | `/api/inquiries?search=&status=` | Own inquiries, newest first, max 200 |
| POST | `/api/inquiries` | Create inquiry |
| GET | `/api/inquiries/:id` | View owned inquiry |
| PATCH | `/api/inquiries/:id/status` | Transition status, requires version |

## Three assessment scenarios
1. **Invalid input:** Visit New inquiry and submit empty form. UI shows errors. The API independently returns 400 for missing/invalid fields.
2. **Stale tabs:** Open the same inquiry in two tabs. In tab A advance its status. In tab B attempt the same advancement. The backend compares the supplied `version` within a locked transaction and responds 409 instead of overwriting newer state. The UI refreshes the record automatically.
3. **Direct unauthorized link:** Log in as Asha, create an inquiry, copy its URL. Sign out and log in as Ravi. Paste the URL: backend returns 404, hiding even the existence of someone else's records.

## Demo video (3–5 min) outline
- 0:00–0:30 tech stack and log in.
- 0:30–1:30 create a valid inquiry; search/filter and view it.
- 1:30–2:10 advance New → In Progress → Resolved.
- 2:10–2:45 demonstrate invalid form and backend policy.
- 2:45–3:40 demonstrate unauthorized access and explain stale-tab protection.
- 3:40–4:30 show code organization, tests, and an engineering decision.

## Project organization
```
backend/src/        Express app, policies, PostgreSQL connection, seed
backend/sql/        PostgreSQL schema
backend/tests/      Backend tests
frontend/src/       React app, reusable form, API client, styles
frontend/src/test/  Frontend test setup
DECISIONS.md        Design decisions/trade-offs/AI disclosure
```

## Limitations
No customer-facing accounts, email, payments, production deployment, pagination, or real-time collaboration. Search is scoped to 200 most recent results. Session cookies are configured for same-site development; a cross-site production deployment requires appropriate cookie/CSRF protection and security review.
