# Q-Clinix — Project Documentation

**Q-Clinix** is a multi-tenant, AI-ready clinic queue management SaaS. Patients find clinics, view live wait times, and join virtual queues from their browser (no account required); clinic staff manage tokens, consultations, and patients; clinic owners control their workspace; and a platform **Super Admin** governs every tenant.

This document is the master reference for the codebase: architecture, setup, data model, APIs, authentication/RBAC, UI design system, security, scripts, and operational gotchas.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Repository Layout](#2-repository-layout)
3. [Getting Started](#3-getting-started)
4. [Environment Variables](#4-environment-variables)
5. [Architecture Overview](#5-architecture-overview)
6. [Authentication & Session Flow](#6-authentication--session-flow)
7. [Roles, Permissions & RBAC](#7-roles-permissions--rbac)
8. [Data Model (Prisma)](#8-data-model-prisma)
9. [API Reference](#9-api-reference)
10. [Frontend Routes & Features](#10-frontend-routes--features)
11. [UI & Design System](#11-ui--design-system)
12. [Security](#12-security)
13. [Scripts & Tooling](#13-scripts--tooling)
14. [Known Caveats & Gotchas](#14-known-caveats--gotchas)
15. [Related Documents](#15-related-documents)

---

## 1. Tech Stack

| Layer          | Technology |
|----------------|------------|
| Framework      | Next.js **16.2.11** (App Router, Turbopack) |
| UI Runtime     | React **19.2.4** |
| Language       | TypeScript (strict) |
| Database       | PostgreSQL via **Prisma 7.9.0** + `@prisma/adapter-pg` (driver adapter) |
| Hosted DB/Auth | Supabase (PostgreSQL + Auth/GoTrue) |
| Auth Cookies   | Custom HMAC-SHA256 signed session cookie (`q-clinix-session`) |
| Styling        | Tailwind CSS **v4** (CSS-first `@theme` tokens) + **Material UI (MUI) v9** + Emotion |
| Animations     | `framer-motion` |
| Icons          | `lucide-react` (legacy/custom UI) and `@mui/icons-material` (MUI UI) |
| Fonts          | `next/font` — Outfit (variable `--font-sans`) |
| Notifications  | In-app engine (`src/lib/notificationEngine.ts`) + SMTP/Twilio configuration placeholders |

> **Important (MUI v9):** MUI v9 removed the CSS *system props* (`alignItems`, `justifyContent`, `flexWrap`, …) from `Stack` — pass them via `sx`. The project integrates MUI through `src/lib/muiTheme.ts` + `src/components/providers/MuiThemeProvider.tsx`.

---

## 2. Repository Layout

```
src/
├── proxy.ts                     # Next.js middleware (proxy): security headers + auth/RBAC redirects
├── app/                         # App Router pages
│   ├── page.tsx                 # Landing / clinic search homepage (MUI)
│   ├── layout.tsx               # Root layout (fonts + Auth/App/MUI providers)
│   ├── globals.css              # Tailwind v4 theme tokens (light/dark CSS vars)
│   ├── login/ register/ auth/*  # Auth screens (AuthLayout + MUI forms)
│   ├── clinics/ contact/ about/ # Public pages
│   ├── queue-status/ tv-display/ # Public queue tracking + waiting-room TV board
│   ├── admin/                   # Clinic admin hub + Super Admin console
│   ├── doctor/ receptionist/ patient/ # Role dashboards
│   └── api/                     # Route handlers (see API Reference)
├── components/
│   ├── layout/                  # PublicLayout, AuthLayout, DashboardLayout
│   ├── providers/               # MuiThemeProvider
│   ├── ui/                      # Custom shadcn-style kit: Card, Button, Input, Select, Badge, Tabs, Accordion…
│   └── dashboard/               # Shared dashboard widgets
├── features/
│   ├── auth/                    # AuthContext, authService, LoginForm/RegisterForm, validators
│   ├── clinics/onboarding/      # Clinic registration flow (draft → upload → review)
│   └── public/                  # SearchPanel, ClinicCard, JoinQueueDialog, TokenSuccess
├── context/                     # AppContext (theme, clinics, currentClinic, notifications, user)
└── lib/
    ├── prisma.ts                # Prisma client (adapter-pg)
    ├── session.ts               # Signed cookie session create/verify
    ├── apiAuth.ts               # requireAuth / requireRole / clinic-access helpers
    ├── resolveProfile.ts        # Role + permissions resolution (env super admin)
    ├── supabaseClient.ts        # Supabase JS client
    ├── analyticsService.ts      # Dashboard analytics aggregation
    ├── notificationEngine.ts    # Notification dispatch engine
    ├── fileStorage.ts           # Document upload helpers
    ├── backupService.ts         # Backup job runner
    ├── mockData.ts              # Legacy mock data / types
    ├── muiTheme.ts              # MUI light/dark themes from the brand palette
    └── backend/                 # Layered backend utilities
        ├── errors/              # AppError + withErrorHandler
        ├── middleware/          # authMiddleware, rateLimiter
        ├── repositories/        # User/Queue/Clinic repositories
        ├── services/            # User/Queue/Clinic/Cache services
        ├── validators/          # Zod schemas
        ├── websocket/           # wsServer
        └── workers/             # backgroundWorker
prisma/
├── schema.prisma                # Full data model
└── (migrations via prisma.config.ts)
scripts/
└── seed.mts                     # Platform seed + Super Admin Auth user creation
docs/                            # This documentation set
```

---

## 3. Getting Started

**Prerequisites:** Node.js ≥ 20 (project runs on v22), PostgreSQL (or a Supabase project), Git.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   → fill in DATABASE_URL, DIRECT_URL, Supabase URL/anon key,
#     SUPER_ADMIN_EMAIL/PASSWORD, SESSION_SECRET

# 3. Apply the schema to the database (dev quickstart; uses DIRECT_URL)
npx prisma db push

# 4. Regenerate the Prisma client (required after any schema change)
npx prisma generate

# 5. Seed platform settings + create the Super Admin login
npm run db:seed

# 6. Run the dev server
npm run dev
# → http://localhost:3000
```

Build/lint/typecheck:

```bash
npm run build     # production build
npm run lint      # ESLint (expect 0 errors; ~16 accepted warnings)
npx tsc --noEmit  # Type check
```

> **Windows/memory:** the production build can exhaust default Node heap — run with
> `$env:NODE_OPTIONS="--max-old-space-size=8192"; npm run build`.

---

## 4. Environment Variables

See `.env.example`. All are required unless marked optional.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma + app connection string |
| `DIRECT_URL` | Direct connection used by Prisma for migrations/push |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (publishable) key |
| `SUPER_ADMIN_EMAIL` | Email that is granted **SUPER_ADMIN** on the platform |
| `SUPER_ADMIN_PASSWORD` | Password used by `npm run db:seed` to create the Super Admin **Auth** login |
| `SESSION_SECRET` | HMAC secret for the `q-clinix-session` cookie (long random string; required in production) |
| `ENABLE_LOGIN_FALLBACK` | Optional; `"true"` enables the passwordless login-fallback endpoint (**dev only**, ignored in production) |
| `SMTP_*`, `SMTP_FROM` | Optional email provider settings |

---

## 5. Architecture Overview

**Layered backend** (documented in `docs/onboarding.md`): route handlers are thin; repositories own raw Prisma calls (`src/lib/backend/repositories/`), services own business logic (`src/lib/backend/services/`), and validators define Zod schemas (`src/lib/backend/validators/`).

**Request lifecycle:**
1. `src/proxy.ts` runs on matched routes — verifies the session cookie, redirects guests away from auth pages, blocks unauthenticated users from dashboards, enforces clinic-status gates (`PENDING/REJECTED/SUSPENDED`) and RBAC route guards, and applies security headers.
2. Route handlers call helpers from `src/lib/apiAuth.ts` (`requireAuth`, `requireRole`, `requireClinicAccess`, …) to authorize the request.
3. Business logic executes against Prisma; errors bubble up through `withErrorHandler` (`src/lib/backend/errors/errorHandler.ts`) which normalizes `AppError` / Zod / 500 responses.

---

## 6. Authentication & Session Flow

### Sign-in
1. `authService.login(email, password)` calls Supabase `signInWithPassword`.
2. On success it fetches the resolved profile (`resolveProfile(userId, email)`) and calls `POST /api/auth/set-session`, which issues a signed cookie.
3. The cookie `q-clinix-session` is a `base64url(JSON).base64url(HMAC-SHA256)` token (`src/lib/session.ts`), valid **24 h** (`SESSION_TTL_MS`). Tampering or expiry yields `null` from `verifySessionToken`.

### Role resolution (`src/lib/resolveProfile.ts`)
- A user whose email equals `SUPER_ADMIN_EMAIL` is **SUPER_ADMIN** (`permissions: ['*']`).
- Otherwise the profile tables are scanned: `ClinicAdmin` → `Doctor` → `Receptionist` → `Patient`. The `role` **column on the profile row is the source of truth**, with the table-implied role as fallback for legacy rows.
- Invited staff who haven't signed in yet are matched by **email** as a fallback (their profile row is linked to the Supabase Auth userId on first `/api/auth/sync`).
- Permissions are read from the `Permission` table by role, with hardcoded defaults when no rows exist.

### Sync (`POST /api/auth/sync`)
Binds a logged-in Supabase user to their profile row (adopt-only for privileged staff). The guard:
- Privileged staff (ADMIN/DOCTOR/RECEPTIONIST) are **adopted** by `userId`, then email.
- The computed actual role must equal the requested role, otherwise **403**.
- SUPER_ADMIN requires the verified email to match `SUPER_ADMIN_EMAIL`.

### Super Admin provisioning
The Super Admin is **email-designated** (not stored as a DB profile row). `npm run db:seed` creates the matching **Supabase Auth user** (`auth.users` + `auth.identities`) with a bcrypt-hashed password (via `pgcrypto`), email-confirmed, so they can actually sign in. See `scripts/seed.mts`.

### Login fallback (dev only)
`POST /api/auth/login-fallback` is disabled unless `ENABLE_LOGIN_FALLBACK === "true"` **and** `NODE_ENV !== "production"` (returns 403). Rate-limited (10 req / 15 min).

---

## 7. Roles, Permissions & RBAC

| Role | Access |
|------|--------|
| `PATIENT` | Public queue join/track, patient dashboard, reports, visits |
| `RECEPTIONIST` | Front-desk dashboard, walk-in registration, wait list, bookings |
| `DOCTOR` | Doctor suite, consultation room, queue actions for their room |
| `ADMIN` | Clinic Operational Hub (queue, staff, patients, doctors, schedules, profile, documents, analytics, subscription) |
| `SUPER_ADMIN` | Everything — Super Admin Console, plus any clinic |

### Enforced in three layers
1. **Route guards** — `src/proxy.ts`: `/receptionist`, `/doctor`, `/patient`, `/admin`, `/admin/super-dashboard` (SUPER_ADMIN only); unauthenticated → `/login`; wrong role → `/auth/denied`.
2. **API helpers** — `src/lib/apiAuth.ts`: `requireAuth`, `requireRole(allowed)`, `requireClinicAccess`, `requireStaffClinicAccess`, `sessionHasClinicAccess(session, clinicId)` (SUPER_ADMIN may act on any clinic; everyone else only their own).
3. **Per-clinic limits** — `POST /api/admin/staff` enforces 1 admin / 10 receptionists / 10 doctors per clinic; `DELETE` verifies clinic ownership and blocks removing the last admin.

---

## 8. Data Model (Prisma)

Schema: `prisma/schema.prisma` (applied with `prisma db push`; migrations pending via `prisma.config.ts`).

**Enums:** `Role` (PATIENT, RECEPTIONIST, DOCTOR, ADMIN, SUPER_ADMIN), `TokenStatus`, `AppointmentStatus`, `SubscriptionTier`.

Key models and relationships:

| Model | Purpose / notable fields |
|-------|--------------------------|
| `Clinic` | Tenant root; `subdomain` unique; `status` PENDING/VERIFIED/REJECTED/SUSPENDED; owns doctors, receptionists, patients, tokens, schedule, documents, settings |
| `ClinicAdmin` / `Doctor` / `Receptionist` | Staff profiles; `userId` links to Supabase Auth; **`role` column** = source of truth |
| `Patient` | `userId` nullable (walk-ins without account); phone/age/gender; owns appointments, tokens, visits, medical reports |
| `Appointment` | patient↔doctor schedule; `qrCodeUrl`; status lifecycle |
| `QueueToken` | Live queue entries: `tokenNumber` (e.g. `A-012`), `priority`, `isEmergency`, `estimatedWait`, status transitions `WAITING→CALLED→IN_CONSULTATION→COMPLETED` (+ SKIPPED/RECALLED/CANCELLED/NO_SHOW) |
| `Visit` | Post-consultation record: diagnosis, prescriptions, notes |
| `MedicalReport` | Patient documents (X-Ray, Blood Test, …) |
| `WorkingHours` / `Holiday` | Clinic + per-doctor schedules |
| `Subscription` | Tier lifecycle (FREE/BASIC/PREMIUM/ENTERPRISE) |
| `AuditLog` | Every significant action (`action`, `details`, `userRole`, `clinicId`) |
| `Permission` | Role → resource/action grants (used by `resolveProfile`) |
| `ClinicProfile` / `ClinicDocument` / `ClinicSettings` | Public listing data, verification documents, operational toggles |
| `VerificationRequest` / `VerificationHistory` | Onboarding review workflow |
| `QueueEvent` / `QueueTransferHistory` | Queue audit trail |
| `PlatformSettings` / `FeatureFlag` / `Announcement` | Super Admin platform config |
| `Notification` / `NotificationPreference` / `NotificationTemplate` / `NotificationEvent` / `DeliveryLog` / `ScheduledNotification` | Notifications stack |
| `AnalyticsEvent` / `AnalyticsSummary` | Analytics telemetry + rollups |
| `Report` / `ScheduledReport` | Reporting |
| `DashboardLayout` / `WidgetPreference` / `UserPreference` | Per-user dashboard/UX preferences (theme, time/date formats) |
| `IntegrationConfig` / `ApiKey` | SMTP/Twilio/Google Maps/S3 integrations (obfuscated values) |
| `BackupJob` / `ConfigurationHistory` | Backup tracking + settings change history |

---

## 9. API Reference

Convention: auth required unless noted. Errors from `withErrorHandler` routes use `{ success, message, errors?, meta }`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Clinic registration → pending review |
| POST | `/api/auth/login-fallback` | — | Passwordless dev fallback (rate-limited, dev only) |
| POST | `/api/auth/set-session` | — | Issue signed session cookie after Supabase sign-in |
| GET | `/api/auth/session` | ✓ | Resolve current session/profile by userId+email |
| GET | `/api/auth/me` | ✓ | Current user profile |
| POST | `/api/auth/sync` | ✓ | Bind Supabase user → profile row (role-match guard) |
| POST | `/api/auth/signout` | ✓ | Clear session + audit logout |
| POST | `/api/auth/audit` | ✓ | Write audit log |

### Clinics & Onboarding
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clinics/search` | — | Public clinic search (query/location/pincode/openNow/hasQueue/type/sort) |
| GET | `/api/clinics/details` | — | Public clinic detail |
| GET/POST | `/api/clinics/settings` | ADMIN/SUPER | Clinic operational settings |
| GET/POST | `/api/onboarding/draft` | — | Save/load registration draft |
| POST | `/api/onboarding/upload` | — | Upload verification documents (DELETE too) |
| GET | `/api/onboarding/pending-list` | SUPER | Pending verification requests |
| POST | `/api/onboarding/review` | SUPER | Approve/reject/request-changes |

### Queue
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/queue` | ✓ | List queue by clinic / create token |
| POST | `/api/queue/join` | — | Public online check-in (walk-in/join) |
| GET | `/api/queue/track` | — | Public token tracking |
| POST | `/api/queue/actions` | STAFF | Call next / start / complete / transfer / emergency / skip (audited) |
| POST | `/api/queue/cancel` | — | Cancel a token |

### Appointments, Patients, Reports
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST/PATCH | `/api/appointments` | ✓ | Bookings, checked-in status |
| GET | `/api/visits` | ✓ | Patient visit history |
| GET/POST/DELETE | `/api/reports` | ✓ | Medical reports |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/dashboard-stats` | ADMIN/SUPER | Clinic KPI + staff + audit logs (clinic-scoped) |
| POST | `/api/admin/profile` | ADMIN | Update clinic profile |
| POST/DELETE | `/api/admin/staff` | ADMIN | Add/remove staff (1 admin / 10 / 10 limits) |

### Analytics & Reporting
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/analytics/dashboard` | ADMIN/SUPER | Dashboard analytics (clinic-scoped) |
| GET/POST | `/api/analytics/reports` | ADMIN | Build/manage reports |
| POST | `/api/analytics/reports/export` | ADMIN | Export report |
| GET/POST | `/api/analytics/widget-preferences` | ✓ | Per-widget visibility/favorites |

### Super Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/super-admin/stats` | SUPER | Global platform stats |
| POST | `/api/super-admin/actions` | SUPER | Toggle flags, maintenance, settings, announcements, suspend |
| GET | `/api/super-admin/users` | SUPER | Unified directory of all patients/staff (role+query filters) |
| GET/POST | `/api/super-admin/settings` | SUPER | Platform settings read/update |
| GET/POST | `/api/super-admin/backup` | SUPER | Backup jobs |

### Notifications & UX
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/PATCH/DELETE | `/api/notifications` | ✓ | List/read/delete notifications |
| GET/POST | `/api/notifications/preferences` | ✓ | Notification preferences |
| GET/POST | `/api/user/preferences` | ✓ | Theme/time/date/accessibility preferences |

---

## 10. Frontend Routes & Features

- **Public**: `/` (landing + clinic search + join queue), `/clinics`, `/clinics/[id]`, `/queue-status`, `/tv-display`, `/about`, `/contact`. Rendered in `PublicLayout` (MUI header/drawer/footer).
- **Auth**: `/login`, `/register` (MUI split-screen `AuthLayout`), `/auth/{pending,rejected,suspended,denied,forgot-password,reset-password,onboarding}`.
- **Dashboards** (in `DashboardLayout`):
  - `/admin/dashboard` — Clinic Operational Hub (hash-driven tabs: overview, queue, patients, doctors, staff, clinic, profile, documents, analytics, ai, subscription).
  - `/admin/super-dashboard` — Super Admin Console (grouped sidebar: Tenants / System / Monitoring; clinic deep-dive dropdown + clinic-scoped analytics).
  - `/doctor/dashboard`, `/receptionist/dashboard`, `/patient/dashboard`, `/queue-status`.
- **Sidebar navigation** uses native anchors with URL hashes (`/admin/dashboard#queue`); each dashboard syncs `location.hash` → active tab on load and on `hashchange`. The top tab bars were intentionally removed — sidebar items drive the content.

---

## 11. UI & Design System

- **Tailwind v4 tokens** (`src/app/globals.css`): brand palette defined as CSS variables under `:root` (light) and `.dark` (dark), exposed to Tailwind via `@theme`. Key tokens: `--primary: #4f46e5` (indigo), `--bg-base`, `--bg-surface`, `--bg-muted`, `--border-subtle`, `--text-*`, plus semantic `--success/-warning/-danger/-info` and shadow/radius/spacing tokens.
- **MUI integration**: `src/lib/muiTheme.ts` maps the same brand colors into MUI `lightTheme`/`darkTheme` (rounded 16px shape, Outfit font, component overrides for Button/Card/Paper/TextField/Accordion). `src/components/providers/MuiThemeProvider.tsx` wraps the app with `AppRouterCacheProvider` (`@mui/material-nextjs/v16-appRouter`) + `ThemeProvider` + `CssBaseline`, switching themes based on `useApp().theme`.
- **Custom shadcn-style kit** (`src/components/ui/`): `Card`, `Button`, `Input`, `Select`, `Badge`, `Tabs`, `Accordion` — used by the legacy dashboards and public widgets (SearchPanel, ClinicCard, JoinQueueDialog, TokenSuccess).
- **Migration state**: landing, public layout, and auth screens are fully MUI. Dashboards still use the custom kit + Tailwind. The two systems share the same CSS-variable palette, so they coexist visually.
- **Theme toggle** lives in `PublicLayout` and `DashboardLayout`; user theme preference is persisted via `/api/user/preferences` and managed in `AppContext`.

---

## 12. Security

- **Signed sessions** — HMAC-SHA256 (timing-safe compare) session cookie, 24 h TTL, `SESSION_SECRET` required in production.
- **Security headers** — applied in `next.config.ts` **and** `src/proxy.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and a strict `Content-Security-Policy`.
- **Route protection** — `proxy.ts` guards all dashboard routes and the Super Admin console; wrong-role users are sent to `/auth/denied`.
- **API authorization** — `apiAuth` helpers gate every sensitive handler; clinic-scoped data is double-checked via `sessionHasClinicAccess`.
- **Rate limiting** — in-memory `RateLimiter` (`src/lib/backend/middleware/rateLimiter.ts`) on sensitive endpoints (e.g. login fallback: 10/15 min).
- **Secrets** — `.env` is gitignored; `.env.example` documents placeholders only; SMTP/Twilio/API keys are stored obfuscated in `IntegrationConfig`/`ApiKey` tables.

---

## 13. Scripts & Tooling

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build (use elevated NODE_OPTIONS on Windows) |
| `npm start` | Serve production build |
| `npm run lint` | ESLint (0 errors; ~16 accepted warnings) |
| `npx tsc --noEmit` | Type check |
| `npx prisma db push` | Apply schema to database (dev quickstart) |
| `npx prisma generate` | Regenerate Prisma client (after schema changes) |
| `npm run db:seed` | Run `scripts/seed.mts` (platform settings + Super Admin Auth user) |

`prisma.config.ts` wires the seed via `migrations.seed = "node scripts/seed.mts"` so `prisma db seed` also works.

---

## 14. Known Caveats & Gotchas

- **Supabase Auth generated columns**: `auth.users.confirmed_at` and `auth.identities.email` are **GENERATED** columns — omit them from inserts. `auth.identities.provider_id` is `text`. Token columns (`confirmation_token`, etc.) must be `''` **not** `NULL` (NULL breaks GoTrue with `Database error querying schema`). See `scripts/seed.mts`.
- **IPv6-only DNS**: the Supabase DB host may only resolve over IPv6 locally; if `prisma db push` fails, use the pooler/`DIRECT_URL` or check DNS resolution (`Resolve-DnsName`).
- **`prisma db push` does NOT regenerate the client** — always run `npx prisma generate` after schema changes (the dev server also needs a restart to pick it up).
- **Build memory**: on Windows set `NODE_OPTIONS=--max-old-space-size=8192` before `npm run build`.
- **MUI v9 `Stack`**: system props must live under `sx` (see §1).
- **Dashboards are hash-driven**: sidebar links are native anchors (`…/dashboard#tab`); every dashboard syncs the hash to its active tab. Don't reintroduce a `Tabs` strip unless the sidebar is removed too.
- **Super Admin is email-designated** — there is no DB row for it; changing `SUPER_ADMIN_EMAIL` without re-seeding/creating the Auth user breaks that login.
- **Login fallback** returns 403 unless `ENABLE_LOGIN_FALLBACK="true"` and `NODE_ENV !== 'production'`.

---

## 15. Related Documents

- `docs/onboarding.md` — developer onboarding & coding standards
- `docs/admin_manual.md` — clinic owner / receptionist / super admin operations
- `docs/disaster_recovery.md` — backup & restore procedures
- `docs/production_checklist.md` — pre-launch checklist
- `docs/future_roadmap.md` — telemedicine, appointment scheduling, Stripe, AI predictions