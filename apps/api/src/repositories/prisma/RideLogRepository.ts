import { prisma } from './client';
import { mapRideLog } from './mappers';
import type { IRideLogRepository } from '../interfaces';
import type { RideLog } from '@nextride/shared';
import type { CreateRideLogInput } from '@nextride/shared';

export class PrismaRideLogRepository implements IRideLogRepository {
  async findByMatch(matchId: string): Promise<RideLog | null> {
    const row = await prisma.rideLog.findUnique({ where: { matchId } });
    return row ? mapRideLog(row) : null;
  }

  async create(data: CreateRideLogInput): Promise<RideLog> {
    const row = await prisma.rideLog.create({
      data: {
        matchId: data.matchId,
        completedAt: new Date(data.completedAt),
        pilotNotes: data.pilotNotes,
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
      },
    });
    return mapRideLog(row);
  }
}
