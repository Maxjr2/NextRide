/**
 * WebSocket server for real-time events.
 *
 * Clients connect to ws://host/ws and receive JSON messages of the form:
 *   { type: WsEventType, payload: ..., timestamp: ISO string }
 *
 * All connected clients receive all events (broadcast).
 * Future: filter by role/chapter once multi-tenancy is needed.
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { logger } from '../config/logger';
import type { WsEvent, WsEventType } from '@nextride/shared';
import { config } from '../config';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { User } from '@nextride/shared';
import type { UserService } from '../services/UserService';

export interface WsEmitter {
  emit(event: Omit<WsEvent, 'timestamp'>): void;
  wss: WebSocketServer;
}

type AuthedSocket = WebSocket & { principal?: Pick<User, 'id' | 'role' | 'externalId'> };

let jwks: jwksClient.JwksClient | null = null;

function getJwksClient(): jwksClient.JwksClient {
  if (!jwks) {
    jwks = jwksClient({
      jwksUri: config.auth.jwksUri,
      cache: true,
      cacheMaxEntries: 10,
      cacheMaxAge: 10 * 60 * 1000,
    });
  }
  return jwks;
}

function getBearerToken(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

async function authenticate(req: IncomingMessage, userService: UserService): Promise<Pick<User, 'id' | 'role' | 'externalId'>> {
  const token = getBearerToken(req);
  if (!token) throw new Error('Missing bearer token');

  if (config.mockMode) {
    const users = await userService.listAll();
    if (token.startsWith('role:')) {
      const role = token.slice(5) as User['role'];
      const byRole = users.find((u) => u.role === role && u.active);
      if (!byRole) throw new Error('Unknown role token');
      return { id: byRole.id, role: byRole.role, externalId: byRole.externalId };
    }

    const byExternalId = users.find((u) => u.externalId === token && u.active);
    if (!byExternalId) throw new Error('Unknown mock token');
    return { id: byExternalId.id, role: byExternalId.role, externalId: byExternalId.externalId };
  }

  const client = getJwksClient();
  const decoded = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const header = jwt.decode(token, { complete: true })?.header;
    if (!header?.kid) return reject(new Error('Token missing kid'));

    client.getSigningKey(header.kid as string, (err, key) => {
      if (err || !key) return reject(new Error('Unable to fetch signing key'));
      jwt.verify(
        token,
        key.getPublicKey(),
        {
          issuer: config.auth.issuer,
          audience: config.auth.audience,
          algorithms: ['RS256'],
        },
        (verifyErr, payload) => {
          if (verifyErr) return reject(verifyErr);
          resolve(payload as Record<string, unknown>);
        },
      );
    });
  });

  if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
    throw new Error('Token missing required claims');
  }

  const realmRoles = (decoded.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const user = await userService.upsertFromToken({
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name as string | undefined,
    preferred_username: decoded.preferred_username as string | undefined,
    roles: realmRoles,
  });
  if (!user.active) throw new Error('User is inactive');

  return { id: user.id, role: user.role, externalId: user.externalId };
}

function canReceiveEvent(principal: Pick<User, 'id' | 'role'>, event: Omit<WsEvent, 'timestamp'>): boolean {
  if (principal.role === 'coordinator') return true;

  if (event.type.startsWith('post:')) {
    const payload = event.payload as { authorId?: unknown };
    return typeof payload.authorId === 'string' && payload.authorId === principal.id;
  }

  if (event.type.startsWith('match:')) {
    const payload = event.payload as {
      offer?: { authorId?: unknown };
      request?: { authorId?: unknown };
    };
    return payload.offer?.authorId === principal.id || payload.request?.authorId === principal.id;
  }

  return false;
}

export function createWsServer(httpServer: Server, userService: UserService): WsEmitter {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (socket: WebSocket, req: IncomingMessage) => {
    const authedSocket = socket as AuthedSocket;
    const ip = req.socket.remoteAddress ?? 'unknown';

    try {
      authedSocket.principal = await authenticate(req, userService);
      logger.debug({ ip, userId: authedSocket.principal.id }, 'WebSocket client connected');
    } catch (err) {
      logger.warn({ err, ip }, 'Rejected unauthorized WebSocket connection');
      authedSocket.close(1008, 'Unauthorized');
      return;
    }

    socket.on('close', () => {
      logger.debug({ ip, userId: authedSocket.principal?.id }, 'WebSocket client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err, ip }, 'WebSocket error');
    });

    // Keep-alive ping every 30s
    const ping = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.ping();
    }, 30_000);

    socket.on('close', () => clearInterval(ping));
  });

  function emit(event: Omit<WsEvent, 'timestamp'>): void {
    const message = JSON.stringify({ ...event, timestamp: new Date().toISOString() } satisfies WsEvent);
    let sent = 0;
    wss.clients.forEach((client) => {
      const authedClient = client as AuthedSocket;
      if (
        authedClient.readyState === WebSocket.OPEN
        && authedClient.principal
        && canReceiveEvent(authedClient.principal, event)
      ) {
        client.send(message);
        sent++;
      }
    });
    logger.debug({ type: event.type, recipients: sent }, 'WS event broadcast');
  }

  logger.info('WebSocket server ready at /ws');
  return { emit, wss };
}
