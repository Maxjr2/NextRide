import { prisma } from './client';
import { mapVehicle } from './mappers';
import type { IVehicleRepository } from '../interfaces';
import type { Vehicle } from '@nextride/shared';
import type { CreateVehicleInput, UpdateVehicleInput } from '@nextride/shared';

export class PrismaVehicleRepository implements IVehicleRepository {
  async findById(id: string): Promise<Vehicle | null> {
    const row = await prisma.vehicle.findUnique({ where: { id } });
    return row ? mapVehicle(row) : null;
  }

  async findByPilot(pilotId: string): Promise<Vehicle[]> {
    const rows = await prisma.vehicle.findMany({
      where: { pilotId, active: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapVehicle);
  }

  async findAll(activeOnly = true): Promise<Vehicle[]> {
    const rows = await prisma.vehicle.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });
    return rows.map(mapVehicle);
  }

  async create(pilotId: string, data: CreateVehicleInput): Promise<Vehicle> {
    const row = await prisma.vehicle.create({
      data: { ...data, pilotId },
    });
    return mapVehicle(row);
  }

  async update(id: string, data: UpdateVehicleInput): Promise<Vehicle> {
    const row = await prisma.vehicle.update({ where: { id }, data });
    return mapVehicle(row);
  }
}
