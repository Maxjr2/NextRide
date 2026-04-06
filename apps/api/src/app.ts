import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import type { Container } from './config/container';
import type { WsEmitter } from './websocket';
import { postsRouter } from './routes/posts';
import { matchesRouter } from './routes/matches';
import { vehiclesRouter } from './routes/vehicles';
import { usersRouter } from './routes/users';
import { facilitiesRouter } from './routes/facilities';

export function createApp(container: Container, ws: WsEmitter): express.Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.cors.origin,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // ── Rate limiting ───────────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ── Request logging ─────────────────────────────────────────────────────────
  app.use(pinoHttp({ logger }));

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));

  // ── Health check (unauthenticated) ──────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      mockMode: config.mockMode,
      env: config.env,
      timestamp: new Date().toISOString(),
    });
  });

  // ── API routes ──────────────────────────────────────────────────────────────
  const { services } = container;

  app.use('/api/v1/posts', postsRouter(services.posts, services.users, ws));
  app.use('/api/v1/matches', matchesRouter(services.matches, services.users, ws));
  app.use('/api/v1/vehicles', vehiclesRouter(services.vehicles, services.users));
  app.use('/api/v1/users', usersRouter(services.users));
  app.use('/api/v1/facilities', facilitiesRouter(services.facilities, services.users));

  // ── 404 fallback ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Global error handler (must be last) ─────────────────────────────────────
  app.use(errorHandler);

  return app;
}
