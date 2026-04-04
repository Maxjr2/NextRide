import type {
  User,
  Facility,
  Vehicle,
  Post,
  Match,
  RideLog,
  PostWithAuthor,
  MatchWithPosts,
} from '@nextride/shared';
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

// ─── Shared pagination result ─────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  total: number;
}

// ─── User Repository ──────────────────────────────────────────────────────────

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByExternalId(externalId: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  upsertFromToken(claims: {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    roles?: string[];
  }): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  deactivate(id: string): Promise<User>;
}

// ─── Facility Repository ──────────────────────────────────────────────────────

export interface IFacilityRepository {
  findById(id: string): Promise<Facility | null>;
  findAll(activeOnly?: boolean): Promise<Facility[]>;
  create(data: CreateFacilityInput): Promise<Facility>;
  update(id: string, data: UpdateFacilityInput): Promise<Facility>;
}

// ─── Vehicle Repository ───────────────────────────────────────────────────────

export interface IVehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByPilot(pilotId: string): Promise<Vehicle[]>;
  findAll(activeOnly?: boolean): Promise<Vehicle[]>;
  create(pilotId: string, data: CreateVehicleInput): Promise<Vehicle>;
  update(id: string, data: UpdateVehicleInput): Promise<Vehicle>;
}

// ─── Post Repository ──────────────────────────────────────────────────────────

export interface IPostRepository {
  findById(id: string): Promise<PostWithAuthor | null>;
  list(query: ListPostsQuery): Promise<PagedResult<PostWithAuthor>>;
  create(authorId: string, data: CreatePostInput): Promise<PostWithAuthor>;
  update(id: string, data: UpdatePostInput): Promise<PostWithAuthor>;
  updateStatus(id: string, status: Post['status']): Promise<Post>;
}

// ─── Match Repository ─────────────────────────────────────────────────────────

export interface IMatchRepository {
  findById(id: string): Promise<MatchWithPosts | null>;
  list(query: ListMatchesQuery): Promise<PagedResult<MatchWithPosts>>;
  create(proposedById: string, data: CreateMatchInput): Promise<MatchWithPosts>;
  update(id: string, data: UpdateMatchInput & { confirmedById?: string }): Promise<MatchWithPosts>;
  confirmSide(id: string, side: 'pilot' | 'rider'): Promise<Match>;
}

// ─── RideLog Repository ───────────────────────────────────────────────────────

export interface IRideLogRepository {
  findByMatch(matchId: string): Promise<RideLog | null>;
  create(data: CreateRideLogInput): Promise<RideLog>;
}
