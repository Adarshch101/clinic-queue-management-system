# Disaster Recovery and Database Backup Protocol

This document outlines backup, restore, incident response, and service rollback procedures.

---

## 1. Database Backup Procedures

### Manual SQL Dumps
To execute a manual database backup, use the `pg_dump` utility. Run the following command:
```bash
pg_dump -U postgres -h localhost -d postgres -F c -b -v -f "/backups/db_dump_$(date +%Y%m%d_%H%M%S).dump"
```

### Automated Backups Strategy
Set up a daily cron job on your cloud server (e.g. AWS EC2 or DigitalOcean Droplet) to automatically run and upload backups to AWS S3:
```bash
#!/bin/bash
BACKUP_NAME="db_backup_$(date +%F).dump"
pg_dump $DATABASE_URL -F c -f /tmp/$BACKUP_NAME
aws s3 cp /tmp/$BACKUP_NAME s3://my-clinic-queue-backups/database/
rm /tmp/$BACKUP_NAME
```

---

## 2. Restore Procedures

In the event of database failure or corrupted states, recover the database using `pg_restore`:

1. **Clear current schema:**
   ```bash
   dropdb -U postgres -h localhost postgres
   createdb -U postgres -h localhost postgres
   ```
2. **Execute restoration:**
   ```bash
   pg_restore -U postgres -h localhost -d postgres -v "/backups/db_dump_target_filename.dump"
   ```

---

## 3. Incident Response & Rollbacks

- **Unhealthy server (404/500 loops)**: Check health endpoint logs. If a bad release was pushed, trigger deployment rollback via Git tag resets:
  ```bash
  git tag -d v1.2.0
  git push --delete origin v1.2.0
  # Re-push previous stable tag
  ```
- **Database lockup**: Scale down connection pool variables, run `VACUUM ANALYZE;` on high read-write tables (`QueueToken`), and review logs using the Security Audits panel.
