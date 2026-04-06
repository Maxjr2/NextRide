import { api } from './client';
import type { Vehicle, ApiResponse, CreateVehicleInput } from '@nextride/shared';

export const vehiclesApi = {
  list: () => api.get<{ data: Vehicle[] }>('/vehicles'),
  mine: () => api.get<{ data: Vehicle[] }>('/vehicles/mine'),
  get: (id: string) => api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`),
  create: (data: CreateVehicleInput) =>
    api.post<ApiResponse<Vehicle>>('/vehicles', data),
};
