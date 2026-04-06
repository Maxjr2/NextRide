import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      parsedQuery?: unknown;
    }
  }
}

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Replaces req.body with the parsed (coerced) value on success.
 * Throws a ZodError on failure, caught by the global error handler.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 * Stores parsed/coerced query data in req.parsedQuery (req.query is not mutated).
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as Request & { parsedQuery: T }).parsedQuery = schema.parse(req.query);
    next();
  };
}
