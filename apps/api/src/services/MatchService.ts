import type { Match, MatchWithPosts } from '@nextride/shared';
import type {
  IMatchRepository,
  IPostRepository,
  IUserRepository,
  PagedResult,
} from '../repositories/interfaces';
import type { INotificationService } from '../notifications/INotificationService';
import type { CreateMatchInput, UpdateMatchInput, ListMatchesQuery } from '@nextride/shared';
import { AppError } from '../middleware/AppError';

export class MatchService {
  constructor(
    private matches: IMatchRepository,
    private posts: IPostRepository,
    private users: IUserRepository,
    private notifications: INotificationService,
  ) {}

  async list(query: ListMatchesQuery): Promise<PagedResult<MatchWithPosts>> {
    return this.matches.list(query);
  }

  async getById(id: string): Promise<MatchWithPosts> {
    const match = await this.matches.findById(id);
    if (!match) throw new AppError(404, 'MATCH_NOT_FOUND', 'Match not found');
    return match;
  }

  /**
   * Propose a match between an offer and a request.
   * Only coordinators may propose matches.
   */
  async propose(proposedById: string, data: CreateMatchInput): Promise<MatchWithPosts> {
    const [offer, request] = await Promise.all([
      this.posts.findById(data.offerId),
      this.posts.findById(data.requestId),
    ]);

    if (!offer) throw new AppError(404, 'OFFER_NOT_FOUND', 'Offer post not found');
    if (!request) throw new AppError(404, 'REQUEST_NOT_FOUND', 'Request post not found');
    if (offer.type !== 'offer') throw new AppError(400, 'INVALID_OFFER', 'offerId must reference an offer post');
    if (request.type !== 'request') throw new AppError(400, 'INVALID_REQUEST', 'requestId must reference a request post');
    if (offer.status !== 'open') throw new AppError(409, 'OFFER_NOT_OPEN', 'Offer is not open');
    if (request.status !== 'open') throw new AppError(409, 'REQUEST_NOT_OPEN', 'Request is not open');

    let match = await this.matches.create(proposedById, data);
    try {
      await Promise.all([
        this.posts.updateStatus(data.offerId, 'matched'),
        this.posts.updateStatus(data.requestId, 'matched'),
      ]);
    } catch (error) {
      // Best-effort compensation when repositories do not support cross-entity transactions.
      await Promise.allSettled([
        this.matches.update(match.id, { status: 'cancelled', cancellationReason: 'Proposal rollback' }),
        this.posts.updateStatus(data.offerId, 'open'),
        this.posts.updateStatus(data.requestId, 'open'),
      ]);
      throw error;
    }

    const canonicalMatch = await this.matches.findById(match.id);
    if (!canonicalMatch) throw new AppError(500, 'MATCH_NOT_FOUND', 'Match disappeared after creation');
    const canonicalOffer = await this.posts.findById(data.offerId);
    const canonicalRequest = await this.posts.findById(data.requestId);
    if (!canonicalOffer || !canonicalRequest) {
      throw new AppError(500, 'POST_NOT_FOUND', 'Linked posts missing after match creation');
    }

    // Notify pilot and rider
    const pilot = await this.users.findById(canonicalOffer.authorId);
    const rider = await this.users.findById(canonicalRequest.authorId);
    if (pilot && rider) {
      await this.notifications.notifyMatchProposed({ match: canonicalMatch, pilot, rider });
    }

    return canonicalMatch;
  }

  /**
   * Confirm one side of the match (pilot or rider).
   * When both sides confirm, the match transitions to 'confirmed'.
   */
  async confirmSide(
    matchId: string,
    userId: string,
    role: string,
  ): Promise<Match | MatchWithPosts> {
    const match = await this.matches.findById(matchId);
    if (!match) throw new AppError(404, 'MATCH_NOT_FOUND', 'Match not found');
    if (match.status !== 'proposed') {
      throw new AppError(409, 'MATCH_NOT_PROPOSED', 'Match is not in proposed state');
    }

    // Determine if this user is the pilot or the rider
    const isOfferAuthor = match.offer.authorId === userId;
    const isRequestAuthor = match.request.authorId === userId;
    const isCoordinator = role === 'coordinator';

    if (isCoordinator) {
      throw new AppError(403, 'FORBIDDEN', 'Coordinators cannot confirm sides on behalf of participants');
    }

    if (!isOfferAuthor && !isRequestAuthor) {
      throw new AppError(403, 'FORBIDDEN', 'You are not a participant in this match');
    }

    const side: 'pilot' | 'rider' = isOfferAuthor ? 'pilot' : 'rider';
    const updated = await this.matches.confirmSide(matchId, side);

    // If both confirmed, promote to confirmed
    if (updated.pilotConfirmed && updated.riderConfirmed) {
      const confirmed = await this.matches.update(matchId, {
        status: 'confirmed',
        confirmedById: userId,
      });
      await Promise.all([
        this.posts.updateStatus(match.offerId, 'confirmed'),
        this.posts.updateStatus(match.requestId, 'confirmed'),
      ]);

      const pilot = await this.users.findById(match.offer.authorId);
      const rider = await this.users.findById(match.request.authorId);
      if (pilot && rider) {
        await this.notifications.notifyMatchConfirmed({ match: confirmed, pilot, rider });
      }
      return confirmed;
    }

    return updated;
  }

  /**
   * Cancel a match. Coordinator or either participant may cancel.
   * Posts are reverted to 'open' if the match was proposed/confirmed.
   */
  async cancel(
    matchId: string,
    userId: string,
    role: string,
    reason?: string,
  ): Promise<MatchWithPosts> {
    const match = await this.matches.findById(matchId);
    if (!match) throw new AppError(404, 'MATCH_NOT_FOUND', 'Match not found');

    if (match.status === 'completed' || match.status === 'cancelled') {
      throw new AppError(409, 'MATCH_IMMUTABLE', 'Match is already completed or cancelled');
    }

    const isParticipant =
      match.offer.authorId === userId || match.request.authorId === userId;
    if (!isParticipant && role !== 'coordinator') {
      throw new AppError(403, 'FORBIDDEN', 'You are not allowed to cancel this match');
    }

    const cancelled = await this.matches.update(matchId, {
      status: 'cancelled',
      cancellationReason: reason,
    });

    // Revert posts to open
    await Promise.all([
      this.posts.updateStatus(match.offerId, 'open'),
      this.posts.updateStatus(match.requestId, 'open'),
    ]);

    const pilot = await this.users.findById(match.offer.authorId);
    const rider = await this.users.findById(match.request.authorId);
    if (pilot && rider) {
      await this.notifications.notifyMatchCancelled({ match: cancelled, pilot, rider, reason });
    }

    return cancelled;
  }

  /**
   * Mark a match as completed (coordinator only in v1).
   */
  async complete(matchId: string, userId: string, role: string): Promise<MatchWithPosts> {
    if (role !== 'coordinator' && role !== 'pilot') {
      throw new AppError(403, 'FORBIDDEN', 'Only coordinators and pilots can mark rides as completed');
    }

    const match = await this.matches.findById(matchId);
    if (!match) throw new AppError(404, 'MATCH_NOT_FOUND', 'Match not found');
    if (match.status !== 'confirmed') {
      throw new AppError(409, 'MATCH_NOT_CONFIRMED', 'Match must be confirmed before completing');
    }
    if (role === 'pilot' && userId !== match.offer.authorId) {
      throw new AppError(403, 'FORBIDDEN', 'Only the offering pilot can complete this match');
    }

    const completed = await this.matches.update(matchId, { status: 'completed' });

    await Promise.all([
      this.posts.updateStatus(match.offerId, 'completed'),
      this.posts.updateStatus(match.requestId, 'completed'),
    ]);

    return completed;
  }
}
