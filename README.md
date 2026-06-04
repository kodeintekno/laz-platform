# LAZ Platform

Multi-Tenant ZISWAF (Zakat, Infak, Sedekah, dan Wakaf) donation management platform built with Next.js, Prisma, PostgreSQL, and NextAuth.

Status: MVP Completed ✅

---

# Product Overview

LAZ Platform is a web-based fundraising and social finance management platform that enables Islamic charitable organizations (LAZ) to manage donation programs, collect donations, track fund distributions, and maintain audit trails.

The platform supports multiple organizations (multi-tenant architecture), role-based access control (RBAC), donation tracking, and operational reporting.

## Primary Actors

### SUPER_ADMIN
- Manage platform configuration
- Manage organizations (LAZ)
- Manage roles and permissions
- Full system access

### ADMIN
- Manage donation programs
- Manage donors and donations
- View operational reports

### FINANCE
- Verify payments
- Approve distributions
- Monitor financial activities

### RELAWAN
- Submit distribution requests
- Upload field documentation
- Track program implementation

### DONATUR
- Browse programs
- Make donations
- View donation history

---

# Feature Matrix

| Feature | Status |
|----------|----------|
| Authentication | ✅ Complete |
| Authorization (RBAC) | ✅ Complete |
| Program Management | ✅ Complete |
| Donation Management | ✅ Complete |
| Guest Donation Flow | ✅ Complete |
| Distribution Management | ✅ Complete |
| Audit Logging | ✅ Complete |
| Dashboard Analytics | ✅ Complete |
| Responsive UI | ✅ Complete |
| File Uploads | ✅ Complete |
| Multi-Tenant Foundation | ✅ Complete |
| Payment Gateway Integration | ⚠️ Partial |
| Notifications | ⚠️ Planned |
| PDF/CSV Export | ⚠️ Planned |

---

# Tech Stack

## Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

## Backend
- Next.js Server Actions
- NextAuth v5
- Prisma ORM

## Database
- PostgreSQL
- Neon (Production)

## Storage
- Cloudinary

## State Management
- Zustand

---

# Environment Variables

Create a `.env.development` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/laz_db?schema=public"

AUTH_SECRET="your-secret-key"

# Optional
MIDTRANS_SERVER_KEY=""

# Optional
CLOUDINARY_URL=""

# Optional
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Optional
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Optional
SEED_ADMIN_EMAIL="admin@laz.id"
SEED_ADMIN_PASSWORD="Admin@123456"
```

## Required Variables

| Variable | Description |
|-----------|-----------|
| DATABASE_URL | PostgreSQL connection string |
| AUTH_SECRET | NextAuth secret key |

## Optional Variables

| Variable | Description |
|-----------|-----------|
| MIDTRANS_SERVER_KEY | Required only when integrating payment gateway |
| CLOUDINARY_* | Required only for Cloudinary uploads |
| NEXT_PUBLIC_* | Production deployment configuration |
| SEED_ADMIN_* | Override default seed credentials |

---

# Local Setup & Installation

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Create:

```text
.env.development
```

and fill the required variables.

## 3. Generate Prisma Client

```bash
npx prisma generate
```

## 4. Synchronize Database Schema

```bash
npx prisma db push
```

## 5. Seed Initial Data

```bash
npx prisma db seed
```

## 6. Run Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:3000
```

---

# Default Seed Accounts

After running:

```bash
npx prisma db seed
```

the following accounts are created:

## Super Admin

```text
Email    : admin@laz.id
Password : Admin@123456
```

## Donatur

```text
Email    : donatur@laz.id
Password : Admin@123456
```

## Default Organization

```text
LAZ Peduli
Slug: laz-peduli
```

---

# Repository Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── programs/
│   ├── donations/
│   ├── distributions/
│   ├── audit/
│   ├── reports/
│   └── rbac/
├── hooks/
├── lib/
├── types/
└── middleware/

prisma/
├── schema.prisma
└── seed.ts

public/
```

---

# Project Status

Current Version: MVP v1.0

## Completed

- Authentication
- Authorization (RBAC)
- Program Management
- Donation Management
- Guest Donations
- Distribution Tracking
- Audit Logging
- Dashboard Analytics
- Responsive Design
- File Upload Integration

## Planned

- Production Payment Gateway
- Email Notifications
- WhatsApp Notifications
- PDF Export
- CSV Export
- Advanced Reporting
- Multi-Tenant Security Hardening

---

# Known Limitations

## Payment Gateway

The current donation checkout uses a mock/sandbox payment flow.

Midtrans webhook verification is available, but production payment integration has not been fully enabled.

## Notifications

Email and WhatsApp notification services are not yet integrated.

## Reporting

PDF and CSV export features are not available in the MVP release.

## Multi-Tenant Hardening

Additional ownership validation is required for mutation endpoints before public multi-tenant deployment.

---

# Deployment Notes

Before deploying to production:

- Configure PostgreSQL production database
- Configure AUTH_SECRET
- Configure Cloudinary credentials
- Configure Midtrans credentials
- Review multi-tenant ownership validation
- Run database migration and seed process

---

# MVP Release

Version: v1.0.0-mvp

Release Status: Demo Ready ✅

Suitable for:
- Product demonstrations
- Internal testing
- Stakeholder reviews

Not yet recommended for:
- Public multi-tenant production deployment
- Financial transaction processing with real payments