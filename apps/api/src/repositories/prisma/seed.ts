/**
 * Seed script for development/testing.
 * Mirrors the mock data used in the POC.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Facilities ───────────────────────────────────────────────────────────
  const seniorenhaus = await prisma.facility.upsert({
    where: { id: 'fac-seniorenhaus' },
    update: {},
    create: {
      id: 'fac-seniorenhaus',
      name: 'Seniorenhaus Am Park',
      contactName: 'Frau Schmidt',
      contactPhone: '+49 211 123456',
      contactEmail: 'kontakt@seniorenhaus-ampark.de',
      address: 'Parkstraße 12, 40477 Düsseldorf',
    },
  });

  // ── Users ────────────────────────────────────────────────────────────────
  const pilot = await prisma.user.upsert({
    where: { externalId: 'pilot-001' },
    update: {},
    create: {
      id: 'user-pilot-001',
      externalId: 'pilot-001',
      role: 'pilot',
      displayName: 'Martin K.',
      email: 'martin.k@example.com',
      phone: '+49 151 11111111',
      certificationLevel: 'advanced',
      notificationChannels: ['email', 'sms'],
    },
  });

  const rider = await prisma.user.upsert({
    where: { externalId: 'rider-001' },
    update: {},
    create: {
      id: 'user-rider-001',
      externalId: 'rider-001',
      role: 'rider',
      displayName: 'Erna B.',
      email: 'erna.b@example.com',
      notificationChannels: ['email'],
    },
  });

  const facilityUser = await prisma.user.upsert({
    where: { externalId: 'facility-001' },
    update: {},
    create: {
      id: 'user-facility-001',
      externalId: 'facility-001',
      role: 'facility',
      displayName: 'Frau Schmidt',
      email: 'schmidt@seniorenhaus-ampark.de',
      facilityId: seniorenhaus.id,
      notificationChannels: ['email'],
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { externalId: 'coord-001' },
    update: {},
    create: {
      id: 'user-coord-001',
      externalId: 'coord-001',
      role: 'coordinator',
      displayName: 'Klaus R.',
      email: 'k.r@radelnohne-alter-dues.de',
      notificationChannels: ['email', 'sms'],
    },
  });

  // ── Vehicles ─────────────────────────────────────────────────────────────
  const lotte = await prisma.vehicle.upsert({
    where: { id: 'veh-lotte' },
    update: {},
    create: {
      id: 'veh-lotte',
      pilotId: pilot.id,
      name: 'Flotte Lotte',
      description: 'Dreirad-Rikscha, blau, mit Windschutz',
      capacity: 2,
      certificationRequired: 'basic',
    },
  });

  const elle = await prisma.vehicle.upsert({
    where: { id: 'veh-elle' },
    update: {},
    create: {
      id: 'veh-elle',
      pilotId: pilot.id,
      name: 'Schnelle Elle',
      description: 'Tandempfeil mit Elektrounterstützung',
      capacity: 1,
      certificationRequired: 'advanced',
    },
  });

  // ── Posts ────────────────────────────────────────────────────────────────
  await prisma.post.upsert({
    where: { id: 'post-offer-001' },
    update: {},
    create: {
      id: 'post-offer-001',
      type: 'offer',
      authorId: pilot.id,
      vehicleId: lotte.id,
      date: new Date('2026-04-10'),
      timeSlotStart: '10:00',
      timeSlotEnd: '12:00',
      neighborhood: 'Wersten',
      routeWish: 'Rheinuferpromenade gerne',
      passengerCount: 2,
    },
  });

  await prisma.post.upsert({
    where: { id: 'post-request-001' },
    update: {},
    create: {
      id: 'post-request-001',
      type: 'request',
      authorId: facilityUser.id,
      facilityId: seniorenhaus.id,
      date: new Date('2026-04-10'),
      timeSlotStart: '10:00',
      timeSlotEnd: '13:00',
      neighborhood: 'Wersten',
      routeWish: 'Stadtgarten oder Rhein',
      accessibilityNotes: 'Rollstuhl möglich, braucht etwas mehr Zeit beim Einsteigen',
      passengerCount: 1,
    },
  });

  await prisma.post.upsert({
    where: { id: 'post-offer-002' },
    update: {},
    create: {
      id: 'post-offer-002',
      type: 'offer',
      authorId: pilot.id,
      vehicleId: elle.id,
      neighborhood: 'Flingern',
      routeWish: 'Egal, gerne durch den Park',
      passengerCount: 1,
    },
  });

  console.log('✅ Seed complete.');
  console.log(`   Facilities: 1`);
  console.log(`   Users: 4 (pilot, rider, facility, coordinator)`);
  console.log(`   Vehicles: 2`);
  console.log(`   Posts: 3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
