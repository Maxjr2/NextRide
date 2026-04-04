import { logger } from '../config/logger';
import type { INotificationService, RideNotificationPayload } from './INotificationService';

/**
 * Mock notification service: logs to console instead of sending real messages.
 * Used in MOCK_MODE and as a safe no-op fallback when SMTP isn't configured.
 */
export class MockNotificationService implements INotificationService {
  async notifyMatchProposed({ match, pilot, rider }: RideNotificationPayload): Promise<void> {
    logger.info(
      { matchId: match.id, pilotId: pilot.id, riderId: rider.id },
      '[MOCK] Notification: match proposed',
    );
  }

  async notifyMatchConfirmed({ match, pilot, rider }: RideNotificationPayload): Promise<void> {
    logger.info(
      { matchId: match.id, pilotId: pilot.id, riderId: rider.id },
      '[MOCK] Notification: match confirmed',
    );
  }

  async notifyMatchCancelled({
    match,
    pilot,
    rider,
    reason,
  }: RideNotificationPayload & { reason?: string }): Promise<void> {
    logger.info(
      { matchId: match.id, pilotId: pilot.id, riderId: rider.id, reason },
      '[MOCK] Notification: match cancelled',
    );
  }

  async notifyRideReminder({ match, pilot, rider }: RideNotificationPayload): Promise<void> {
    logger.info(
      { matchId: match.id, pilotId: pilot.id, riderId: rider.id },
      '[MOCK] Notification: ride reminder',
    );
  }
}
