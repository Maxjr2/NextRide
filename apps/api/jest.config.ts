import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@nextride/shared$': '<rootDir>/../../packages/shared/src',
  },
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/__tests__/**',
    '!**/repositories/prisma/**', // Prisma repos need a real DB
    '!**/repositories/prisma/seed.ts',
    '!index.ts',
  ],
  coverageThresholds: {
    global: {
      lines: 70,
      functions: 70,
    },
  },
};

export default config;
