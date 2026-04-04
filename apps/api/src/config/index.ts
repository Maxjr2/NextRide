import 'dotenv/config';

const NUMBER_PATTERN = /^[-+]?\d+(\.\d+)?$/;

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function parseNumberValue(key: string, value: string): number {
  const trimmed = value.trim();
  if (!NUMBER_PATTERN.test(trimmed)) {
    throw new Error(`Invalid numeric environment variable: ${key}="${value}"`);
  }
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${key}="${value}"`);
  }
  return parsed;
}

function requiredNumber(key: string): number {
  return parseNumberValue(key, required(key));
}

function optionalNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return parseNumberValue(key, raw);
}

const mockMode = optional('MOCK_MODE', 'false').toLowerCase() === 'true';
const keycloakIssuer = mockMode ? optional('KEYCLOAK_ISSUER', '') : required('KEYCLOAK_ISSUER');
const keycloakJwksUri = mockMode ? optional('KEYCLOAK_JWKS_URI', '') : required('KEYCLOAK_JWKS_URI');

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: optionalNumber('PORT', 3001),
  logLevel: optional('LOG_LEVEL', 'info'),

  /** When true, use in-memory stores — no DB, no Keycloak required. */
  mockMode,

  db: {
    url: optional('DATABASE_URL', ''),
  },

  auth: {
    issuer: keycloakIssuer,
    audience: optional('KEYCLOAK_AUDIENCE', 'nextride-api'),
    jwksUri: keycloakJwksUri,
  },

  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:5173'),
  },

  rateLimit: {
    windowMs: optionalNumber('RATE_LIMIT_WINDOW_MS', 60000),
    max: optionalNumber('RATE_LIMIT_MAX', 100),
  },

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: optionalNumber('SMTP_PORT', 587),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'NextRide <noreply@nextride.local>'),
  },
} as const;
