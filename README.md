# LAZ Platform

Multi-tenant ZISWAF (Zakat, Infak/Sedekah, dan Wakaf) donation management platform. Built as an NestJS 11 API backend paired with a Vite 7 + React 19 single-page frontend, backed by PostgreSQL via Prisma ORM.

---

# Product Overview

LAZ Platform is a web-based fundraising and social finance management platform that enables Islamic charitable organizations (LAZ), called **Lembaga**, to manage donation programs, collect donations, track fund distributions, and maintain audit trails.

The platform supports multiple organizations (multi-tenant architecture), role-based access control (RBAC), donation tracking, volunteer management, and operational reporting.

## Primary Actors

### SUPER_ADMIN
- Platform-wide access (`lembagaId: null`)
- Review, approve, or reject Lembaga (organization) registrations
- Manage roles and permissions across the platform

### LEMBAGA_ADMIN
- Manage donation programs for their own Lembaga
- Manage donations, payments, and distributions
- Review and verify Volunteer applications for their activities
- View operational and financial reports

> `SUPER_ADMIN` and `LEMBAGA_ADMIN` are the only two roles in the RBAC table. There is no `DONATUR`/`FINANCE`/`RELAWAN` role — donors and volunteers are separate principals, not `User`/RBAC accounts.

### Volunteer (Relawan)
- Self-service registration, a distinct principal from `User`/RBAC, authenticated via its own session
- Browses volunteer activities across all Lembaga and applies to them
- Submits activity reports; tracked through a review/verification lifecycle

### Donor (Donatur)
- No account, ever — always guest checkout
- Identified by phone number (required) at checkout
- Looks up donation history via phone number, cross-tenant, no login needed

---

# Feature Matrix

| Feature | Status |
|----------|----------|
| Authentication (session-based) | ✅ Complete |
| Authorization (RBAC) | ✅ Complete |
| Lembaga Onboarding & Approval | ✅ Complete |
| Program Management | ✅ Complete |
| Donation Management | ✅ Complete |
| Guest Donation Flow | ✅ Complete |
| Distribution Management | ✅ Complete |
| Volunteer Applications & Activities | ✅ Complete |
| Audit Logging | ✅ Complete |
| Dashboard Analytics | ✅ Complete |
| Responsive UI | ✅ Complete |
| File Uploads (Cloudinary) | ✅ Complete |
| Multi-Tenant Foundation | ✅ Complete |
| Payment Gateway (Xendit) | ⚠️ Partial (webhook wired, sandbox) |
| Notifications (Email/WA) | ⚠️ Planned |
| PDF/CSV Export | ⚠️ Planned |

---

# Tech Stack

## Backend (`backend/`)
- [NestJS 11](https://nestjs.com/) (Express adapter, `@nestjs/platform-express`)
- TypeScript
- Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`)
- PostgreSQL (via `pg`)
- `express-session` + `connect-pg-simple` (server-side sessions, Postgres-backed store)
- `csrf-csrf` (double-submit CSRF protection)
- `@nestjs/throttler` (rate limiting)
- `nestjs-pino` / `pino` (structured logging)
- `helmet` (security headers)
- `bcryptjs` (password hashing)
- `cloudinary` (file/image storage)
- Xendit (payment gateway, webhook-verified)
- `zod` (validation)
- `vitest` (testing)

## Frontend (`frontend/`)
- [Vite 7](https://vite.dev/) + React 19
- TypeScript
- React Router v7 (`createBrowserRouter`)
- TanStack React Query v5 (data fetching/caching)
- Tailwind CSS v4
- Zustand (client state)
- React Hook Form + Zod resolvers
- Recharts (dashboard charts)
- `motion` (animation)
- `lucide-react` (icons)

## Shared (`shared/`)
- Shared TypeScript types, Zod validation schemas, and RBAC/permission constants consumed by both backend and frontend.

## Database
- PostgreSQL, managed with Prisma migrations (`backend/prisma/schema.prisma`)

## Storage
- Cloudinary (logos, documents, receipts, avatars)

---

# Environment Variables

## Backend (`backend/.env`)

See `backend/.env.example`:

```env
NODE_ENV="development"
PORT=4000

# Database
DATABASE_URL="postgresql://<USER>@<HOST>:<PORT>/<DB_NAME>?schema=public"

# Session & CSRF secrets — REQUIRED, app crashes on boot if missing
SESSION_SECRET="<RANDOM_64_CHARS>"
CSRF_SECRET="<RANDOM_64_CHARS>"

# CORS allowlist (comma-separated origins) — Vite dev server by default
CORS_ORIGIN="http://localhost:5173"

# Xendit payment gateway credentials
XENDIT_SECRET_KEY="xnd_development_<YOUR_SECRET_KEY>"
XENDIT_WEBHOOK_TOKEN="<YOUR_WEBHOOK_VERIFICATION_TOKEN>"

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME="<YOUR_CLOUD_NAME>"
CLOUDINARY_API_KEY="<YOUR_API_KEY>"
CLOUDINARY_API_SECRET="<YOUR_API_SECRET>"

# Seed admin credentials (development only)
SEED_ADMIN_EMAIL="admin-dev@laz.id"
SEED_ADMIN_PASSWORD="DevAdmin@123"

# Optional
LOG_LEVEL="debug"
```

## Frontend (`frontend/.env`)

See `frontend/.env.example`:

```env
# Dev uses the Vite proxy (/api -> http://localhost:4000);
# in production, prefer a single origin behind a reverse proxy so cookies stay simple.
VITE_API_URL="/api"
```

---

# Local Setup & Installation

## 1. Install Dependencies

From the repo root (installs backend + frontend + root dev deps):

```bash
npm install
```

## 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in `backend/.env` with a local `DATABASE_URL` and generate random values for `SESSION_SECRET` / `CSRF_SECRET`.

## 3. Generate Prisma Client

```bash
npm --prefix backend run postinstall
# or: npx --prefix backend prisma generate
```

## 4. Synchronize Database Schema

```bash
npm run db:push
```

## 5. Seed Initial Data

```bash
npm run db:seed
```

## 6. Run Development Server

```bash
npm run dev
```

This runs backend and frontend concurrently:

- Backend API: `http://localhost:4000`
- Frontend (Vite dev server, proxies `/api` to backend): `http://localhost:5173`

---

# Default Seed Accounts

After running `npm run db:seed`:

## Super Admin

```text
Email    : admin@ruangberbagi.id  (or SEED_ADMIN_EMAIL if set)
Password : Admin@123456           (or SEED_ADMIN_PASSWORD if set)
```

## Default Organization (Lembaga) — APPROVED

```text
Yayasan Peduli Umat
Slug: yayasan-peduli-umat
Admin email: admin@yayasan-peduli-umat.id
Password: same as SEED_ADMIN_PASSWORD
```

A second Lembaga (`Yayasan Harapan Baru`) is also seeded with `status: PENDING`, to exercise the approval-queue UI.

## Sample Volunteer

```text
Email    : relawan@ruangberbagi.id
Password : Volunteer@123
```

In non-production environments, the seed also creates sample programs, donations, distributions, volunteer activities, and applications across their full status lifecycle.

Donors never have accounts — checkout is always guest, identified by phone number.

---

# Repository Structure

```text
laz-platform/
├── backend/                 # NestJS 11 API (Express adapter)
│   ├── src/
│   │   ├── modules/         # auth, users, lembaga, programs, donations,
│   │   │                    # payments, distributions, volunteers, webhooks, ...
│   │   ├── config/          # session, csrf, env
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── dist/                # compiled output → dist/backend/src/main.js
│
├── frontend/                 # Vite 7 + React 19 SPA
│   └── src/
│       ├── compat/          # shims: next/link, next/image, next/navigation, next-auth/react, @prisma/client
│       ├── features/        # programs, donations, distributions, lembaga, volunteers, users, rbac, settings, auth
│       ├── pages/            # public + dashboard + volunteer route pages
│       ├── layouts/          # PublicLayout, AuthLayout, DashboardLayout, VolunteerLayout
│       └── lib/               # api-client, query-client, logger, upload/uploadService
│
└── shared/                    # Shared TypeScript types, Zod schemas, RBAC constants
```

---

# Project Status

## Completed

- Session-based Authentication & CSRF protection
- Authorization (RBAC: SUPER_ADMIN / LEMBAGA_ADMIN)
- Lembaga self-service registration & approval workflow
- Program Management
- Donation Management (guest checkout)
- Distribution Tracking
- Volunteer Activities & Applications lifecycle
- Audit Logging
- Dashboard Analytics
- Responsive Design
- Cloudinary File Upload Integration

## Planned

- Production Xendit payment gateway hardening
- Email notifications
- WhatsApp notifications
- PDF export
- CSV export
- Advanced reporting

---

# Known Limitations

## Payment Gateway

Xendit webhook signature verification is implemented (`backend/src/modules/payments/webhook.service.ts`), but production payment integration runs against the sandbox key by default.

## Notifications

Email and WhatsApp notification services are not yet integrated (schema already tracks `emailNotifications` / `waNotifications` preferences on `User`).

## Reporting

PDF and CSV export features are not yet available.

---

# Deployment Notes

Before deploying to production:

- Provision a production PostgreSQL database and set `DATABASE_URL`
- Generate strong, unique `SESSION_SECRET` and `CSRF_SECRET` values
- Set `CORS_ORIGIN` to the deployed frontend origin
- Configure Cloudinary credentials
- Configure production `XENDIT_SECRET_KEY` and `XENDIT_WEBHOOK_TOKEN`
- Run `npm run build`, then start the backend with `node dist/backend/src/main.js`
- Run `npm run db:migrate` (Prisma `migrate deploy`) and `npm run db:seed`
