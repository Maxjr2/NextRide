import request from 'supertest';
import { buildTestApp, tokens } from './helpers';

describe('POST /api/v1/posts', () => {
  it('returns 401 without auth token', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/posts');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /posts returns paginated list', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pageSize');
  });

  it('GET /posts filters by type', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/posts?type=offer')
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((p: any) => expect(p.type).toBe('offer'));
  });

  it('GET /posts filters by neighborhood', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/posts?neighborhood=wersten')
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((p: any) =>
      expect(p.neighborhood.toLowerCase()).toContain('wersten'),
    );
  });

  it('POST /posts creates an offer for a pilot', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({
        type: 'offer',
        neighborhood: 'Unterbilk',
        passengerCount: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('offer');
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.neighborhood).toBe('Unterbilk');
  });

  it('POST /posts creates a request for a rider', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({
        type: 'request',
        neighborhood: 'Bilk',
        passengerCount: 1,
        accessibilityNotes: 'Benötigt Rollstuhlzugang',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('request');
    expect(res.body.data.accessibilityNotes).toBe('Benötigt Rollstuhlzugang');
  });

  it('POST /posts returns 400 for missing required fields', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({ type: 'offer' /* missing neighborhood */ });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /posts/:id returns post with author info', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/posts/post-offer-001')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('post-offer-001');
    expect(res.body.data.author).toBeDefined();
    expect(res.body.data.author.displayName).toBeTruthy();
  });

  it('GET /posts/:id returns 404 for unknown ID', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/posts/does-not-exist')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(404);
  });

  it('PATCH /posts/:id updates post fields', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/posts/post-offer-001')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({ routeWish: 'Nur Nebenstraßen bitte' });

    expect(res.status).toBe(200);
    expect(res.body.data.routeWish).toBe('Nur Nebenstraßen bitte');
  });

  it('PATCH /posts/:id returns 403 for non-owner', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/posts/post-offer-001')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({ neighborhood: 'Bilk' });

    expect(res.status).toBe(403);
  });

  it('DELETE /posts/:id cancels the post', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .delete('/api/v1/posts/post-offer-001')
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });
});
