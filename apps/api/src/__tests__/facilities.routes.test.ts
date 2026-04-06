import request from 'supertest';
import { buildTestApp, tokens } from './helpers';

describe('Facilities routes', () => {
  it('GET /facilities returns list for authenticated users', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/facilities')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /facilities returns 401 without auth', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/facilities');
    expect(res.status).toBe(401);
  });

  it('GET /facilities/:id returns a facility', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/facilities/fac-seniorenhaus')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('fac-seniorenhaus');
    expect(res.body.data.name).toBe('Seniorenhaus Am Park');
  });

  it('GET /facilities/:id returns 404 for unknown id', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/facilities/nonexistent')
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(404);
  });

  it('POST /facilities creates a facility (coordinator only)', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/facilities')
      .set('Authorization', `Bearer ${tokens.coordinator}`)
      .send({
        name: 'Test Einrichtung',
        contactName: 'Herr Test',
        contactPhone: '+49 211 000000',
        contactEmail: 'test@einrichtung.de',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Einrichtung');
  });

  it('POST /facilities returns 403 for non-coordinators', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/facilities')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({
        name: 'Sneaky',
        contactName: 'X',
        contactPhone: '+49 0',
        contactEmail: 'x@x.de',
      });

    expect(res.status).toBe(403);
  });

  it('POST /facilities returns 400 for missing required fields', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/facilities')
      .set('Authorization', `Bearer ${tokens.coordinator}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /facilities/:id updates a facility (coordinator only)', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/facilities/fac-seniorenhaus')
      .set('Authorization', `Bearer ${tokens.coordinator}`)
      .send({ contactName: 'Frau Schneider' });

    expect(res.status).toBe(200);
    expect(res.body.data.contactName).toBe('Frau Schneider');
  });

  it('PATCH /facilities/:id returns 403 for non-coordinators', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/facilities/fac-seniorenhaus')
      .set('Authorization', `Bearer ${tokens.facility}`)
      .send({ contactName: 'Hacked' });

    expect(res.status).toBe(403);
  });
});
