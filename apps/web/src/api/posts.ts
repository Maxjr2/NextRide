import { api } from './client';
import type {
  PostWithAuthor,
  ApiResponse,
  ApiListResponse,
  CreatePostInput,
  UpdatePostInput,
  ListPostsQuery,
} from '@nextride/shared';

export type PostsQuery = Partial<ListPostsQuery>;

function buildQuery(params: PostsQuery): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const postsApi = {
  list: (query: PostsQuery = {}) =>
    api.get<ApiListResponse<PostWithAuthor>>(`/posts${buildQuery(query)}`),

  get: (id: string) =>
    api.get<ApiResponse<PostWithAuthor>>(`/posts/${id}`),

  create: (data: CreatePostInput) =>
    api.post<ApiResponse<PostWithAuthor>>('/posts', data),

  update: (id: string, data: UpdatePostInput) =>
    api.patch<ApiResponse<PostWithAuthor>>(`/posts/${id}`, data),

  cancel: (id: string) =>
    api.delete<ApiResponse<PostWithAuthor>>(`/posts/${id}`),
};
