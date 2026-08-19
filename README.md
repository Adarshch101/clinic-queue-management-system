# Q-Clinix — Smart AI-Ready Clinic Queue Management System

A multi-tenant, AI-ready clinic queue management SaaS built with **Next.js 16** (App Router), **Prisma 7 + PostgreSQL**, **Supabase Auth**, **Material UI**, and **shadcn/ui**.

Patients find clinics, view live wait times, and join virtual queues from their browser (no account required). Clinic staff manage tokens, consultations, and patients; clinic owners control their workspace; and a platform **Super Admin** governs every tenant.

## Tech Stack

| Layer          | Technology |
|----------------|------------|
| Framework      | Next.js 16.2.11 (App Router, Turbopack) |
| UI Runtime     | React 19 |
| Language       | TypeScript (strict) |
| Database       | PostgreSQL via Prisma 7.9 + `@prisma/adapter-pg` |
| Hosted Auth/DB | Supabase (Auth/GoTrue + PostgreSQL) |
| Session        | Custom HMAC-SHA256 signed cookie (`q-clinix-session`) |
| Styling        | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| UI Libraries   | Material UI (MUI) v9 + shadcn/ui (Radix + CVA) |
| Animations     | framer-motion |
| Icons          | lucide-react + @mui/icons-material |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# fill in DATABASE_URL, DIRECT_URL, Supabase URL/anon key,
# SUPER_ADMIN_EMAIL/PASSWORD, SESSION_SECRET

# 3. Apply the schema and generate the client
npx prisma db push
npx prisma generate

# 4. Seed platform settings + create the Super Admin login
npm run db:seed

# 5. Run the dev server
npm run dev
# → http://localhost:3000
```

Build / lint / typecheck:

```bash
npm run build      # production build
npm run lint       # ESLint (0 errors; ~16 accepted warnings)
npx tsc --noEmit   # type check
```

> Windows: run production builds with `$env:NODE_OPTIONS="--max-old-space-size=8192"; npm run build`.

## Documentation

- `docs/PROJECT.md` — master reference: architecture, data model, API reference, RBAC, UI design system, security.
- `docs/onboarding.md` — developer onboarding & coding standards (incl. shadcn/ui contribution guide).
- `docs/admin_manual.md` — clinic owner / receptionist / super admin operations.
- `docs/production_checklist.md` — pre-launch checklist.
- `docs/disaster_recovery.md` — backup & restore procedures.
- `docs/future_roadmap.md` — planned features.

## Key Features

- Public clinic directory with live wait-time estimates and queue join/tracking.
- Role dashboards for PATIENT, RECEPTIONIST, DOCTOR, ADMIN, SUPER_ADMIN with route-level and API-level RBAC (fail-closed clinic scoping).
- Real-time queue operations: call next, transfer, skip, emergency approval, add delay, pause/resume, complete consultation.
- Appointments, visit records, medical report uploads, notifications, analytics, and reporting.
- Clinic onboarding with document upload and Super Admin verification workflow.
- Super Admin console: tenants, user management, platform flags, audits, backups, global analytics.

## Learn More

- [Next.js documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Material UI](https://mui.com)
- [Prisma](https://www.prisma.io/docs)