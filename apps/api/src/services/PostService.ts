import type { PostWithAuthor } from '@nextride/shared';
import type { IPostRepository, IVehicleRepository, PagedResult } from '../repositories/interfaces';
import type { INotificationService } from '../notifications/INotificationService';
import type { CreatePostInput, UpdatePostInput, ListPostsQuery } from '@nextride/shared';
import { AppError } from '../middleware/AppError';

export class PostService {
  constructor(
    private posts: IPostRepository,
    private vehicles: IVehicleRepository,
    private notifications: INotificationService,
  ) {}

  async list(query: ListPostsQuery): Promise<PagedResult<PostWithAuthor>> {
    return this.posts.list(query);
  }

  async getById(id: string): Promise<PostWithAuthor> {
    const post = await this.posts.findById(id);
    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');
    return post;
  }

  async create(authorId: string, role: string, data: CreatePostInput): Promise<PostWithAuthor> {
    this.assertCanCreatePostType(role, data.type);

    if (data.vehicleId) {
      const vehicle = await this.vehicles.findById(data.vehicleId);
      if (!vehicle) throw new AppError(400, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
      if (vehicle.pilotId !== authorId) {
        throw new AppError(403, 'VEHICLE_NOT_OWNED', 'You do not own this vehicle');
      }
    }
    return this.posts.create(authorId, data);
  }

  async update(id: string, authorId: string, role: string, data: UpdatePostInput): Promise<PostWithAuthor> {
    const post = await this.posts.findById(id);
    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');

    // Only author or coordinator can update
    if (post.authorId !== authorId && role !== 'coordinator') {
      throw new AppError(403, 'FORBIDDEN', 'You are not allowed to update this post');
    }

    // Can't edit a post that's already completed or cancelled
    if (post.status === 'completed' || post.status === 'cancelled') {
      throw new AppError(409, 'POST_IMMUTABLE', 'Cannot update a completed or cancelled post');
    }

    const sanitized = { ...data };

    if (role !== 'coordinator' && (sanitized.status !== undefined || sanitized.vehicleId !== undefined)) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot change status or vehicle');
    }

    if (sanitized.status !== undefined) {
      this.assertValidStatusTransition(post.status, sanitized.status);
    }

    if (sanitized.vehicleId !== undefined) {
      const vehicle = await this.vehicles.findById(sanitized.vehicleId);
      if (!vehicle) throw new AppError(400, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
      if (vehicle.pilotId !== post.authorId) {
        throw new AppError(403, 'VEHICLE_NOT_OWNED', 'Vehicle must be owned by post author');
      }
    }

    return this.posts.update(id, sanitized);
  }

  async cancel(id: string, authorId: string, role: string): Promise<PostWithAuthor> {
    const post = await this.posts.findById(id);
    if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');

    if (post.authorId !== authorId && role !== 'coordinator') {
      throw new AppError(403, 'FORBIDDEN', 'You are not allowed to cancel this post');
    }

    if (post.status === 'completed' || post.status === 'cancelled') {
      throw new AppError(409, 'POST_IMMUTABLE', 'Post is already completed or cancelled');
    }

    return this.posts.update(id, { status: 'cancelled' });
  }

  private assertCanCreatePostType(role: string, type: 'offer' | 'request'): void {
    if (type === 'offer' && role !== 'pilot') {
      throw new AppError(403, 'FORBIDDEN', 'Only pilots can create offers');
    }
    if (type === 'request' && role !== 'rider' && role !== 'facility') {
      throw new AppError(403, 'FORBIDDEN', 'Only riders and facilities can create requests');
    }
  }

  private assertValidStatusTransition(from: PostWithAuthor['status'], to: PostWithAuthor['status']): void {
    const allowedTransitions: Record<PostWithAuthor['status'], PostWithAuthor['status'][]> = {
      open: ['matched', 'cancelled'],
      matched: ['confirmed', 'open', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (from === to) return;

    if (!allowedTransitions[from].includes(to)) {
      throw new AppError(409, 'INVALID_STATUS_TRANSITION', `Cannot transition post from ${from} to ${to}`);
    }
  }
}
