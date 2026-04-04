import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateMatchSchema, ListMatchesQuerySchema } from '@nextride/shared';
import type { MatchService } from '../services/MatchService';
import type { UserService } from '../services/UserService';
import type { ApiResponse, ApiListResponse } from '@nextride/shared';
import type { WsEmitter } from '../websocket';

const CancelBodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export function matchesRouter(
  matchService: MatchService,
  userService: UserService,
  ws: WsEmitter,
): Router {
  const router = Router();
  const auth = requireAuth(userService);

  /**
   * GET /matches
   */
  router.get(
    '/',
    auth,
    validateQuery(ListMatchesQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = (req as any).parsedQuery;
        const result = await matchService.list(query);
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
   * POST /matches
   * Propose a new match. Coordinators only.
   */
  router.post(
    '/',
    auth,
    requireRole('coordinator'),
    validateBody(CreateMatchSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const match = await matchService.propose(req.user!.id, req.body);
        ws.emit({ type: 'match:proposed', payload: match });
        res.status(201).json({ data: match } satisfies ApiResponse<typeof match>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /matches/:id
   */
  router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const match = await matchService.getById(req.params.id);
      res.json({ data: match } satisfies ApiResponse<typeof match>);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /matches/:id/confirm
   * Pilot or rider confirms their side.
   */
  router.post(
    '/:id/confirm',
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await matchService.confirmSide(
          req.params.id,
          req.user!.id,
          req.user!.role,
        );
        // result is Match or MatchWithPosts depending on whether both confirmed
        const updated = result as any;
        if (updated.status === 'confirmed') {
          ws.emit({ type: 'match:confirmed', payload: updated });
        }
        res.json({ data: updated } satisfies ApiResponse<typeof updated>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /matches/:id/cancel
   * Cancel a match. Coordinator or participant.
   */
  router.post(
    '/:id/cancel',
    auth,
    validateBody(CancelBodySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const match = await matchService.cancel(
          req.params.id,
          req.user!.id,
          req.user!.role,
          req.body.reason,
        );
        ws.emit({ type: 'match:cancelled', payload: match });
        res.json({ data: match } satisfies ApiResponse<typeof match>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * POST /matches/:id/complete
   * Mark match as completed. Coordinator or pilot.
   */
  router.post(
    '/:id/complete',
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const match = await matchService.complete(
          req.params.id,
          req.user!.id,
          req.user!.role,
        );
        ws.emit({ type: 'match:completed', payload: match });
        res.json({ data: match } satisfies ApiResponse<typeof match>);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
