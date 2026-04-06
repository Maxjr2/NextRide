// ─── Domain Enums ────────────────────────────────────────────────────────────

export type UserRole = 'pilot' | 'rider' | 'facility' | 'coordinator';

export type CertificationLevel = 'basic' | 'advanced' | 'tandem';

export type PostType = 'offer' | 'request';

export type PostStatus = 'open' | 'matched' | 'confirmed' | 'completed' | 'cancelled';

export type MatchStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';

export type NotificationChannel = 'email' | 'sms' | 'push';

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface User {
  id: string;
  externalId: string; // Keycloak subject
  role: UserRole;
  displayName: string;
  email: string;
  phone?: string;
  certificationLevel?: CertificationLevel; // pilots only
  facilityId?: string;                     // facility staff only
  notificationChannels: NotificationChannel[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  pilotId: string;
  name: string;
  description?: string;
  capacity: number;          // number of passenger seats
  certificationRequired: CertificationLevel;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: string; // HH:MM (24h)
  end: string;   // HH:MM (24h)
}

export interface Post {
  id: string;
  type: PostType;
  authorId: string;
  facilityId?: string; // when a facility posts on behalf of a resident
  vehicleId?: string;  // offer: which vehicle; request: preferred vehicle type
  date?: Date;         // null = flexible
  timeSlot?: TimeSlot;
  neighborhood: string;
  routeWish?: string;
  accessibilityNotes?: string;
  passengerCount: number;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  offerId: string;
  requestId: string;
  proposedBy: string;  // userId of coordinator or system
  confirmedBy?: string;
  pilotConfirmed: boolean;
  riderConfirmed: boolean;
  status: MatchStatus;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RideLog {
  id: string;
  matchId: string;
  completedAt: Date;
  pilotNotes?: string;
  distanceKm?: number;
  durationMinutes?: number;
  createdAt: Date;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─── Enriched / Joined Types (for API responses) ─────────────────────────────

export interface PostWithAuthor extends Post {
  author: Pick<User, 'id' | 'displayName' | 'role'>;
  facility?: Pick<Facility, 'id' | 'name'>;
  vehicle?: Pick<Vehicle, 'id' | 'name' | 'capacity' | 'certificationRequired'>;
}

export interface MatchWithPosts extends Match {
  offer: PostWithAuthor;
  request: PostWithAuthor;
}

// ─── WebSocket Event Types ─────────────────────────────────────────────────────

export type WsEventType =
  | 'post:new'
  | 'post:updated'
  | 'post:cancelled'
  | 'match:proposed'
  | 'match:confirmed'
  | 'match:cancelled'
  | 'match:completed';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  payload: T;
  timestamp: string;
}
