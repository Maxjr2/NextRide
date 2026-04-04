import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateFacilitySchema, UpdateFacilitySchema } from '@nextride/shared';
import type { FacilityService } from '../services/FacilityService';
import type { UserService } from '../services/UserService';
import type { ApiResponse } from '@nextride/shared';

export function facilitiesRouter(facilityService: FacilityService, userService: UserService): Router {
  const router = Router();
  const auth = requireAuth(userService);

  /**
   * GET /facilities
   * All authenticated users can see facilities (needed when posting requests).
   */
  router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facilities = await facilityService.listAll();
      res.json({ data: facilities });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /facilities/:id
   */
  router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facility = await facilityService.getById(req.params.id);
      res.json({ data: facility } satisfies ApiResponse<typeof facility>);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /facilities
   * Coordinators only.
   */
  router.post(
    '/',
    auth,
    requireRole('coordinator'),
    validateBody(CreateFacilitySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const facility = await facilityService.create(req.body);
        res.status(201).json({ data: facility } satisfies ApiResponse<typeof facility>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PATCH /facilities/:id
   * Coordinators only.
   */
  router.patch(
    '/:id',
    auth,
    requireRole('coordinator'),
    validateBody(UpdateFacilitySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const facility = await facilityService.update(req.params.id, req.body);
        res.json({ data: facility } satisfies ApiResponse<typeof facility>);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
