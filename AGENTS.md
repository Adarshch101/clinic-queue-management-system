<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Q-Clinix Project Conventions

Master reference: `docs/PROJECT.md`. These rules are non-negotiable.

## RBAC & Security
- Authorize every sensitive API route server-side via `src/lib/apiAuth.ts` helpers: `requireAuth`, `requireRole([…])`, `requireClinicAccess`, `sessionHasClinicAccess(session, clinicId)`.
- Clinic scoping is **fail-closed**: never write `if (clinicId && session.clinicId && …)`. A missing/foreign clinicId must deny (use `sessionHasClinicAccess`).
- Resolve ownership from the signed session (`session.userId`) or a verified Supabase Bearer token — never trust a client-supplied `userId`/`patientId` for authorization.
- Front-desk roles (RECEPTIONIST) must not receive clinical fields (diagnosis, prescriptions, notes, report bytes).
- Wrap any new dashboard page in `<RoleGuard roles={[…]}>` (`src/components/guards/RoleGuard.tsx`) with the correct allow-list.

## UI (MUI + shadcn/ui)
- Two UI systems share one CSS-variable palette: **MUI** (public/auth surfaces, `src/lib/muiTheme.ts` + `MuiThemeProvider`) and **shadcn/ui** (`src/components/ui/`, new dashboard/feature UI).
- Merge conditional classes with `cn()` from `src/lib/utils.ts`; build variants with `class-variance-authority`.
- Use shadcn tokens (`bg-card`, `text-foreground`, `bg-muted`, `border-border`, …) — they resolve via the `@theme inline` block in `globals.css`.
- Don't add a second `@theme` block with duplicate keys (Tailwind v4 rejects it).
- For `Dialog`/`Tabs`/`Accordion`/`Avatar`, write new code against the shadcn primitives, not the legacy composites (`CompositeDialog`, `SegmentedTabs`, `SimpleAccordion`).

## Verification
- Always run `npx tsc --noEmit`, `npm run lint`, and `npm run build` after changes. Lint has ~16 accepted pre-existing warnings; new code must not add errors.
