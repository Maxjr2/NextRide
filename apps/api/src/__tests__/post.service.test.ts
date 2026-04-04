import { buildTestContainer } from './helpers';

describe('PostService', () => {
  describe('list', () => {
    it('returns open posts by default (excludes cancelled)', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.list({ page: 1, pageSize: 20 });
      expect(result.total).toBeGreaterThan(0);
      result.items.forEach((p) => expect(p.status).not.toBe('cancelled'));
    });

    it('filters by type=offer', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.list({ type: 'offer', page: 1, pageSize: 20 });
      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((p) => expect(p.type).toBe('offer'));
    });

    it('filters by type=request', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.list({ type: 'request', page: 1, pageSize: 20 });
      result.items.forEach((p) => expect(p.type).toBe('request'));
    });

    it('filters by neighborhood (case-insensitive)', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.list({
        neighborhood: 'wersten',
        page: 1,
        pageSize: 20,
      });
      result.items.forEach((p) =>
        expect(p.neighborhood.toLowerCase()).toContain('wersten'),
      );
    });

    it('paginates correctly', async () => {
      const { container } = buildTestContainer();
      const page1 = await container.services.posts.list({ page: 1, pageSize: 2 });
      const page2 = await container.services.posts.list({ page: 2, pageSize: 2 });
      expect(page1.items.length).toBe(2);
      if (page2.total > 2) {
        expect(page1.items[0].id).not.toBe(page2.items[0]?.id);
      }
    });
  });

  describe('getById', () => {
    it('returns a post with enriched author info', async () => {
      const { container } = buildTestContainer();
      const post = await container.services.posts.getById('post-offer-001');
      expect(post.id).toBe('post-offer-001');
      expect(post.author).toBeDefined();
      expect(post.author.displayName).toBeTruthy();
    });

    it('throws 404 for unknown ID', async () => {
      const { container } = buildTestContainer();
      await expect(container.services.posts.getById('nonexistent')).rejects.toMatchObject({
        status: 404,
        code: 'POST_NOT_FOUND',
      });
    });
  });

  describe('create', () => {
    it('pilot can create an offer', async () => {
      const { container } = buildTestContainer();
      const post = await container.services.posts.create('user-pilot-001', {
        type: 'offer',
        vehicleId: 'veh-lotte',
        neighborhood: 'Unterbilk',
        passengerCount: 1,
      });
      expect(post.type).toBe('offer');
      expect(post.status).toBe('open');
      expect(post.neighborhood).toBe('Unterbilk');
      expect(post.authorId).toBe('user-pilot-001');
    });

    it('rider can create a request', async () => {
      const { container } = buildTestContainer();
      const post = await container.services.posts.create('user-rider-001', {
        type: 'request',
        neighborhood: 'Flingern',
        passengerCount: 1,
        accessibilityNotes: 'Rollstuhl',
      });
      expect(post.type).toBe('request');
      expect(post.status).toBe('open');
    });

    it('throws 403 when pilot tries to use a vehicle they do not own', async () => {
      const { container } = buildTestContainer();
      await expect(
        container.services.posts.create('user-rider-001', {
          type: 'offer',
          vehicleId: 'veh-lotte', // owned by user-pilot-001
          neighborhood: 'Flingern',
          passengerCount: 1,
        }),
      ).rejects.toMatchObject({ status: 403, code: 'VEHICLE_NOT_OWNED' });
    });

    it('throws 400 when vehicleId does not exist', async () => {
      const { container } = buildTestContainer();
      await expect(
        container.services.posts.create('user-pilot-001', {
          type: 'offer',
          vehicleId: 'nonexistent-vehicle',
          neighborhood: 'Flingern',
          passengerCount: 1,
        }),
      ).rejects.toMatchObject({ status: 400, code: 'VEHICLE_NOT_FOUND' });
    });
  });

  describe('cancel', () => {
    it('author can cancel their own post', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.cancel(
        'post-offer-001',
        'user-pilot-001',
        'pilot',
      );
      expect(result.status).toBe('cancelled');
    });

    it('coordinator can cancel any post', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.cancel(
        'post-request-001',
        'user-coord-001',
        'coordinator',
      );
      expect(result.status).toBe('cancelled');
    });

    it('non-author rider cannot cancel another user\'s post', async () => {
      const { container } = buildTestContainer();
      await expect(
        container.services.posts.cancel('post-offer-001', 'user-rider-001', 'rider'),
      ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    });
  });

  describe('update', () => {
    it('author can update their post', async () => {
      const { container } = buildTestContainer();
      const result = await container.services.posts.update(
        'post-offer-001',
        'user-pilot-001',
        'pilot',
        { neighborhood: 'Oberbilk' },
      );
      expect(result.neighborhood).toBe('Oberbilk');
    });

    it('throws 403 when non-author tries to update', async () => {
      const { container } = buildTestContainer();
      await expect(
        container.services.posts.update('post-offer-001', 'user-rider-001', 'rider', {
          neighborhood: 'Bilk',
        }),
      ).rejects.toMatchObject({ status: 403 });
    });
  });
});
