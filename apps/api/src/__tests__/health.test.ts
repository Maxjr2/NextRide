import request from 'supertest';
import { buildTestApp } from './helpers';

describe('Health endpoint', () => {
  it('GET /health returns 200 with status ok', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.mockMode).toBe(true);
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 404 for unknown routes', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
