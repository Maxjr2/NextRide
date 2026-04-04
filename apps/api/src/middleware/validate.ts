import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

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
 * Replaces req.query with the parsed (coerced) value on success.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as Request & { parsedQuery: T }).parsedQuery = schema.parse(req.query);
    next();
  };
}
