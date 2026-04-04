import { prisma } from './client';
import { mapMatch, mapMatchWithPosts } from './mappers';
import type { IMatchRepository, PagedResult } from '../interfaces';
import type { Match, MatchWithPosts } from '@nextride/shared';
import type { CreateMatchInput, UpdateMatchInput, ListMatchesQuery } from '@nextride/shared';

const MATCH_INCLUDE = {
  offer: {
    include: {
      author: { select: { id: true, displayName: true, role: true } },
      facility: { select: { id: true, name: true } },
      vehicle: { select: { id: true, name: true, capacity: true, certificationRequired: true } },
    },
  },
  request: {
    include: {
      author: { select: { id: true, displayName: true, role: true } },
      facility: { select: { id: true, name: true } },
      vehicle: { select: { id: true, name: true, capacity: true, certificationRequired: true } },
    },
  },
} as const;

export class PrismaMatchRepository implements IMatchRepository {
  async findById(id: string): Promise<MatchWithPosts | null> {
    const row = await prisma.match.findUnique({ where: { id }, include: MATCH_INCLUDE });
    return row ? mapMatchWithPosts(row) : null;
  }

  async list(query: ListMatchesQuery): Promise<PagedResult<MatchWithPosts>> {
    const { page, pageSize, status, postId } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(status ? { status } : {}),
      ...(postId ? { OR: [{ offerId: postId }, { requestId: postId }] } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.match.findMany({ where, include: MATCH_INCLUDE, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.match.count({ where }),
    ]);

    return { items: rows.map(mapMatchWithPosts), total };
  }

  async create(proposedById: string, data: CreateMatchInput): Promise<MatchWithPosts> {
    const row = await prisma.match.create({
      data: {
        offerId: data.offerId,
        requestId: data.requestId,
        proposedById,
      },
      include: MATCH_INCLUDE,
    });
    return mapMatchWithPosts(row);
  }

  async update(
    id: string,
    data: UpdateMatchInput & { confirmedById?: string },
  ): Promise<MatchWithPosts> {
    const row = await prisma.match.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.cancellationReason !== undefined ? { cancellationReason: data.cancellationReason } : {}),
        ...(data.confirmedById !== undefined ? { confirmedById: data.confirmedById } : {}),
      },
      include: MATCH_INCLUDE,
    });
    return mapMatchWithPosts(row);
  }

  async confirmSide(id: string, side: 'pilot' | 'rider'): Promise<Match> {
    const data = side === 'pilot' ? { pilotConfirmed: true } : { riderConfirmed: true };
    const row = await prisma.match.update({ where: { id }, data });
    return mapMatch(row);
  }
}
