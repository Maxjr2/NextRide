import 'dotenv/config';
import http from 'http';
import { config } from './config';
import { logger } from './config/logger';
import { buildContainer } from './config/container';
import { createWsServer } from './websocket';
import { createApp } from './app';

async function main() {
  const container = buildContainer();

  // Create an HTTP server without the app first so we can attach WS
  const httpServer = http.createServer();
  const ws = createWsServer(httpServer, container.services.users);
  const { wss } = ws;

  // Now build the Express app (routes reference the ws emitter)
  const app = createApp(container, ws);
  httpServer.on('request', app);

  httpServer.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env, mockMode: config.mockMode }, '🚲 NextRide API listening');

    if (config.mockMode) {
      logger.info('');
      logger.info('  Mock Bearer tokens:');
      logger.info('    pilot-001       → Martin K. (pilot, advanced)');
      logger.info('    rider-001       → Erna B. (rider)');
      logger.info('    facility-001    → Frau Schmidt (facility)');
      logger.info('    coord-001       → Klaus R. (coordinator)');
      logger.info('  Role shortcuts:   role:pilot | role:rider | role:facility | role:coordinator');
      logger.info('  Health:           GET http://localhost:' + config.port + '/health');
      logger.info('  Posts:            GET http://localhost:' + config.port + '/api/v1/posts');
      logger.info('');
    }
  });

  let isShuttingDown = false;
  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('Shutting down...');
    wss.close?.();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
