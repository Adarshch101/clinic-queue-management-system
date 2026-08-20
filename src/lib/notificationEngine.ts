import { prisma } from './prisma';
import nodemailer from 'nodemailer';

// Supported delivery channels
export type DeliveryChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'BROWSER';

// --- Real provider implementations ---
// EMAIL uses SMTP (nodemailer). SMS/WHATSAPP/BROWSER use configurable webhooks.
// Each provider throws a descriptive error when it is not configured.

let cachedTransporter: ReturnType<typeof createTransporter> | null = null;

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email not configured: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

export const emailProvider = {
  send: async (to: string, subject: string, htmlBody: string): Promise<boolean> => {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Q-Clinix <no-reply@qclinix.com>',
      to,
      subject,
      html: htmlBody,
    });
    return true;
  }
};

async function postWebhook(url: string | undefined, payload: Record<string, unknown>, label: string): Promise<void> {
  if (!url) {
    throw new Error(`${label} not configured: set the corresponding webhook URL`);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`${label} gateway returned HTTP ${res.status}`);
  }
}

export const smsProvider = {
  send: async (phone: string, message: string): Promise<boolean> => {
    await postWebhook(process.env.SMS_WEBHOOK_URL, { to: phone, message }, 'SMS');
    return true;
  }
};

export const whatsappProvider = {
  send: async (phone: string, templateName: string, parameters: string[]): Promise<boolean> => {
    await postWebhook(
      process.env.WHATSAPP_WEBHOOK_URL,
      { to: phone, template: templateName, parameters },
      'WhatsApp'
    );
    return true;
  }
};

export const browserPushProvider = {
  send: async (userId: string, title: string, body: string): Promise<boolean> => {
    await postWebhook(
      process.env.BROWSER_PUSH_WEBHOOK_URL,
      { userId, title, body },
      'Browser push'
    );
    return true;
  }
};

// Centralized Notification Engine
export class NotificationEngine {
  // 1. Dispatch dynamic business events
  static async dispatchEvent(eventType: string, payload: Record<string, unknown>) {
    console.log(`[NOTIFICATION ENGINE] Dispatching Event: ${eventType}`);

    // Save event to ledger
    const event = await prisma.notificationEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(payload),
        processed: false
      }
    });

    // Run processing asynchronously
    this.processEvent(event.id).catch(err => {
      console.error(`Error processing notification event ${event.id}:`, err);
    });

    return event;
  }

  // 2. Process specific notification events
  static async processEvent(eventId: string) {
    const event = await prisma.notificationEvent.findUnique({
      where: { id: eventId }
    });

    if (!event || event.processed) return;

    const payload = JSON.parse(event.payload);
    const eventType = event.eventType;

    // Determine target recipients & formulate notification bodies
    let recipients: Array<{ id: string; email: string; phone?: string }> = [];
    let title = '';
    let bodyTemplate = '';
    let subject = '';

    // Map business events to templates & recipients
    switch (eventType) {
      case 'PATIENT_JOINED_QUEUE':
        recipients = [{ id: payload.patientId || 'anonymous', email: payload.patientEmail || '', phone: payload.patientPhone }];
        title = 'Successfully Joined Waitlist';
        bodyTemplate = `Hello {{patientName}}, your token is {{tokenNumber}}. There are {{patientsAhead}} patients ahead of you. Expected wait: {{estimatedWait}} mins.`;
        subject = 'Queue Waiting Token Slip';
        break;

      case 'PATIENT_CALLED':
        recipients = [{ id: payload.patientId || 'anonymous', email: payload.patientEmail || '', phone: payload.patientPhone }];
        title = 'It is Your Turn!';
        bodyTemplate = `Token {{tokenNumber}}: Please proceed to {{roomNumber}} with Dr. {{doctorName}}.`;
        subject = 'Lobby Call Alert';
        break;

      case 'QUEUE_PAUSED':
        recipients = payload.patients || [];
        title = 'Doctor Queue Paused';
        bodyTemplate = `The waiting queue for Dr. {{doctorName}} is temporarily paused. We will notify you when it resumes.`;
        subject = 'Queue Status Update';
        break;

      case 'CLINIC_APPROVED':
        recipients = [{ id: payload.ownerId, email: payload.email }];
        title = 'Clinic Registration Approved';
        bodyTemplate = `Congratulations, your clinic {{clinicName}} has been successfully verified! You can now log into your operational dashboard.`;
        subject = 'Welcome to Q-Clinix - Clinic Approved';
        break;

      case 'CLINIC_REJECTED':
        recipients = [{ id: payload.ownerId, email: payload.email }];
        title = 'Clinic Application Rejected';
        bodyTemplate = `Your clinic application has been rejected. Reason: {{reason}}. Please correct details and resubmit.`;
        subject = 'Clinic Verification Notice';
        break;

      case 'STAFF_INVITED':
        recipients = [{ id: payload.staffId, email: payload.email }];
        title = 'You Are Invited!';
        bodyTemplate = `You have been invited to join {{clinicName}} as a {{role}}. Link: {{inviteLink}}`;
        subject = 'Clinic Staff Invitation';
        break;

      case 'SECURITY_ALERT':
        recipients = [{ id: payload.userId, email: payload.email }];
        title = 'Security Alert - Action Detected';
        bodyTemplate = `Warning: {{details}} detected on your account at {{time}}. If this was not you, reset your password.`;
        subject = 'Account Security Notice';
        break;

      case 'SUPER_ADMIN_MESSAGE':
        recipients = [{ id: payload.userId, email: payload.email || '' }];
        title = payload.title || 'Message from Platform Administrator';
        bodyTemplate = payload.message || '';
        subject = title;
        break;

      default:
        console.log(`[NOTIFICATION ENGINE] Unknown event type: ${eventType}`);
        return;
    }

    // Process notification delivery for each recipient
    for (const recipient of recipients) {
      // 1. Fetch preferences (Fallback to default if not set)
      let pref = await prisma.notificationPreference.findUnique({
        where: { userId: recipient.id }
      });

      if (!pref) {
        pref = await prisma.notificationPreference.create({
          data: {
            userId: recipient.id,
            emailEnabled: true,
            smsEnabled: false,
            whatsappEnabled: false,
            browserEnabled: true,
            pushEnabled: false
          }
        });
      }

      // 2. Render Template placeholders
      const renderedBody = this.renderTemplate(bodyTemplate, payload);

      // 3. Dispatch to enabled channels
      const channelsToDeliver: DeliveryChannel[] = ['IN_APP'];
      if (pref.emailEnabled && recipient.email) channelsToDeliver.push('EMAIL');
      if (pref.smsEnabled && recipient.phone) channelsToDeliver.push('SMS');
      if (pref.whatsappEnabled && recipient.phone) channelsToDeliver.push('WHATSAPP');
      if (pref.browserEnabled) channelsToDeliver.push('BROWSER');

      for (const channel of channelsToDeliver) {
        await this.deliver(recipient.id, channel, title, renderedBody, subject, recipient.email, recipient.phone, eventType);
      }
    }

    // Mark event as processed
    await prisma.notificationEvent.update({
      where: { id: eventId },
      data: { processed: true }
    });
  }

  // Helper template string interpolator
  private static renderTemplate(template: string, data: Record<string, unknown>): string {
    let rendered = template;
    for (const key of Object.keys(data)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), (data[key] as string) || '');
    }
    return rendered;
  }

  // 3. Deliver notification over specific channel & log, with one real inline retry
  private static async deliver(
    recipientId: string,
    channel: DeliveryChannel,
    title: string,
    body: string,
    subject?: string,
    email?: string,
    phone?: string,
    eventType?: string
  ) {
    // Create Delivery Log
    const log = await prisma.deliveryLog.create({
      data: {
        recipientId,
        channel,
        status: 'RETRYING',
        retryCount: 0
      }
    });

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="font-weight: 800; font-size: 20px; color: #3b82f6; margin-bottom: 20px;">Q-Clinix Platform</div>
        <div style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 12px;">${title}</div>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">${body}</p>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8;">
          This is a central automated notification message from Q-Clinix. Support: support@qclinix.com
        </div>
      </div>
    `;

    // Attempt the real delivery, then retry once with the in-scope payload
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let deliverySuccess = false;

        if (channel === 'IN_APP') {
          await prisma.notification.create({
            data: {
              recipientUserId: recipientId,
              title,
              body,
              channel: 'PUSH',
              isRead: false
            }
          });
          deliverySuccess = true;
        } else if (channel === 'EMAIL' && email) {
          deliverySuccess = await emailProvider.send(email, subject || title, emailHtml);
        } else if (channel === 'SMS' && phone) {
          deliverySuccess = await smsProvider.send(phone, body);
        } else if (channel === 'WHATSAPP' && phone) {
          deliverySuccess = await whatsappProvider.send(phone, eventType || 'QUEUE_ALERT', [body]);
        } else if (channel === 'BROWSER') {
          deliverySuccess = await browserPushProvider.send(recipientId, title, body);
        }

        if (!deliverySuccess) {
          throw new Error('Provider returned false status');
        }

        await prisma.deliveryLog.update({
          where: { id: log.id },
          data: { status: 'SENT' }
        });
        return;
      } catch (error) {
        const isRetry = attempt === 1;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[NOTIFICATION DELIVERY ${isRetry ? 'RETRY ' : ''}FAIL] Channel: ${channel} | Recipient: ${recipientId} | Error: ${errorMessage}`
        );

        if (isRetry) {
          // Final attempt failed — record permanent failure with the real reason
          await prisma.deliveryLog.update({
            where: { id: log.id },
            data: {
              status: 'FAILED',
              retryCount: { increment: 1 },
              failureReason: errorMessage
            }
          });
        } else {
          // Mark retrying before the second real attempt
          await prisma.deliveryLog.update({
            where: { id: log.id },
            data: {
              status: 'RETRYING',
              retryCount: { increment: 1 }
            }
          });
        }
      }
    }
  }
}