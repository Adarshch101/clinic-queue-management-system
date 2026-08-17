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
