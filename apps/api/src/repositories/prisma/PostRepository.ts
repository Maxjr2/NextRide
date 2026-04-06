import { prisma } from './client';
import { mapPost, mapPostWithAuthor } from './mappers';
import type { IPostRepository, PagedResult } from '../interfaces';
import type { Post, PostWithAuthor } from '@nextride/shared';
import type { CreatePostInput, UpdatePostInput, ListPostsQuery } from '@nextride/shared';

const POST_INCLUDE = {
  author: { select: { id: true, displayName: true, role: true } },
  facility: { select: { id: true, name: true } },
  vehicle: { select: { id: true, name: true, capacity: true, certificationRequired: true } },
} as const;

export class PrismaPostRepository implements IPostRepository {
  async findById(id: string): Promise<PostWithAuthor | null> {
    const row = await prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    return row ? mapPostWithAuthor(row) : null;
  }

  async list(query: ListPostsQuery): Promise<PagedResult<PostWithAuthor>> {
    const { page, pageSize, type, status, neighborhood, date, authorId } = query;
    const skip = (page - 1) * pageSize;

    // Build date range filter when a date string is provided
    let dateFilter: { gte: Date; lt: Date } | undefined;
    if (date) {
      // Parse as UTC midnight to avoid DST shifts
      const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
      const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      dateFilter = { gte: d, lt: next };
    }

    const where = {
      ...(type ? { type } : {}),
      ...(status ? { status } : { status: { not: 'cancelled' as const } }),
      ...(neighborhood ? { neighborhood: { contains: neighborhood, mode: 'insensitive' as const } } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
      ...(authorId ? { authorId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.post.findMany({ where, include: POST_INCLUDE, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.post.count({ where }),
    ]);

    return { items: rows.map(mapPostWithAuthor), total };
  }

  async create(authorId: string, data: CreatePostInput): Promise<PostWithAuthor> {
    const row = await prisma.post.create({
      data: {
        authorId,
        type: data.type,
        facilityId: data.facilityId,
        vehicleId: data.vehicleId,
        date: data.date ? new Date(data.date) : null,
        timeSlotStart: data.timeSlot?.start,
        timeSlotEnd: data.timeSlot?.end,
        neighborhood: data.neighborhood,
        routeWish: data.routeWish,
        accessibilityNotes: data.accessibilityNotes,
        passengerCount: data.passengerCount,
      },
      include: POST_INCLUDE,
    });
    return mapPostWithAuthor(row);
  }

  async update(id: string, data: UpdatePostInput): Promise<PostWithAuthor> {
    const row = await prisma.post.update({
      where: { id },
      data: {
        ...(data.facilityId !== undefined ? { facilityId: data.facilityId } : {}),
        ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId } : {}),
        ...(data.date !== undefined ? { date: data.date ? new Date(data.date) : null } : {}),
        ...(data.timeSlot !== undefined ? { timeSlotStart: data.timeSlot?.start, timeSlotEnd: data.timeSlot?.end } : {}),
        ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood } : {}),
        ...(data.routeWish !== undefined ? { routeWish: data.routeWish } : {}),
        ...(data.accessibilityNotes !== undefined ? { accessibilityNotes: data.accessibilityNotes } : {}),
        ...(data.passengerCount !== undefined ? { passengerCount: data.passengerCount } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: POST_INCLUDE,
    });
    return mapPostWithAuthor(row);
  }

  async updateStatus(id: string, status: Post['status']): Promise<Post> {
    const row = await prisma.post.update({ where: { id }, data: { status } });
    return mapPost(row);
  }
}
