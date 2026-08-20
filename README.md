# Q-Clinix

**A multi-tenant, AI-ready clinic queue management platform.**

Q-Clinix lets patients discover clinics, view live wait times, and join virtual queues from any browser — no account required. Clinic staff manage tokens, consultations, and patients; clinic owners control their workspace; and a platform **Super Admin** governs every tenant.

Built with **Next.js 16 (App Router)**, **Prisma 7 + PostgreSQL**, **Supabase Auth**, **Material UI**, and **shadcn/ui** — secured end-to-end with signed sessions, layered role-based access control, and fail-closed clinic scoping.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository Layout](#repository-layout)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Scripts](#scripts)
8. [Roles & RBAC](#roles--rbac)
9. [Frontend Routes](#frontend-routes)
10. [API Overview](#api-overview)
11. [Security](#security)
12. [Documentation](#documentation)

---

## Features

- **Public clinic directory** — search verified clinics with live wait-time estimates, doctor listings, and service details.
- **Virtual queue join & tracking** — patients join a clinic queue from their phone and track their position in real time (no login required for anonymous walk-ins).
- **Role-based dashboards** — dedicated workspaces for `PATIENT`, `RECEPTIONIST`, `DOCTOR`, `ADMIN`, and `SUPER_ADMIN`, guarded at the route layer, the client layer, and the API layer.
- **Queue operations** — call next, complete consultation, transfer, skip, recall, emergency approval, add delay, pause/resume — each gated by a per-action role matrix.
- **Appointments & visits** — booking, check-in, and post-consultation records (diagnosis, prescriptions, notes) with PHI redaction for front-desk roles.
- **Medical report management** — secure upload, listing, and authenticated viewing of patient documents (stored in UploadThing with ACL configured via `UPLOADTHING_ACL`).
- **Clinic onboarding workflow** — multi-step registration with document upload and a Super Admin verification/review queue.
- **Super Admin console** — platform stats, tenant deep-dives, user directory, feature flags, announcements, audit logs, settings, and database backups.
- **Notifications & analytics** — in-app notification engine, dashboard analytics, scheduled reports, and per-user widget preferences.

---

## Tech Stack

| Layer          | Technology |
|----------------|------------|
| Framework      | Next.js 16.2.11 (App Router, Turbopack) |
| UI Runtime     | React 19.2.4 |
| Language       | TypeScript (strict) |
| Database       | PostgreSQL via Prisma 7.9 + `@prisma/adapter-pg` (driver adapter) |
| Hosted Auth/DB | Supabase (Auth/GoTrue + PostgreSQL) |
| Session        | Custom HMAC-SHA256 signed cookie (`q-clinix-session`, 24 h TTL) |
| Styling        | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| UI Libraries   | Material UI v9 (public/auth surfaces) + shadcn/ui (dashboards/features) |
| Animations     | framer-motion |
| Icons          | lucide-react (shadcn/custom UI) + @mui/icons-material (MUI) |
| Fonts          | next/font — Outfit (variable `--font-sans`) |

> **Two UI systems, one palette:** MUI powers the landing page, public layout, and auth screens via `src/lib/muiTheme.ts` + `MuiThemeProvider`. The shadcn/ui kit (`src/components/ui/`) is the standard for dashboards and feature UI. Both share the same CSS-variable palette in `src/app/globals.css` and coexist visually.

---

## Architecture

The app follows a layered backend pattern:

```
Route handlers  →  Auth (apiAuth helpers)  →  Validators (Zod)  →  Services  →  Repositories  →  Prisma
```

- Route handlers are thin and delegate business logic to services (`src/lib/backend/services/`) and repositories (`src/lib/backend/repositories/`).
- Every sensitive route authorizes the request server-side before touching data.
- Clinic-scoped data is double-checked with `sessionHasClinicAccess` (fail-closed) so a missing/foreign `clinicId` denies access.
- Ownership is always resolved from the signed session (`session.userId`) or a verified Supabase Bearer token — never from client-supplied IDs.

**Request lifecycle:**

1. `src/proxy.ts` (Next.js proxy/middleware) verifies the signed session cookie, redirects guests away from auth pages, blocks unauthenticated dashboard access, enforces clinic-status gates (`PENDING`/`REJECTED`/`SUSPENDED`), applies RBAC route guards, and sets security headers.
2. Route handlers re-authorize with `requireAuth` / `requireRole` / `requireClinicAccess`.
3. Business logic runs against Prisma; errors normalize through `withErrorHandler` into `{ success, message, errors? }`.

---

## Repository Layout

```
├── prisma/
│   └── schema.prisma            # Full data model (roles, clinics, queue, PHI, platform)
├── scripts/
│   └── seed.mts                 # Seeds platform settings + creates the Super Admin Auth user
├── src/
│   ├── proxy.ts                 # Next.js proxy: security headers + auth/RBAC redirects
│   ├── app/
│   │   ├── page.tsx             # Landing / clinic search homepage (MUI)
│   │   ├── layout.tsx           # Root layout (fonts + Auth/App/MUI providers)
│   │   ├── globals.css          # Tailwind v4 theme tokens + shadcn design tokens
│   │   ├── login/ register/ auth/*  # Auth screens
│   │   ├── clinics/ queue-status/ tv-display/  # Public pages
│   │   ├── admin/ doctor/ receptionist/ patient/  # Role dashboards
│   │   └── api/                 # Route handlers (see API overview below)
│   ├── components/
│   │   ├── guards/              # RoleGuard (client-side route guard)
│   │   ├── layout/              # PublicLayout, AuthLayout, DashboardLayout
│   │   ├── providers/           # MuiThemeProvider
│   │   ├── ui/                  # shadcn/ui kit: Button, Card, Input, Select, Badge, Dialog, ...
│   │   └── dashboard/           # Shared dashboard widgets
│   ├── features/
│   │   ├── auth/                # AuthContext, authService, Login/Register forms, validators
│   │   ├── clinics/onboarding/  # Clinic registration flow (draft → upload → review)
│   │   └── public/              # SearchPanel, ClinicCard, JoinQueueDialog, TokenSuccess
│   ├── context/                 # AppContext (theme, clinics, currentClinic, notifications, user)
│   └── lib/
│       ├── session.ts           # Signed cookie session create/verify
│       ├── apiAuth.ts           # requireAuth / requireRole / requireClinicAccess
│       ├── resolveProfile.ts    # Role + permissions resolution
│       ├── fileStorage.ts       # UploadThing storage (ACL via UPLOADTHING_ACL) + validation; local fallback in dev
│       ├── backupService.ts     # Private database backups + protected download keys
│       ├── muiTheme.ts          # MUI light/dark themes
│       └── backend/             # errors, middleware, repositories, services, validators, workers
├── docs/                        # Full documentation set (see Documentation)
└── public/                      # Static assets only (no PHI — files live in UploadThing)
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (project developed on v22)
- **PostgreSQL** 15+ — local, remote, or a Supabase project
- **Git**

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# fill in DATABASE_URL, DIRECT_URL, Supabase URL/anon key,
# SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SESSION_SECRET,
# and UPLOADTHING_TOKEN (optional in dev — falls back to local storage)

# 3. Apply the schema to the database
npx prisma db push

# 4. Regenerate the Prisma client (required after any schema change)
npx prisma generate

# 5. Seed platform settings + create the Super Admin login
npm run db:seed

# 6. Run the dev server
npm run dev
# → http://localhost:3000
```

### Build, lint, typecheck

```bash
npm run build      # production build
npm run lint       # ESLint (0 errors; ~16 accepted warnings)
npx tsc --noEmit   # type check
```

> **Windows/memory:** run production builds with
> `$env:NODE_OPTIONS="--max-old-space-size=8192"; npm run build`.

---

## Environment Variables

All variables are required unless marked optional. See `.env.example` for the template.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma + app PostgreSQL connection string |
| `DIRECT_URL` | Direct connection for Prisma migrations/`db push` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `SUPER_ADMIN_EMAIL` | Email granted **SUPER_ADMIN** on the platform (required in production — fail-closed if missing) |
| `SUPER_ADMIN_PASSWORD` | Password used by `npm run db:seed` to create the Super Admin Auth login |
| `SESSION_SECRET` | HMAC secret for the `q-clinix-session` cookie (long random string; **required in production**) |
| `UPLOADTHING_TOKEN` | UploadThing API token for file storage (required in production; falls back to local `data/uploads` in dev) |
| `UPLOADTHING_APP_ID` | UploadThing app ID (needed if you set up client-side uploads; token alone suffices for server-side storage) |
| `UPLOADTHING_ACL` | ACL for stored files: `private` (default, paid plan) or `public-read` (free tier). The raw CDN URL is never returned to clients either way — files are served only via authenticated `/api/files/*` endpoints |
| `SMTP_*`, `SMTP_FROM` | Optional email provider settings for notifications |

> **Never commit real credentials.** `.env` is gitignored. Use placeholders in any shared example.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Create a production build (use elevated `NODE_OPTIONS` on Windows) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (0 errors; ~16 accepted warnings) |
| `npx tsc --noEmit` | Type-check the project |
| `npx prisma db push` | Apply the schema to the database (dev quickstart) |
| `npx prisma generate` | Regenerate the Prisma client |
| `npm run db:seed` | Seed platform settings + create the Super Admin Auth user |

---

## Roles & RBAC

| Role | Access |
|------|--------|
| `PATIENT` | Public queue join/track, patient dashboard, own reports, visits, bookings |
| `RECEPTIONIST` | Front-desk dashboard, walk-in registration, wait list, check-ins (no clinical fields) |
| `DOCTOR` | Doctor suite, consultation room, queue actions for their room, patient files |
| `ADMIN` | Clinic operational hub (queue, staff, patients, doctors, schedules, documents, analytics) |
| `SUPER_ADMIN` | Everything — Super Admin console, plus any clinic |

RBAC is enforced in **three layers**:

1. **Route guards** — `src/proxy.ts` guards `/receptionist`, `/doctor`, `/patient`, `/admin`, and `/admin/super-dashboard`; wrong-role users are sent to `/auth/denied`.
2. **Client guards** — every dashboard page is wrapped in `<RoleGuard roles={…}>` (`src/components/guards/RoleGuard.tsx`) and re-checks the role before rendering (defense-in-depth).
3. **API helpers** — `requireAuth`, `requireRole`, `requireClinicAccess`, and `sessionHasClinicAccess` (fail-closed) gate every sensitive handler; SUPER_ADMIN may act on any clinic, everyone else only their own.

---

## Frontend Routes

- **Public:** `/` (landing + search + join queue), `/clinics`, `/clinics/[id]`, `/queue-status`, `/tv-display`, `/about`, `/contact`.
- **Auth:** `/login`, `/register`, `/register/patient`, `/auth/{pending,rejected,suspended,denied,forgot-password,reset-password,onboarding}`.
- **Dashboards:** `/admin/dashboard` (hash-driven tabs), `/admin/super-dashboard`, `/doctor/dashboard`, `/receptionist/dashboard`, `/patient/dashboard`.

---

## API Overview

Convention: auth required unless noted. Errors from `withErrorHandler` routes use `{ success, message, errors? }`.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `register-patient`, `set-session`, `sync`, `signout`, `audit`; `GET /api/auth/session`, `me` |
| Clinics | `GET /api/clinics/search`, `/details` (public, doctor contact redacted); `GET|POST /api/clinics/settings` |
| Onboarding | `GET|POST /api/onboarding/draft`, `POST|DELETE /api/onboarding/upload`, `GET /api/onboarding/pending-list`, `POST /api/onboarding/review` |
| Queue | `GET|POST /api/queue`, `POST /api/queue/join` (public), `GET /api/queue/track` (public), `POST /api/queue/actions`, `POST /api/queue/cancel` |
| Clinical | `GET|POST|PATCH /api/appointments`, `GET /api/visits`, `GET|POST|DELETE /api/reports` |
| Files | `GET /api/files/report`, `GET /api/files/document` — authenticated, role + clinic-checked |
| Admin | `GET /api/admin/dashboard-stats`, `POST /api/admin/profile`, `POST|DELETE /api/admin/staff`, `GET /api/admin/patients` |
| Analytics | `GET /api/analytics/dashboard`, `GET|POST /api/analytics/reports`, `POST /api/analytics/reports/export`, `GET|POST /api/analytics/widget-preferences` |
| Super Admin | `GET /api/super-admin/stats`, `POST /api/super-admin/actions`, `GET /api/super-admin/users`, `GET|POST /api/super-admin/settings`, `GET|POST /api/super-admin/backup`, `GET /api/super-admin/backup/download` |
| Notifications & UX | `GET|PATCH|DELETE /api/notifications`, `GET|POST /api/notifications/preferences`, `GET|POST /api/user/preferences` |

---

## Security

- **Signed sessions** — HMAC-SHA256 (timing-safe compare) session cookie, 24 h TTL; tampering or expiry yields `null`. `SESSION_SECRET` is required in production.
- **Security headers** — set in `next.config.ts` and `src/proxy.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`, and a strict `Content-Security-Policy`.
- **API authorization** — `apiAuth` helpers gate every sensitive handler; clinic scoping is fail-closed; ownership is derived from the session or a verified Supabase Bearer token.
- **PHI protection** — diagnosis/prescriptions/notes/report bytes are role-scoped and redacted for front-desk roles; the public clinic directory strips doctor contact details.
- **Private file storage** — medical reports and clinic verification documents are stored in UploadThing (ACL configured via `UPLOADTHING_ACL`; private by default, `public-read` on free-tier apps that disallow private files) and served only through authenticated `/api/files/report` and `/api/files/document` endpoints that re-check role + clinic access and stream bytes back via short-lived signed URLs — the raw CDN URL is never exposed to clients. Database backups stay local under `data/backups` and are served only via `/api/super-admin/backup/download`.
- **Input validation** — server-side validation on registration, queue join, appointments, queue actions, uploads (extension allow-list + 10 MB cap), and onboarding review actions.
- **Rate limiting** — in-memory limiter on sensitive endpoints (queue join, registration).
- **No passwordless bypass** — Supabase is the only authentication provider; login fails closed if it is unreachable.

**Residual risks (accepted, documented in `docs/PROJECT.md`):** the in-memory rate limiter resets on restart and is best-effort in multi-instance deployments; `/api/auth/sync` auto-seeds new patients to the first clinic (data-integrity caveat, not a privilege issue).

---

## Documentation

- [`docs/PROJECT.md`](docs/PROJECT.md) — master reference: architecture, data model, API reference, RBAC, UI design system, security.
- [`docs/onboarding.md`](docs/onboarding.md) — developer onboarding & coding standards (incl. shadcn/ui contribution guide).
- [`docs/admin_manual.md`](docs/admin_manual.md) — clinic owner / receptionist / super admin operations.
- [`docs/production_checklist.md`](docs/production_checklist.md) — pre-launch checklist.
- [`docs/disaster_recovery.md`](docs/disaster_recovery.md) — backup & restore procedures.
- [`docs/future_roadmap.md`](docs/future_roadmap.md) — planned features.

---

## Learn More

- [Next.js documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Material UI](https://mui.com)
- [Prisma](https://www.prisma.io/docs)
- [Supabase](https://supabase.com/docs)
- [UploadThing](https://docs.uploadthing.com) — file storage (reports & verification documents)