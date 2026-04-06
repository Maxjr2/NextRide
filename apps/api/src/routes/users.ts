import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { UpdateUserSchema } from '@nextride/shared';
import type { UserService } from '../services/UserService';
import type { ApiResponse } from '@nextride/shared';

export function usersRouter(userService: UserService): Router {
  const router = Router();
  const auth = requireAuth(userService);

  /**
   * GET /users/me
   * Return the authenticated user's own profile.
   */
  router.get('/me', auth, (req: Request, res: Response) => {
    res.json({ data: req.user } satisfies ApiResponse<typeof req.user>);
  });

  /**
   * PATCH /users/me
   * Update own profile (display name, phone, notification prefs).
   */
  router.patch(
    '/me',
    auth,
    validateBody(UpdateUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.updateMe(req.user!.id, req.body);
        res.json({ data: user } satisfies ApiResponse<typeof user>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /users
   * List all users. Coordinators only.
   */
  router.get(
    '/',
    auth,
    requireRole('coordinator'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const users = await userService.listAll();
        res.json({ data: users });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /users/:id
   * Get any user by ID. Coordinators only.
   */
  router.get(
    '/:id',
    auth,
    requireRole('coordinator'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.getById(req.params.id);
        res.json({ data: user } satisfies ApiResponse<typeof user>);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
