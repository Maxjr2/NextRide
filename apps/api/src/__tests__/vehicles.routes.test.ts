import request from 'supertest';
import { buildTestApp, tokens } from './helpers';

describe('Vehicles routes', () => {
  it('GET /vehicles lists active vehicles', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /vehicles/mine returns only the pilot\'s vehicles', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/vehicles/mine')
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((v: any) => expect(v.pilotId).toBe('user-pilot-001'));
  });

  it('GET /vehicles/mine returns 403 for non-pilots', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/vehicles/mine')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(403);
  });

  it('POST /vehicles creates a vehicle for pilots', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({
        name: 'Neue Rikscha',
        capacity: 2,
        certificationRequired: 'basic',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Neue Rikscha');
    expect(res.body.data.pilotId).toBe('user-pilot-001');
  });

  it('POST /vehicles returns 403 for non-pilots', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({ name: 'Test', capacity: 1, certificationRequired: 'basic' });

    expect(res.status).toBe(403);
  });

  it('GET /vehicles/:id returns vehicle details', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/vehicles/veh-lotte')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Flotte Lotte');
  });

  it('GET /vehicles/:id returns 404 for unknown vehicle', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/vehicles/nonexistent')
      .set('Authorization', `Bearer ${tokens.rider}`);

    expect(res.status).toBe(404);
  });

  it('PATCH /vehicles/:id updates a vehicle', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/vehicles/veh-lotte')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({ description: 'Mit neuem Windschutz' });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Mit neuem Windschutz');
  });

  it('PATCH /vehicles/:id returns 403 for non-owner', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/vehicles/veh-lotte')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({ description: 'Hacked' });

    expect(res.status).toBe(403);
  });
});
