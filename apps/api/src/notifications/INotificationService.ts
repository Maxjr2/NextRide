import type { User, Match } from '@nextride/shared';

export interface RideNotificationPayload {
  match: Match;
  pilot: User;
  rider: User;
}

export interface INotificationService {
  /** Notify relevant parties when a match is proposed by a coordinator. */
  notifyMatchProposed(payload: RideNotificationPayload): Promise<void>;

  /** Notify when both sides have confirmed and the ride is locked in. */
  notifyMatchConfirmed(payload: RideNotificationPayload): Promise<void>;

  /** Notify when a match is cancelled. */
  notifyMatchCancelled(payload: RideNotificationPayload & { reason?: string }): Promise<void>;

  /** Reminder sent the day before a scheduled ride. */
  notifyRideReminder(payload: RideNotificationPayload): Promise<void>;

  // TODO: Add notifyPostExpired() for offers/requests that pass their date
  // without being matched, so authors are prompted to repost or cancel.

  // TODO: Add a push notification channel (Web Push / FCM) and wire it into
  // implementations alongside email and SMS. The User.notificationChannels
  // field already reserves a 'push' value for this purpose.
}
