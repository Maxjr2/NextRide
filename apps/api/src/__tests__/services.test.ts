import { buildTestContainer } from './helpers';

describe('VehicleService', () => {
  it('listAll returns all active vehicles', async () => {
    const { container } = buildTestContainer();
    const vehicles = await container.services.vehicles.listAll();
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach((v) => expect(v.active).toBe(true));
  });

  it('listByPilot returns only vehicles owned by the pilot', async () => {
    const { container } = buildTestContainer();
    const vehicles = await container.services.vehicles.listByPilot('user-pilot-001');
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach((v) => expect(v.pilotId).toBe('user-pilot-001'));
  });

  it('listByPilot returns empty array for unknown pilot', async () => {
    const { container } = buildTestContainer();
    const vehicles = await container.services.vehicles.listByPilot('nonexistent');
    expect(vehicles).toHaveLength(0);
  });

  it('getById returns a vehicle', async () => {
    const { container } = buildTestContainer();
    const vehicle = await container.services.vehicles.getById('veh-lotte');
    expect(vehicle.id).toBe('veh-lotte');
    expect(vehicle.name).toBe('Flotte Lotte');
  });

  it('getById throws 404 for unknown vehicle', async () => {
    const { container } = buildTestContainer();
    await expect(container.services.vehicles.getById('nope')).rejects.toMatchObject({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
    });
  });

  it('create adds a new vehicle for a pilot', async () => {
    const { container } = buildTestContainer();
    const vehicle = await container.services.vehicles.create('user-pilot-001', {
      name: 'Neue Rikscha',
      capacity: 2,
      certificationRequired: 'basic',
    });
    expect(vehicle.pilotId).toBe('user-pilot-001');
    expect(vehicle.name).toBe('Neue Rikscha');
  });

  it('update changes vehicle properties', async () => {
    const { container } = buildTestContainer();
    const updated = await container.services.vehicles.update(
      'veh-lotte',
      'user-pilot-001',
      'pilot',
      { description: 'Neu lackiert' },
    );
    expect(updated.description).toBe('Neu lackiert');
  });

  it('update throws 403 when non-owner tries to update', async () => {
    const { container } = buildTestContainer();
    await expect(
      container.services.vehicles.update('veh-lotte', 'user-rider-001', 'rider', {
        description: 'Hacked',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('coordinator can update any vehicle', async () => {
    const { container } = buildTestContainer();
    const updated = await container.services.vehicles.update(
      'veh-lotte',
      'user-coord-001',
      'coordinator',
      { name: 'Koordinator-Update' },
    );
    expect(updated.name).toBe('Koordinator-Update');
  });
});

describe('UserService', () => {
  it('getById returns an existing user', async () => {
    const { container } = buildTestContainer();
    const user = await container.services.users.getById('user-pilot-001');
    expect(user.id).toBe('user-pilot-001');
    expect(user.role).toBe('pilot');
  });

  it('getById throws 404 for unknown user', async () => {
    const { container } = buildTestContainer();
    await expect(container.services.users.getById('nonexistent')).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('listAll returns all users', async () => {
    const { container } = buildTestContainer();
    const users = await container.services.users.listAll();
    expect(users.length).toBeGreaterThan(0);
  });

  it('upsertFromToken creates a new user on first call', async () => {
    const { container } = buildTestContainer();
    const user = await container.services.users.upsertFromToken({
      sub: 'brand-new-sub',
      email: 'new@example.com',
      name: 'Brand New',
    });
    expect(user.externalId).toBe('brand-new-sub');
    expect(user.email).toBe('new@example.com');
    expect(user.role).toBe('rider'); // default role
  });

  it('upsertFromToken updates existing user email on re-login', async () => {
    const { container } = buildTestContainer();
    const updated = await container.services.users.upsertFromToken({
      sub: 'pilot-001',
      email: 'updated@example.com',
      name: 'Martin K.',
    });
    expect(updated.email).toBe('updated@example.com');
  });

  it('upsertFromToken assigns coordinator role from token claims', async () => {
    const { container } = buildTestContainer();
    const user = await container.services.users.upsertFromToken({
      sub: 'new-coord',
      email: 'coord@example.com',
      roles: ['coordinator'],
    });
    expect(user.role).toBe('coordinator');
  });

  it('updateMe updates display name', async () => {
    const { container } = buildTestContainer();
    const updated = await container.services.users.updateMe('user-rider-001', {
      displayName: 'Erna B. (updated)',
    });
    expect(updated.displayName).toBe('Erna B. (updated)');
  });

  it('updateMe throws 404 for unknown user', async () => {
    const { container } = buildTestContainer();
    await expect(
      container.services.users.updateMe('nonexistent', { displayName: 'X' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('FacilityService', () => {
  it('listAll returns active facilities', async () => {
    const { container } = buildTestContainer();
    const facilities = await container.services.facilities.listAll();
    expect(facilities.length).toBeGreaterThan(0);
    facilities.forEach((f) => expect(f.active).toBe(true));
  });

  it('getById returns a facility', async () => {
    const { container } = buildTestContainer();
    const facility = await container.services.facilities.getById('fac-seniorenhaus');
    expect(facility.id).toBe('fac-seniorenhaus');
    expect(facility.name).toBe('Seniorenhaus Am Park');
  });

  it('getById throws 404 for unknown facility', async () => {
    const { container } = buildTestContainer();
    await expect(container.services.facilities.getById('nope')).rejects.toMatchObject({
      status: 404,
      code: 'FACILITY_NOT_FOUND',
    });
  });

  it('create adds a new facility', async () => {
    const { container } = buildTestContainer();
    const facility = await container.services.facilities.create({
      name: 'Neue Einrichtung',
      contactName: 'Herr Müller',
      contactPhone: '+49 211 999999',
      contactEmail: 'mueller@einrichtung.de',
    });
    expect(facility.name).toBe('Neue Einrichtung');
    expect(facility.active).toBe(true);
  });

  it('update changes facility fields', async () => {
    const { container } = buildTestContainer();
    const updated = await container.services.facilities.update('fac-seniorenhaus', {
      contactName: 'Frau Schneider',
    });
    expect(updated.contactName).toBe('Frau Schneider');
  });

  it('update throws 404 for unknown facility', async () => {
    const { container } = buildTestContainer();
    await expect(
      container.services.facilities.update('nope', { name: 'X' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
