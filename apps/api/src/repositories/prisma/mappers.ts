/**
 * Map Prisma DB rows to domain types.
 * Prisma enums match our domain enums exactly, so most fields pass through.
 * The only transformation needed is the split timeSlot columns → TimeSlot object.
 */
import type {
  User,
  Facility,
  Vehicle,
  Post,
  Match,
  RideLog,
  PostWithAuthor,
  MatchWithPosts,
  TimeSlot,
} from '@nextride/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapUser(row: any): User {
  return {
    id: row.id,
    externalId: row.externalId,
    role: row.role,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone ?? undefined,
    certificationLevel: row.certificationLevel ?? undefined,
    facilityId: row.facilityId ?? undefined,
    notificationChannels: row.notificationChannels ?? [],
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFacility(row: any): Facility {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    address: row.address ?? undefined,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapVehicle(row: any): Vehicle {
  return {
    id: row.id,
    pilotId: row.pilotId,
    name: row.name,
    description: row.description ?? undefined,
    capacity: row.capacity,
    certificationRequired: row.certificationRequired,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPost(row: any): Post {
  const timeSlot: TimeSlot | undefined =
    row.timeSlotStart && row.timeSlotEnd
      ? { start: row.timeSlotStart, end: row.timeSlotEnd }
      : undefined;

  return {
    id: row.id,
    type: row.type,
    authorId: row.authorId,
    facilityId: row.facilityId ?? undefined,
    vehicleId: row.vehicleId ?? undefined,
    date: row.date ?? undefined,
    timeSlot,
    neighborhood: row.neighborhood,
    routeWish: row.routeWish ?? undefined,
    accessibilityNotes: row.accessibilityNotes ?? undefined,
    passengerCount: row.passengerCount,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPostWithAuthor(row: any): PostWithAuthor {
  return {
    ...mapPost(row),
    author: {
      id: row.author.id,
      displayName: row.author.displayName,
      role: row.author.role,
    },
    facility: row.facility
      ? { id: row.facility.id, name: row.facility.name }
      : undefined,
    vehicle: row.vehicle
      ? {
          id: row.vehicle.id,
          name: row.vehicle.name,
          capacity: row.vehicle.capacity,
          certificationRequired: row.vehicle.certificationRequired,
        }
      : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMatch(row: any): Match {
  return {
    id: row.id,
    offerId: row.offerId,
    requestId: row.requestId,
    proposedBy: row.proposedById,
    confirmedBy: row.confirmedById ?? undefined,
    pilotConfirmed: row.pilotConfirmed,
    riderConfirmed: row.riderConfirmed,
    status: row.status,
    cancellationReason: row.cancellationReason ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMatchWithPosts(row: any): MatchWithPosts {
  return {
    ...mapMatch(row),
    offer: mapPostWithAuthor(row.offer),
    request: mapPostWithAuthor(row.request),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRideLog(row: any): RideLog {
  return {
    id: row.id,
    matchId: row.matchId,
    completedAt: row.completedAt,
    pilotNotes: row.pilotNotes ?? undefined,
    distanceKm: row.distanceKm ?? undefined,
    durationMinutes: row.durationMinutes ?? undefined,
    createdAt: row.createdAt,
  };
}
