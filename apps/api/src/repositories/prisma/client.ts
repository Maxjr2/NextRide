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
  prisma.$on('query', (e: any) => {
    logger.debug({ query: e.query, duration: e.duration }, 'prisma query');
  });
}

prisma.$on('error', (e: any) => {
  logger.error(e, 'prisma error');
});

prisma.$on('warn', (e: any) => {
  logger.warn(e, 'prisma warning');
});

export { prisma };