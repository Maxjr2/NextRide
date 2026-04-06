/**
 * Authentication middleware.
 *
 * Production:  verifies RS256 JWT issued by Keycloak using JWKS endpoint.
 * Mock mode:   accepts a simple Bearer token of the form "<externalId>" and
 *              looks up the corresponding mock user — no signature check.
 *
 * In both cases the resolved user is attached to req.user.
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config';
import { logger } from '../config/logger';
import { AppError } from './AppError';
import type { User } from '@nextride/shared';

// Augment Express request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      rawClaims?: Record<string, unknown>;
    }
  }
}

// ─── JWKS client (cached) ─────────────────────────────────────────────────────

let jwks: jwksClient.JwksClient | null = null;

function getJwksClient(): jwksClient.JwksClient {
  if (!jwks) {
    jwks = jwksClient({
      jwksUri: config.auth.jwksUri,
      cache: true,
      cacheMaxEntries: 10,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
    });
  }
  return jwks;
}

// ─── Token extraction ─────────────────────────────────────────────────────────

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * Returns an Express middleware that resolves `req.user`.
 * Pass `userService` to allow auto-provisioning users on first login.
 */
export function requireAuth(userService: {
  upsertFromToken: (claims: {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    roles?: string[];
  }) => Promise<User>;
  getById: (id: string) => Promise<User>;
  listAll: () => Promise<User[]>;
}) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req);
      if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Missing Bearer token');

      if (config.mockMode) {
        await handleMockAuth(req, token, userService);
      } else {
        await handleJwtAuth(req, token, userService);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Mock auth handler ────────────────────────────────────────────────────────

/**
 * Mock auth accepts tokens in two formats:
 *   1. "<externalId>"        — look up an existing mock user
 *   2. "role:<role>"         — impersonate first user with that role (handy for testing)
 *
 * Include the token in the Authorization header:
 *   Authorization: Bearer pilot-001
 *   Authorization: Bearer role:coordinator
 */
async function handleMockAuth(
  req: Request,
  token: string,
  userService: { listAll: () => Promise<User[]>; upsertFromToken: (c: any) => Promise<User> },
): Promise<void> {
  const all = await userService.listAll();

  let user: User | undefined;

  if (token.startsWith('role:')) {
    const role = token.slice(5) as User['role'];
    user = all.find((u) => u.role === role && u.active);
  } else {
    user = all.find((u) => u.externalId === token && u.active);
  }

  if (!user) {
    // Auto-create a user for unknown tokens (handy for integration tests)
    user = await userService.upsertFromToken({
      sub: token,
      email: `${token}@mock.local`,
      name: token,
      roles: ['rider'],
    });
  }

  req.user = user;
  logger.debug({ userId: user.id, role: user.role }, 'Mock auth: resolved user');
}

// ─── Production JWT handler ───────────────────────────────────────────────────

async function handleJwtAuth(
  req: Request,
  token: string,
  userService: { upsertFromToken: (c: any) => Promise<User> },
): Promise<void> {
  const client = getJwksClient();

  const decoded = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const header = jwt.decode(token, { complete: true })?.header;
    if (!header?.kid) return reject(new AppError(401, 'INVALID_TOKEN', 'Token missing kid'));

    client.getSigningKey(header.kid as string, (err, key) => {
      if (err || !key) return reject(new AppError(401, 'INVALID_TOKEN', 'Unable to fetch signing key'));

      const signingKey = key.getPublicKey();
      jwt.verify(
        token,
        signingKey,
        {
          issuer: config.auth.issuer,
          audience: config.auth.audience,
          algorithms: ['RS256'],
        },
        (verifyErr, payload) => {
          if (verifyErr) return reject(new AppError(401, 'INVALID_TOKEN', verifyErr.message));
          resolve(payload as Record<string, unknown>);
        },
      );
    });
  });

  req.rawClaims = decoded;

  if (typeof decoded !== 'object' || decoded === null) {
    throw new AppError(401, 'INVALID_TOKEN', 'Token payload is invalid');
  }

  if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
    throw new AppError(401, 'INVALID_TOKEN', 'Token missing required claims');
  }

  // Keycloak puts realm roles in realm_access.roles
  const realmRoles =
    (decoded.realm_access as { roles?: string[] } | undefined)?.roles ?? [];

  const user = await userService.upsertFromToken({
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name as string | undefined,
    preferred_username: decoded.preferred_username as string | undefined,
    roles: realmRoles,
  });

  if (!user.active) {
    throw new AppError(403, 'USER_INACTIVE', 'User account is inactive');
  }

  req.user = user;
}

// ─── Role guard ───────────────────────────────────────────────────────────────

export function requireRole(...roles: User['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', `Requires one of roles: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}
