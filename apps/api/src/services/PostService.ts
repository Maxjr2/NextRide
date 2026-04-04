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

  async create(authorId: string, data: CreatePostInput): Promise<PostWithAuthor> {
    // Pilots can only post offers; riders/facilities can only post requests
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

    return this.posts.update(id, data);
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
}
