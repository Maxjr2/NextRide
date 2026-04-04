import type { Facility } from '@nextride/shared';
import type { IFacilityRepository } from '../repositories/interfaces';
import type { CreateFacilityInput, UpdateFacilityInput } from '@nextride/shared';
import { AppError } from '../middleware/AppError';

export class FacilityService {
  constructor(private facilities: IFacilityRepository) {}

  async listAll(activeOnly = true): Promise<Facility[]> {
    return this.facilities.findAll(activeOnly);
  }

  async getById(id: string): Promise<Facility> {
    const facility = await this.facilities.findById(id);
    if (!facility) throw new AppError(404, 'FACILITY_NOT_FOUND', 'Facility not found');
    return facility;
  }

  async create(data: CreateFacilityInput): Promise<Facility> {
    return this.facilities.create(data);
  }

  async update(id: string, data: UpdateFacilityInput): Promise<Facility> {
    await this.getById(id); // ensure exists
    return this.facilities.update(id, data);
  }
}
