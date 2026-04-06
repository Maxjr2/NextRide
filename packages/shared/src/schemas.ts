import { z } from 'zod';

// ─── Reusable primitives ──────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(['pilot', 'rider', 'facility', 'coordinator']);

export const CertificationLevelSchema = z.enum(['basic', 'advanced', 'tandem']);

export const PostTypeSchema = z.enum(['offer', 'request']);

export const PostStatusSchema = z.enum(['open', 'matched', 'confirmed', 'completed', 'cancelled']);

export const MatchStatusSchema = z.enum(['proposed', 'confirmed', 'completed', 'cancelled']);

export const NotificationChannelSchema = z.enum(['email', 'sms', 'push']);

const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be a valid time in HH:MM (00-23:00-59) format');

export const TimeSlotSchema = z.object({
  start: TimeOfDaySchema,
  end: TimeOfDaySchema,
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Post schemas ─────────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  type: PostTypeSchema,
  facilityId: z.string().optional(),
  vehicleId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  timeSlot: TimeSlotSchema.optional(),
  neighborhood: z.string().min(1).max(100),
  routeWish: z.string().max(500).optional(),
  accessibilityNotes: z.string().max(1000).optional(),
  passengerCount: z.number().int().min(1).max(10).default(1),
});

export const UpdatePostSchema = CreatePostSchema.partial().omit({ type: true }).extend({
  status: PostStatusSchema.optional(),
});

export const ListPostsQuerySchema = PaginationSchema.extend({
  type: PostTypeSchema.optional(),
  status: PostStatusSchema.optional(),
  neighborhood: z.string().optional(),
  date: z.string().optional(), // ISO date string YYYY-MM-DD
  authorId: z.string().optional(),
});

// ─── Match schemas ────────────────────────────────────────────────────────────

export const CreateMatchSchema = z.object({
  offerId: z.string(),
  requestId: z.string(),
});

export const UpdateMatchSchema = z.object({
  status: MatchStatusSchema,
  cancellationReason: z.string().max(500).optional(),
});

export const ListMatchesQuerySchema = PaginationSchema.extend({
  status: MatchStatusSchema.optional(),
  postId: z.string().optional(), // matches involving this post
});

// ─── Vehicle schemas ──────────────────────────────────────────────────────────

export const CreateVehicleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  capacity: z.number().int().min(1).max(20),
  certificationRequired: CertificationLevelSchema,
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().extend({
  active: z.boolean().optional(),
});

// ─── User schemas ─────────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  notificationChannels: z.array(NotificationChannelSchema).optional(),
});

// ─── Facility schemas ─────────────────────────────────────────────────────────

export const CreateFacilitySchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().min(1).max(30),
  contactEmail: z.string().email(),
  address: z.string().max(500).optional(),
});

export const UpdateFacilitySchema = CreateFacilitySchema.partial().extend({
  active: z.boolean().optional(),
});

// ─── RideLog schemas ──────────────────────────────────────────────────────────

export const CreateRideLogSchema = z.object({
  matchId: z.string().uuid(),
  completedAt: z.string().datetime(),
  pilotNotes: z.string().max(1000).optional(),
  distanceKm: z.number().min(0).max(1000).optional(),
  durationMinutes: z.number().int().min(0).max(600).optional(),
});

// ─── Exported inferred types ──────────────────────────────────────────────────

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>;
export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;
export type UpdateMatchInput = z.infer<typeof UpdateMatchSchema>;
export type ListMatchesQuery = z.infer<typeof ListMatchesQuerySchema>;
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateFacilityInput = z.infer<typeof CreateFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof UpdateFacilitySchema>;
export type CreateRideLogInput = z.infer<typeof CreateRideLogSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
