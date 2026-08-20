# Developer Onboarding and Installation Guide

Welcome to the development team of the **Clinic Queue Management Platform**! This guide details local setup instructions, repository conventions, and contribution standards.

---

## Local Setup Prerequisites

Make sure you have the following packages installed on your development workstation:
* **Node.js**: v18.x or newer (npm v9.x or newer)
* **PostgreSQL**: v15.x or newer (local daemon or remote instance)
* **Git**

---

## Development Installation

Follow these steps to initialize the project locally:

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd clinic-queue-management-system
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root workspace folder:
   ```env
   # PostgreSQL Connection String
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

   # Supabase Client Credentials
   NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   # Server-only service-role key (never expose to the browser)
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

4. **Initialize Database Tables:**
   Execute Prisma migrations to build tables, relationships, and indexes:
   ```bash
   npx prisma db push
   ```

5. **Generate Database client bindings:**
   ```bash
   npx prisma generate
   ```

6. **Launch local dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser to check the app.

---

## Coding Standards & Workflow

- **Layered Architecture**: Keep route controllers thin. Perform database writes inside Repositories (`src/lib/backend/repositories/`), business logic validations inside Services (`src/lib/backend/services/`), and schema checks inside Validators (`src/lib/backend/validators/`).
- **DRY & SOLID**: Avoid copy-pasting Prisma calls. Call repository functions inside services.
- **Type Safety**: Enforce strict TypeScript typing. Avoid using `any` unless absolutely required.

---

## RBAC & Security Standards

- **Always authorize server-side.** Client-side guards (`RoleGuard`) are defense-in-depth only.
- Use the helpers in `src/lib/apiAuth.ts`: `requireAuth`, `requireRole([…])`, `requireClinicAccess`, `sessionHasClinicAccess(session, clinicId)`.
- **Clinic scoping must be fail-closed**: never write `if (clinicId && session.clinicId && …)` — a falsy `clinicId` must deny, not allow. Use `sessionHasClinicAccess`.
- Resolve resource ownership from the signed session (`session.userId`) or a verified Supabase Bearer token — never trust a client-supplied `userId`/`patientId` for authorization.
- New PHI endpoints must be role-scoped and clinic-scoped; front-desk roles (RECEPTIONIST) must not receive clinical fields.
- Any new dashboard page must be wrapped in `<RoleGuard roles={[…]}>` with the correct role allow-list.

---

## UI Standards (MUI + shadcn/ui)

The project runs **two UI systems** that share one CSS-variable palette:

| System | Where it lives | Use for |
|--------|----------------|---------|
| **shadcn/ui** | `src/components/ui/` (Radix + CVA + `cn`) | New dashboard & feature UI — buttons, cards, dialogs, forms, tabs, accordions |
| **MUI** | `src/lib/muiTheme.ts` + `MuiThemeProvider` (global) | Public/auth surfaces, dense data components (tables, pickers, autocomplete) |

Rules:
1. Add shadcn components with the CLI: `npx shadcn@latest add <component>` (config in `components.json`).
2. Use the `cn()` helper (`src/lib/utils.ts`) for conditional class merging — never template-string class concatenation.
3. Build new primitives with `class-variance-authority` variants and Radix primitives for a11y (focus trap, keyboard nav, ARIA).
4. Prefer existing shadcn tokens (`bg-card`, `text-foreground`, `bg-muted`, `border-border`, …) over hard-coded colors; brand colors stay in `globals.css`.
5. Don't redefine Tailwind theme keys in a second `@theme` block (duplicate keys are rejected in Tailwind v4).
6. For legacy components that expose both shadcn primitives and a legacy composite (`Dialog`, `Tabs`, `Accordion`, `Avatar`), write new code against the shadcn primitives.
7. New public/auth pages may use MUI; new dashboard UI should use the shadcn kit.

---

## API Authorization Quick Reference

- `requireAuth(request)` → session or `NextResponse` (401/403).
- `requireRole(request, ['ADMIN', 'SUPER_ADMIN'])` → session with role allow-list.
- `requireClinicAccess(request, roles, clinicId)` → role + fail-closed clinic scope.
- `sessionHasClinicAccess(session, clinicId)` → boolean; SUPER_ADMIN passes for any clinic; a session without a clinicId is denied for a clinic-scoped action.
- `getSessionFromRequest(request)` → optional session (no throw) for public endpoints that still want to honor staff privileges (e.g. `/api/queue/join`).
