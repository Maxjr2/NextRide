import request from 'supertest';
import { buildTestApp, tokens } from './helpers';

describe('Users routes', () => {
  it('GET /users/me returns the authenticated user', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(200);
    expect(res.body.data.externalId).toBe('pilot-001');
    expect(res.body.data.role).toBe('pilot');
  });

  it('PATCH /users/me updates own display name', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokens.pilot}`)
      .send({ displayName: 'Martin K. (updated)' });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Martin K. (updated)');
  });

  it('PATCH /users/me updates notification channels', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({ notificationChannels: ['email', 'push'] });

    expect(res.status).toBe(200);
    expect(res.body.data.notificationChannels).toEqual(['email', 'push']);
  });

  it('PATCH /users/me returns 400 for invalid notification channel', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${tokens.rider}`)
      .send({ notificationChannels: ['telegram'] }); // invalid

    expect(res.status).toBe(400);
    expect(typeof res.body.error?.code).toBe('string');
    expect(typeof res.body.error?.message).toBe('string');
  });

  it('GET /users returns 403 for non-coordinators', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${tokens.pilot}`);

    expect(res.status).toBe(403);
  });

  it('GET /users returns all users for coordinators', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${tokens.coordinator}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('mock auth: role shortcuts work', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer role:coordinator');

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('coordinator');
  });

  it('mock auth: unknown token auto-creates a rider', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer brand-new-token-xyz');

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('rider');
    expect(res.body.data.externalId).toBe('brand-new-token-xyz');
  });
});
