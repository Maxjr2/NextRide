import { prisma } from './client';
import { mapFacility } from './mappers';
import type { IFacilityRepository } from '../interfaces';
import type { Facility } from '@nextride/shared';
import type { CreateFacilityInput, UpdateFacilityInput } from '@nextride/shared';

export class PrismaFacilityRepository implements IFacilityRepository {
  async findById(id: string): Promise<Facility | null> {
    const row = await prisma.facility.findUnique({ where: { id } });
    return row ? mapFacility(row) : null;
  }

  async findAll(activeOnly = true): Promise<Facility[]> {
    const rows = await prisma.facility.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });
    return rows.map(mapFacility);
  }

  async create(data: CreateFacilityInput): Promise<Facility> {
    const row = await prisma.facility.create({ data });
    return mapFacility(row);
  }

  async update(id: string, data: UpdateFacilityInput): Promise<Facility> {
    const row = await prisma.facility.update({ where: { id }, data });
    return mapFacility(row);
  }
}
