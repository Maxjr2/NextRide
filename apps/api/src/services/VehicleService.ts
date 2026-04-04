import type { Vehicle } from '@nextride/shared';
import type { IVehicleRepository } from '../repositories/interfaces';
import type { CreateVehicleInput, UpdateVehicleInput } from '@nextride/shared';
import { AppError } from '../middleware/AppError';

export class VehicleService {
  constructor(private vehicles: IVehicleRepository) {}

  async listAll(activeOnly = true): Promise<Vehicle[]> {
    return this.vehicles.findAll(activeOnly);
  }

  async listByPilot(pilotId: string): Promise<Vehicle[]> {
    return this.vehicles.findByPilot(pilotId);
  }

  async getById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
    return vehicle;
  }

  async create(pilotId: string, data: CreateVehicleInput): Promise<Vehicle> {
    return this.vehicles.create(pilotId, data);
  }

  async update(id: string, pilotId: string, role: string, data: UpdateVehicleInput): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
    if (vehicle.pilotId !== pilotId && role !== 'coordinator') {
      throw new AppError(403, 'FORBIDDEN', 'You do not own this vehicle');
    }
    return this.vehicles.update(id, data);
  }
}
