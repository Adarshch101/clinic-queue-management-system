# Production Deployment Checklist

Verify all checklist items before launching the Clinic Queue Management Platform live:

---

## 1. Domain & Networking Configurations
- [ ] Configure custom subdomain routing mapping DNS CNAME records to frontend deployment nodes.
- [ ] Verify that all client-to-server traffic is forced over HTTPS/SSL.
- [ ] Ensure CORS limits only trust trusted clinic portals and dashboard assets.

---

## 2. Platform Security Configurations
- [ ] Ensure default environment database credentials (`DATABASE_URL`) use secure usernames/passwords.
- [ ] Obfuscate outbound SMTP credentials and Twilio SID tokens.
- [ ] Verify that API rate limiters are active on sensitive routes (Login, Register, Join Queue).
- [ ] Check that security response headers (`X-Frame-Options`, `X-Content-Type-Options`) are active in `next.config.ts`.
- [ ] Set a strong `SESSION_SECRET` in production (the session cookie is HMAC-signed with it).
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set as a **server-only** env var (never `NEXT_PUBLIC_*`) so the browser bundle never receives a key that bypasses RLS.
- [ ] No passwordless login fallback exists (removed); Supabase is the only auth provider.
- [x] Medical uploads are stored with UploadThing (ACL set via `UPLOADTHING_ACL`; default `private`, `public-read` on free-tier apps that disallow private files) and served only via authenticated, role/clinic-checked endpoints that stream bytes back through short-lived signed URLs. The raw CDN URL is never returned to clients.
- [ ] In the UploadThing dashboard, set the app ACL to private (paid plans) or confirm `UPLOADTHING_ACL=public-read` matches the app default.
- [ ] Spot-check RBAC: a RECEPTIONIST cannot call `/api/reports`, `/api/admin/*`, or `/api/super-admin/*`; a DOCTOR cannot reorder/transfer/cancel queue tokens; a clinic admin from clinic A cannot read clinic B data.
- [ ] Spot-check Super Admin governance: only `SUPER_ADMIN` can delete users/clinics, change roles, or send warnings/appreciations; all such actions appear in the audit log and user deletion also revokes the Supabase Auth account.
- [ ] Verify the audit endpoint cannot be forged by clients (actor is derived from the session server-side).

---

## 3. Integrations & Notifications
- [ ] Run email connection test to verify that SMTP servers dispatch notifications successfully.
- [ ] Validate outbound Twilio SMS template patterns.
- [ ] Confirm Google Maps API keys are active for clinic address geocoding.

---

## 4. Backups & Monitoring
- [ ] Trigger database backup from the Super Admin panel to verify the pipeline is working.
- [ ] Verify that daily automated database dumps upload to S3 buckets.
- [ ] Set up error tracking (e.g. Sentry) and uptime checks.
