/**
 * In-memory repository implementations for mock mode.
 * All data resets when the process restarts.
 * Implements the same interfaces as the Prisma repositories.
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Facility,
  Vehicle,
  Post,
  Match,
  RideLog,
  PostWithAuthor,
  MatchWithPosts,
  UserRole,
} from '@nextride/shared';
import type {
  IUserRepository,
  IFacilityRepository,
  IVehicleRepository,
  IPostRepository,
  IMatchRepository,
  IRideLogRepository,
  PagedResult,
} from '../interfaces';
import type {
  CreatePostInput,
  UpdatePostInput,
  ListPostsQuery,
  CreateMatchInput,
  UpdateMatchInput,
  ListMatchesQuery,
  CreateVehicleInput,
  UpdateVehicleInput,
  UpdateUserInput,
  CreateFacilityInput,
  UpdateFacilityInput,
  CreateRideLogInput,
} from '@nextride/shared';
import {
  MOCK_USERS,
  MOCK_FACILITIES,
  MOCK_VEHICLES,
  MOCK_POSTS,
  MOCK_MATCHES,
} from './data';

// Deep-clone seed data so tests don't pollute each other
const clone = <T>(arr: T[]): T[] => structuredClone(arr);

// ─── Shared store ─────────────────────────────────────────────────────────────

export class MockStore {
  users: User[] = clone(MOCK_USERS);
  facilities: Facility[] = clone(MOCK_FACILITIES);
  vehicles: Vehicle[] = clone(MOCK_VEHICLES);
  posts: Post[] = clone(MOCK_POSTS);
  matches: Match[] = clone(MOCK_MATCHES);
  rideLogs: RideLog[] = [];
}

// ─── Helper: enrich posts ─────────────────────────────────────────────────────

function enrichPost(post: Post, store: MockStore): PostWithAuthor {
  const author = store.users.find((u) => u.id === post.authorId)!;
  const facility = post.facilityId ? store.facilities.find((f) => f.id === post.facilityId) : undefined;
  const vehicle = post.vehicleId ? store.vehicles.find((v) => v.id === post.vehicleId) : undefined;
  return {
    ...post,
    author: { id: author.id, displayName: author.displayName, role: author.role },
    facility: facility ? { id: facility.id, name: facility.name } : undefined,
    vehicle: vehicle
      ? { id: vehicle.id, name: vehicle.name, capacity: vehicle.capacity, certificationRequired: vehicle.certificationRequired }
      : undefined,
  };
}

function enrichMatch(match: Match, store: MockStore): MatchWithPosts {
  const offer = store.posts.find((p) => p.id === match.offerId)!;
  const request = store.posts.find((p) => p.id === match.requestId)!;
  return {
    ...match,
    offer: enrichPost(offer, store),
    request: enrichPost(request, store),
  };
}

// ─── User Repository ──────────────────────────────────────────────────────────

export class MockUserRepository implements IUserRepository {
  constructor(private store: MockStore) {}

  async findById(id: string): Promise<User | null> {
    return this.store.users.find((u) => u.id === id) ?? null;
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    return this.store.users.find((u) => u.externalId === externalId) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.store.users];
  }

  async upsertFromToken(claims: {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    roles?: string[];
  }): Promise<User> {
    const existing = this.store.users.find((u) => u.externalId === claims.sub);
    if (existing) {
      existing.role = deriveRole(claims.roles ?? []);
      existing.email = claims.email;
      existing.displayName = claims.name ?? claims.preferred_username ?? claims.email;
      existing.updatedAt = new Date();
      return { ...existing };
    }
    const role = deriveRole(claims.roles ?? []);
    const user: User = {
      id: uuidv4(),
      externalId: claims.sub,
      role,
      displayName: claims.name ?? claims.preferred_username ?? claims.email,
      email: claims.email,
      notificationChannels: ['email'],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.users.push(user);
    return { ...user };
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const user = this.store.users.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.notificationChannels !== undefined) user.notificationChannels = data.notificationChannels;
    user.updatedAt = new Date();
    return { ...user };
  }

  async deactivate(id: string): Promise<User> {
    const user = this.store.users.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    user.active = false;
    user.updatedAt = new Date();
    return { ...user };
  }
}

// ─── Facility Repository ──────────────────────────────────────────────────────

export class MockFacilityRepository implements IFacilityRepository {
  constructor(private store: MockStore) {}

  async findById(id: string): Promise<Facility | null> {
    return this.store.facilities.find((f) => f.id === id) ?? null;
  }

  async findAll(activeOnly = true): Promise<Facility[]> {
    return this.store.facilities.filter((f) => !activeOnly || f.active);
  }

  async create(data: CreateFacilityInput): Promise<Facility> {
    const facility: Facility = {
      id: uuidv4(),
      ...data,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.facilities.push(facility);
    return { ...facility };
  }

  async update(id: string, data: UpdateFacilityInput): Promise<Facility> {
    const facility = this.store.facilities.find((f) => f.id === id);
    if (!facility) throw new Error(`Facility ${id} not found`);
    Object.assign(facility, data, { updatedAt: new Date() });
    return { ...facility };
  }
}

// ─── Vehicle Repository ───────────────────────────────────────────────────────

export class MockVehicleRepository implements IVehicleRepository {
  constructor(private store: MockStore) {}

  async findById(id: string): Promise<Vehicle | null> {
    return this.store.vehicles.find((v) => v.id === id) ?? null;
  }

  async findByPilot(pilotId: string): Promise<Vehicle[]> {
    return this.store.vehicles.filter((v) => v.pilotId === pilotId && v.active);
  }

  async findAll(activeOnly = true): Promise<Vehicle[]> {
    return this.store.vehicles.filter((v) => !activeOnly || v.active);
  }

  async create(pilotId: string, data: CreateVehicleInput): Promise<Vehicle> {
    const vehicle: Vehicle = {
      id: uuidv4(),
      pilotId,
      ...data,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.vehicles.push(vehicle);
    return { ...vehicle };
  }

  async update(id: string, data: UpdateVehicleInput): Promise<Vehicle> {
    const vehicle = this.store.vehicles.find((v) => v.id === id);
    if (!vehicle) throw new Error(`Vehicle ${id} not found`);
    Object.assign(vehicle, data, { updatedAt: new Date() });
    return { ...vehicle };
  }
}

// ─── Post Repository ──────────────────────────────────────────────────────────

export class MockPostRepository implements IPostRepository {
  constructor(private store: MockStore) {}

  async findById(id: string): Promise<PostWithAuthor | null> {
    const post = this.store.posts.find((p) => p.id === id);
    return post ? enrichPost(post, this.store) : null;
  }

  async list(query: ListPostsQuery): Promise<PagedResult<PostWithAuthor>> {
    let items = [...this.store.posts];

    if (query.type) items = items.filter((p) => p.type === query.type);
    if (query.status) {
      items = items.filter((p) => p.status === query.status);
    } else {
      items = items.filter((p) => p.status !== 'cancelled');
    }
    if (query.neighborhood) {
      const n = query.neighborhood.toLowerCase();
      items = items.filter((p) => p.neighborhood.toLowerCase().includes(n));
    }
    if (query.date) {
      const d = query.date.slice(0, 10);
      items = items.filter((p) => p.date && p.date.toISOString().slice(0, 10) === d);
    }
    if (query.authorId) items = items.filter((p) => p.authorId === query.authorId);

    // Sort newest first
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const paged = items.slice((page - 1) * pageSize, page * pageSize);

    return { items: paged.map((p) => enrichPost(p, this.store)), total };
  }

  async create(authorId: string, data: CreatePostInput): Promise<PostWithAuthor> {
    const post: Post = {
      id: uuidv4(),
      type: data.type,
      authorId,
      facilityId: data.facilityId,
      vehicleId: data.vehicleId,
      date: data.date ? new Date(data.date) : undefined,
      timeSlot: data.timeSlot,
      neighborhood: data.neighborhood,
      routeWish: data.routeWish,
      accessibilityNotes: data.accessibilityNotes,
      passengerCount: data.passengerCount ?? 1,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.posts.push(post);
    return enrichPost(post, this.store);
  }

  async update(id: string, data: UpdatePostInput): Promise<PostWithAuthor> {
    const post = this.store.posts.find((p) => p.id === id);
    if (!post) throw new Error(`Post ${id} not found`);
    if (data.facilityId !== undefined) post.facilityId = data.facilityId;
    if (data.vehicleId !== undefined) post.vehicleId = data.vehicleId;
    if (data.date !== undefined) post.date = data.date ? new Date(data.date) : undefined;
    if (data.timeSlot !== undefined) post.timeSlot = data.timeSlot;
    if (data.neighborhood !== undefined) post.neighborhood = data.neighborhood;
    if (data.routeWish !== undefined) post.routeWish = data.routeWish;
    if (data.accessibilityNotes !== undefined) post.accessibilityNotes = data.accessibilityNotes;
    if (data.passengerCount !== undefined) post.passengerCount = data.passengerCount;
    if (data.status !== undefined) post.status = data.status;
    post.updatedAt = new Date();
    return enrichPost(post, this.store);
  }

  async updateStatus(id: string, status: Post['status']): Promise<Post> {
    const post = this.store.posts.find((p) => p.id === id);
    if (!post) throw new Error(`Post ${id} not found`);
    post.status = status;
    post.updatedAt = new Date();
    return { ...post };
  }
}

// ─── Match Repository ─────────────────────────────────────────────────────────

export class MockMatchRepository implements IMatchRepository {
  constructor(private store: MockStore) {}

  async findById(id: string): Promise<MatchWithPosts | null> {
    const match = this.store.matches.find((m) => m.id === id);
    return match ? enrichMatch(match, this.store) : null;
  }

  async list(query: ListMatchesQuery): Promise<PagedResult<MatchWithPosts>> {
    let items = [...this.store.matches];
    if (query.status) items = items.filter((m) => m.status === query.status);
    if (query.postId) items = items.filter((m) => m.offerId === query.postId || m.requestId === query.postId);

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const paged = items.slice((page - 1) * pageSize, page * pageSize);

    return { items: paged.map((m) => enrichMatch(m, this.store)), total };
  }

  async create(proposedById: string, data: CreateMatchInput): Promise<MatchWithPosts> {
    const match: Match = {
      id: uuidv4(),
      offerId: data.offerId,
      requestId: data.requestId,
      proposedBy: proposedById,
      pilotConfirmed: false,
      riderConfirmed: false,
      status: 'proposed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.matches.push(match);
    return enrichMatch(match, this.store);
  }

  async update(
    id: string,
    data: UpdateMatchInput & { confirmedById?: string },
  ): Promise<MatchWithPosts> {
    const match = this.store.matches.find((m) => m.id === id);
    if (!match) throw new Error(`Match ${id} not found`);
    match.status = data.status;
    if (data.cancellationReason !== undefined) match.cancellationReason = data.cancellationReason;
    if (data.confirmedById !== undefined) match.confirmedBy = data.confirmedById;
    match.updatedAt = new Date();
    return enrichMatch(match, this.store);
  }

  async confirmSide(id: string, side: 'pilot' | 'rider'): Promise<Match> {
    const match = this.store.matches.find((m) => m.id === id);
    if (!match) throw new Error(`Match ${id} not found`);
    if (side === 'pilot') match.pilotConfirmed = true;
    else match.riderConfirmed = true;
    match.updatedAt = new Date();
    return { ...match };
  }
}

// ─── RideLog Repository ───────────────────────────────────────────────────────

export class MockRideLogRepository implements IRideLogRepository {
  constructor(private store: MockStore) {}

  async findByMatch(matchId: string): Promise<RideLog | null> {
    return this.store.rideLogs.find((r) => r.matchId === matchId) ?? null;
  }

  async create(data: CreateRideLogInput): Promise<RideLog> {
    const log: RideLog = {
      id: uuidv4(),
      matchId: data.matchId,
      completedAt: new Date(data.completedAt),
      pilotNotes: data.pilotNotes,
      distanceKm: data.distanceKm,
      durationMinutes: data.durationMinutes,
      createdAt: new Date(),
    };
    this.store.rideLogs.push(log);
    return { ...log };
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function deriveRole(roles: string[]): UserRole {
  if (roles.includes('coordinator')) return 'coordinator';
  if (roles.includes('facility')) return 'facility';
  if (roles.includes('pilot')) return 'pilot';
  return 'rider';
}
