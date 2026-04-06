import { api } from './client';
import type {
  MatchWithPosts,
  Match,
  ApiResponse,
  ApiListResponse,
  CreateMatchInput,
} from '@nextride/shared';

export const matchesApi = {
  list: (params: { status?: string; postId?: string; page?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    const s = q.toString();
    return api.get<ApiListResponse<MatchWithPosts>>(`/matches${s ? `?${s}` : ''}`);
  },

  get: (id: string) =>
    api.get<ApiResponse<MatchWithPosts>>(`/matches/${id}`),

  propose: (data: CreateMatchInput) =>
    api.post<ApiResponse<MatchWithPosts>>('/matches', data),

  confirm: (id: string) =>
    api.post<ApiResponse<Match | MatchWithPosts>>(`/matches/${id}/confirm`, {}),

  cancel: (id: string, reason?: string) =>
    api.post<ApiResponse<MatchWithPosts>>(`/matches/${id}/cancel`, { reason }),

  complete: (id: string) =>
    api.post<ApiResponse<MatchWithPosts>>(`/matches/${id}/complete`, {}),
};
