import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.LOG_LEVEL === 'debug') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.$on('query', (e: any) => {
    logger.debug({ query: e.query, duration: e.duration }, 'prisma query');
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.$on('error', (e: any) => {
  logger.error(e, 'prisma error');
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
prisma.$on('warn', (e: any) => {
  logger.warn(e, 'prisma warning');
});

export { prisma };
