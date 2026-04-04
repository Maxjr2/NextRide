import { buildTestContainer } from './helpers';

async function createOpenPair(container: ReturnType<typeof buildTestContainer>['container']) {
  const offer = await container.services.posts.create('user-pilot-001', 'pilot', {
    type: 'offer',
    vehicleId: 'veh-elle',
    neighborhood: 'Bilk',
    passengerCount: 1,
  });
  const request = await container.services.posts.create('user-rider-001', 'rider', {
    type: 'request',
    neighborhood: 'Bilk',
    passengerCount: 1,
  });
  return { offer, request };
}

describe('MatchService', () => {
  describe('propose', () => {
    it('coordinator can propose a match between an offer and a request', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);

      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      expect(match.status).toBe('proposed');
      expect(match.offerId).toBe(offer.id);
      expect(match.requestId).toBe(request.id);
    });

    it('marks both posts as matched after proposal', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);

      await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      const updatedOffer = await container.services.posts.getById(offer.id);
      const updatedRequest = await container.services.posts.getById(request.id);
      expect(updatedOffer.status).toBe('matched');
      expect(updatedRequest.status).toBe('matched');
    });

    it('throws 404 when offer does not exist', async () => {
      const { container } = buildTestContainer();
      const { request } = await createOpenPair(container);
      await expect(
        container.services.matches.propose('user-coord-001', {
          offerId: 'nonexistent',
          requestId: request.id,
        }),
      ).rejects.toMatchObject({ status: 404, code: 'OFFER_NOT_FOUND' });
    });

    it('throws 400 when IDs are swapped (offer used as request)', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      await expect(
        container.services.matches.propose('user-coord-001', {
          offerId: request.id, // wrong
          requestId: offer.id,
        }),
      ).rejects.toMatchObject({ status: 400, code: 'INVALID_OFFER' });
    });

    it('throws 409 when offer is already matched', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const request2 = await container.services.posts.create('user-rider-001', 'rider', {
        type: 'request',
        neighborhood: 'Bilk',
        passengerCount: 1,
      });

      // First match succeeds
      await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      // Second attempt on the same offer should fail
      await expect(
        container.services.matches.propose('user-coord-001', {
          offerId: offer.id,
          requestId: request2.id,
        }),
      ).rejects.toMatchObject({ status: 409, code: 'OFFER_NOT_OPEN' });
    });
  });

  describe('confirmSide', () => {
    it('remains proposed after only one side confirms', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      const updated = await container.services.matches.confirmSide(
        match.id,
        'user-pilot-001',
        'pilot',
      );
      const partialMatch = updated as import('@nextride/shared').Match;
      expect(partialMatch.status).toBe('proposed');
      expect(partialMatch.pilotConfirmed).toBe(true);
    });

    it('transitions to confirmed when both sides confirm', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      await container.services.matches.confirmSide(match.id, 'user-pilot-001', 'pilot');
      const confirmed = await container.services.matches.confirmSide(
        match.id,
        'user-rider-001',
        'rider',
      );

      expect((confirmed as any).status).toBe('confirmed');
      const updatedOffer = await container.services.posts.getById(offer.id);
      const updatedRequest = await container.services.posts.getById(request.id);
      expect(updatedOffer.status).toBe('confirmed');
      expect(updatedRequest.status).toBe('confirmed');
    });

    it('throws 403 when a non-participant tries to confirm', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      await expect(
        container.services.matches.confirmSide(match.id, 'user-facility-001', 'facility'),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('cancel', () => {
    it('participant can cancel a proposed match', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      const cancelled = await container.services.matches.cancel(
        match.id,
        'user-pilot-001',
        'pilot',
        'Terminkonflikt',
      );

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancellationReason).toBe('Terminkonflikt');
    });

    it('reverts posts to open after cancellation', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      await container.services.matches.cancel(match.id, 'user-coord-001', 'coordinator');

      const revertedOffer = await container.services.posts.getById(offer.id);
      const revertedRequest = await container.services.posts.getById(request.id);
      expect(revertedOffer.status).toBe('open');
      expect(revertedRequest.status).toBe('open');
    });

    it('throws 403 when non-participant tries to cancel', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      await expect(
        container.services.matches.cancel(match.id, 'user-facility-001', 'facility'),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('complete', () => {
    it('pilot can complete a confirmed match', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      await container.services.matches.confirmSide(match.id, 'user-pilot-001', 'pilot');
      await container.services.matches.confirmSide(match.id, 'user-rider-001', 'rider');

      const completed = await container.services.matches.complete(
        match.id,
        'user-pilot-001',
        'pilot',
      );
      expect(completed.status).toBe('completed');
      const completedOffer = await container.services.posts.getById(offer.id);
      const completedRequest = await container.services.posts.getById(request.id);
      expect(completedOffer.status).toBe('completed');
      expect(completedRequest.status).toBe('completed');
    });

    it('throws 409 when trying to complete a proposed (not yet confirmed) match', async () => {
      const { container } = buildTestContainer();
      const { offer, request } = await createOpenPair(container);
      const match = await container.services.matches.propose('user-coord-001', {
        offerId: offer.id,
        requestId: request.id,
      });

      await expect(
        container.services.matches.complete(match.id, 'user-pilot-001', 'pilot'),
      ).rejects.toMatchObject({ status: 409, code: 'MATCH_NOT_CONFIRMED' });
    });
  });
});
