import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validateBody, validateQuery } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreatePostSchema, UpdatePostSchema, ListPostsQuerySchema } from '@nextride/shared';
import type { PostService } from '../services/PostService';
import type { UserService } from '../services/UserService';
import type { ApiResponse, ApiListResponse } from '@nextride/shared';
import type { WsEmitter } from '../websocket';

export function postsRouter(
  postService: PostService,
  userService: UserService,
  ws: WsEmitter,
): Router {
  const router = Router();
  const auth = requireAuth(userService);

  /**
   * GET /posts
   * List posts (offers & requests).
   * Public-ish: authentication required but no role restriction.
   */
  router.get(
    '/',
    auth,
    validateQuery(ListPostsQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = (req as any).parsedQuery;
        const result = await postService.list(query);
        res.json({
          data: result.items,
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
        } satisfies ApiListResponse<(typeof result.items)[0]>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /posts
   * Create a new offer (pilots) or request (riders/facilities).
   */
  router.post(
    '/',
    auth,
    validateBody(CreatePostSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const post = await postService.create(req.user!.id, req.body);
        ws.emit({ type: 'post:new', payload: post });
        res.status(201).json({ data: post } satisfies ApiResponse<typeof post>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /posts/:id
   */
  router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.getById(req.params.id);
      res.json({ data: post } satisfies ApiResponse<typeof post>);
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /posts/:id
   * Update a post (author or coordinator).
   */
  router.patch(
    '/:id',
    auth,
    validateBody(UpdatePostSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const post = await postService.update(
          req.params.id,
          req.user!.id,
          req.user!.role,
          req.body,
        );
        ws.emit({ type: 'post:updated', payload: post });
        res.json({ data: post } satisfies ApiResponse<typeof post>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /posts/:id
   * Cancel a post (author or coordinator).
   */
  router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.cancel(req.params.id, req.user!.id, req.user!.role);
      ws.emit({ type: 'post:cancelled', payload: post });
      res.json({ data: post } satisfies ApiResponse<typeof post>);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
