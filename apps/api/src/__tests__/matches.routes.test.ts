import request from 'supertest';
import { buildTestApp, tokens } from './helpers';

async function setupProposedMatch(app: Express.Application) {
  // Create fresh offer
  const offerRes = await request(app)
    .post('/api/v1/posts')
    .set('Authorization', `Bearer ${tokens.pilot}`)
    .send({ type: 'offer', vehicleId: 'veh-elle', neighborhood: 'Bilk', passengerCount: 1 });

  // Create fresh request
  const reqRes = await request(app)
    .post('/api/v1/posts')
    .set('Authorization', `Bearer ${tokens.rider}`)
    .send({ type: 'request', neighborhood: 'Bilk', passengerCount: 1 });

  // Propose match
  const matchRes = await request(app)
    .post('/api/v1/matches')
    .set('Authorization', `Bearer ${tokens.coordinator}`)
    .send({ offerId: offerRes.body.data.id, requestId: reqRes.body.data.id });

  return { match: matchRes.body.data, offer: offerRes.body.data, requestPost: reqRes.body.data };
}

// Supertest needs the Express app type
type Express = { Application: import('express').Application };

describe('Matches routes', () => {
  it('GET /matches returns empty list initially', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/matches')
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(0);
  });

  it('POST /matches creates a proposed match (coordinator only)', async () => {
    const { app } = buildTestApp();
    const { match } = await setupProposedMatch(app as any);

    expect(match.status).toBe('proposed');
    expect(match.offer).toBeDefined();
    expect(match.request).toBeDefined();
  });

  it('POST /matches returns 403 for non-coordinators', async () => {
    const { app } = buildTestApp();
    const offerRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({ type: 'offer', vehicleId: 'veh-elle', neighborhood: 'Bilk', passengerCount: 1 });
    const reqRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({ type: 'request', neighborhood: 'Bilk', passengerCount: 1 });

    const res = await request(app)
      .post('/api/v1/matches')
      .set('Authorization', `Bearer ${tokens.pilot}`) // not coordinator
      .send({ offerId: offerRes.body.data.id, requestId: reqRes.body.data.id });

    expect(res.status).toBe(403);
  });

  it('GET /matches/:id returns match with embedded posts', async () => {
    const { app } = buildTestApp();
    const { match } = await setupProposedMatch(app as any);

    const res = await request(app)
      .get(`/api/v1/matches/${match.id}`)
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(200);
    expect(res.body.data.offer.author).toBeDefined();
    expect(res.body.data.request.author).toBeDefined();
  });

  it('POST /matches/:id/confirm confirms pilot side', async () => {
    const { app } = buildTestApp();
    const { match } = await setupProposedMatch(app as any);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/confirm`)
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pilotConfirmed).toBe(true);
  });

  it('POST /matches/:id/confirm transitions to confirmed when both sides confirm', async () => {
    const { app } = buildTestApp();
    const { match } = await setupProposedMatch(app as any);

    await request(app)
      .post(`/api/v1/matches/${match.id}/confirm`)
      .set('Authorization', `Bearer ${tokens.pilot}`);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/confirm`)
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('POST /matches/:id/cancel cancels the match with a reason', async () => {
    const { app } = buildTestApp();
    const { match } = await setupProposedMatch(app as any);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/cancel`)
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({ reason: 'Krankheitsfall' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.cancellationReason).toBe('Krankheitsfall');
  });

  it('POST /matches/:id/complete marks match as completed', async () => {
    const { app } = buildTestApp();
    const { match } = await setupProposedMatch(app as any);

    // Both sides confirm first
    await request(app)
      .post(`/api/v1/matches/${match.id}/confirm`)
      .set('Authorization', `Bearer ${tokens.pilot}`);
    await request(app)
      .post(`/api/v1/matches/${match.id}/confirm`)
      .set('Authorization', `Bearer ${tokens.rider}`);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/complete`)
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });
});
