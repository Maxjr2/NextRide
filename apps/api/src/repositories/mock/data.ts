/**
 * Initial in-memory seed data for mock mode.
 * Mirrors the POC's demo data so the UI looks populated immediately.
 */
import type { User, Facility, Vehicle, Post, Match } from '@nextride/shared';

const NOW = new Date();
const TOMORROW = new Date(NOW.getTime() + 86_400_000);
const DAY_AFTER = new Date(NOW.getTime() + 2 * 86_400_000);

// ─── Facilities ───────────────────────────────────────────────────────────────

export const MOCK_FACILITIES: Facility[] = [
  {
    id: 'fac-seniorenhaus',
    name: 'Seniorenhaus Am Park',
    contactName: 'Frau Schmidt',
    contactPhone: '+49 211 123456',
    contactEmail: 'kontakt@seniorenhaus-ampark.de',
    address: 'Parkstraße 12, 40477 Düsseldorf',
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'user-pilot-001',
    externalId: 'pilot-001',
    role: 'pilot',
    displayName: 'Martin K.',
    email: 'martin.k@example.com',
    phone: '+49 151 11111111',
    certificationLevel: 'advanced',
    notificationChannels: ['email', 'sms'],
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'user-rider-001',
    externalId: 'rider-001',
    role: 'rider',
    displayName: 'Erna B.',
    email: 'erna.b@example.com',
    notificationChannels: ['email'],
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'user-facility-001',
    externalId: 'facility-001',
    role: 'facility',
    displayName: 'Frau Schmidt',
    email: 'schmidt@seniorenhaus-ampark.de',
    facilityId: 'fac-seniorenhaus',
    notificationChannels: ['email'],
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'user-coord-001',
    externalId: 'coord-001',
    role: 'coordinator',
    displayName: 'Klaus R.',
    email: 'k.r@radelnohne-alter-dues.de',
    notificationChannels: ['email', 'sms'],
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'veh-lotte',
    pilotId: 'user-pilot-001',
    name: 'Flotte Lotte',
    description: 'Dreirad-Rikscha, blau, mit Windschutz',
    capacity: 2,
    certificationRequired: 'basic',
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'veh-elle',
    pilotId: 'user-pilot-001',
    name: 'Schnelle Elle',
    description: 'Tandempfeil mit Elektrounterstützung',
    capacity: 1,
    certificationRequired: 'advanced',
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'veh-doppel',
    pilotId: 'user-pilot-001',
    name: 'Doppeltes Lottchen',
    description: 'Familienrikscha, Platz für zwei Personen nebeneinander',
    capacity: 2,
    certificationRequired: 'tandem',
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── Posts ────────────────────────────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-offer-001',
    type: 'offer',
    authorId: 'user-pilot-001',
    vehicleId: 'veh-lotte',
    date: TOMORROW,
    timeSlot: { start: '10:00', end: '12:00' },
    neighborhood: 'Wersten',
    routeWish: 'Rheinuferpromenade gerne',
    passengerCount: 2,
    status: 'open',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'post-request-001',
    type: 'request',
    authorId: 'user-facility-001',
    facilityId: 'fac-seniorenhaus',
    date: TOMORROW,
    timeSlot: { start: '10:00', end: '13:00' },
    neighborhood: 'Wersten',
    routeWish: 'Stadtgarten oder Rhein',
    accessibilityNotes: 'Rollstuhl möglich, braucht etwas mehr Zeit beim Einsteigen',
    passengerCount: 1,
    status: 'open',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'post-offer-002',
    type: 'offer',
    authorId: 'user-pilot-001',
    vehicleId: 'veh-elle',
    neighborhood: 'Flingern',
    routeWish: 'Egal, gerne durch den Park',
    passengerCount: 1,
    status: 'open',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'post-request-002',
    type: 'request',
    authorId: 'user-rider-001',
    date: DAY_AFTER,
    timeSlot: { start: '14:00', end: '16:00' },
    neighborhood: 'Bilk',
    routeWish: 'Südfriedhof oder Volksgarten',
    passengerCount: 1,
    status: 'open',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'post-offer-003',
    type: 'offer',
    authorId: 'user-pilot-001',
    vehicleId: 'veh-doppel',
    date: DAY_AFTER,
    timeSlot: { start: '09:00', end: '11:00' },
    neighborhood: 'Oberbilk',
    passengerCount: 2,
    status: 'matched',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ─── Matches ──────────────────────────────────────────────────────────────────

export const MOCK_MATCHES: Match[] = [];
