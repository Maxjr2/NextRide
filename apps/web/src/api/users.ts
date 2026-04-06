import { api } from './client';
import type { User, ApiResponse, UpdateUserInput } from '@nextride/shared';

export const usersApi = {
  me: () => api.get<ApiResponse<User>>('/users/me'),
  update: (data: UpdateUserInput) =>
    api.patch<ApiResponse<User>>('/users/me', data),
};
