# Clinic Operations Administrator Manual

This manual provides functional guidelines for clinic owners, front-desk receptionists, and system super-admins.

---

## 1. Clinic Owner Handbook

As a clinic owner, you manage the operational center of your healthcare workspace.
* **Onboarding & verification**: Submit registration certificates, licensing numbers, and doctor names.
* **Clinic settings configurations**: Go to the **Profile** settings tab to change:
  - Timezone & default language.
  - Consultation slot averages (used to calculate patient estimated wait times).
  - Walk-in booking options and emergency priority queue rules.

---

## 2. Front-Desk Receptionist Guide

Receptionists manage lobby workflows and live queue tracking:
* **Add walk-in patients**: Go to the Dashboard and click **Join Queue** to check in offline walk-ins.
* **Ticket management**:
  - Click **Call Next** to call the next waiting patient in sequence.
  - Click **Start consultation** when the patient enters the doctor chamber.
  - Click **Mark check-out** once the doctor finishes the consultation.
  - Transfer tickets between doctors when necessary.

---

## 3. Platform Super Admin Manual

Super Admins govern the overall multi-tenant platform:
* **Clinics directory**: Monitor clinic registration verification requests (Approve, Reject, or Suspend accounts).
* **Feature flags**: Enable/disable optional platform modules (analytics hubs, QR check-ins, email/SMS services) instantly without code changes or server deployments.
* **Audit log history**: Review platform-wide changes to identify operator anomalies.
* **Platform backups**: Trigger manual database backups from the settings panel.
