import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateVehicleSchema, UpdateVehicleSchema } from '@nextride/shared';
import type { VehicleService } from '../services/VehicleService';
import type { UserService } from '../services/UserService';
import type { ApiResponse } from '@nextride/shared';

export function vehiclesRouter(vehicleService: VehicleService, userService: UserService): Router {
  const router = Router();
  const auth = requireAuth(userService);

  /**
   * GET /vehicles
   * List all active vehicles. Useful for coordinators matching offers/requests.
   */
  router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicles = await vehicleService.listAll();
      res.json({ data: vehicles });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /vehicles/mine
   * List vehicles owned by the authenticated pilot.
   */
  router.get(
    '/mine',
    auth,
    requireRole('pilot'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const vehicles = await vehicleService.listByPilot(req.user!.id);
        res.json({ data: vehicles });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /vehicles/:id
   */
  router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.getById(req.params.id);
      res.json({ data: vehicle } satisfies ApiResponse<typeof vehicle>);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /vehicles
   * Register a new vehicle. Pilots only.
   */
  router.post(
    '/',
    auth,
    requireRole('pilot'),
    validateBody(CreateVehicleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const vehicle = await vehicleService.create(req.user!.id, req.body);
        res.status(201).json({ data: vehicle } satisfies ApiResponse<typeof vehicle>);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * PATCH /vehicles/:id
   * Update a vehicle (owner or coordinator).
   */
  router.patch(
    '/:id',
    auth,
    validateBody(UpdateVehicleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const vehicle = await vehicleService.update(
          req.params.id,
          req.user!.id,
          req.user!.role,
          req.body,
        );
        res.json({ data: vehicle } satisfies ApiResponse<typeof vehicle>);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
