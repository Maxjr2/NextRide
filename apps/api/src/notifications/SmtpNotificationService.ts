import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../config/logger';
import type { INotificationService, RideNotificationPayload } from './INotificationService';
import type { User } from '@nextride/shared';

/**
 * Real notification service using SMTP (via nodemailer).
 * Falls back to mock logging when SMTP is not configured.
 */
export class SmtpNotificationService implements INotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.smtp.host) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        auth: config.smtp.user
          ? { user: config.smtp.user, pass: config.smtp.pass }
          : undefined,
      });
    } else {
      logger.warn('SMTP not configured — email notifications are disabled');
    }
  }

  async notifyMatchProposed({ match, pilot, rider }: RideNotificationPayload): Promise<void> {
    const date = match.offerId; // resolved by caller
    await this.send(pilot.email, 'Fahrtvermittlung vorgeschlagen', this.proposedBody(pilot, rider));
    await this.send(rider.email, 'Fahrtvermittlung vorgeschlagen', this.proposedBody(pilot, rider));
  }

  async notifyMatchConfirmed({ match, pilot, rider }: RideNotificationPayload): Promise<void> {
    await this.send(pilot.email, 'Fahrt bestätigt! 🚲', this.confirmedBody(pilot, rider));
    await this.send(rider.email, 'Ihre Fahrt ist bestätigt! 🚲', this.confirmedBody(pilot, rider));
  }

  async notifyMatchCancelled({
    match,
    pilot,
    rider,
    reason,
  }: RideNotificationPayload & { reason?: string }): Promise<void> {
    const body = `Die Fahrtvermittlung wurde leider abgesagt.${reason ? `\n\nGrund: ${reason}` : ''}`;
    await this.send(pilot.email, 'Fahrt abgesagt', body);
    await this.send(rider.email, 'Fahrt abgesagt', body);
  }

  async notifyRideReminder({ match, pilot, rider }: RideNotificationPayload): Promise<void> {
    await this.send(pilot.email, 'Erinnerung: Fahrt morgen 🚲', this.reminderBody(pilot, rider));
    await this.send(rider.email, 'Erinnerung: Ihre Fahrt ist morgen 🚲', this.reminderBody(pilot, rider));
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      logger.info({ to, subject }, '[EMAIL STUB] Would send email');
      return;
    }
    try {
      await this.transporter.sendMail({ from: config.smtp.from, to, subject, text });
    } catch (err) {
      logger.error({ err, to, subject }, 'Failed to send email');
    }
  }

  private proposedBody(pilot: User, rider: User): string {
    return `Hallo,\n\neine Fahrtvermittlung zwischen Pilot ${pilot.displayName} und Fahrgast wurde vorgeschlagen.\n\nBitte bestätigen Sie die Fahrt in der NextRide-App.\n\nVielen Dank!\nIhr NextRide-Team`;
  }

  private confirmedBody(pilot: User, rider: User): string {
    return `Hallo,\n\ndie Fahrt wurde von beiden Seiten bestätigt. Wir freuen uns auf eine schöne Tour!\n\nVielen Dank!\nIhr NextRide-Team`;
  }

  private reminderBody(pilot: User, rider: User): string {
    return `Hallo,\n\nDies ist eine freundliche Erinnerung: Ihre Fahrt findet morgen statt.\n\nBei Fragen melden Sie sich bitte beim Koordinator.\n\nVielen Dank!\nIhr NextRide-Team`;
  }
}
