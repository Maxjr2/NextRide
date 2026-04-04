import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3001'), 10),
  logLevel: optional('LOG_LEVEL', 'info'),

  /** When true, use in-memory stores — no DB, no Keycloak required. */
  mockMode: optional('MOCK_MODE', 'false').toLowerCase() === 'true',

  db: {
    url: optional('DATABASE_URL', ''),
  },

  auth: {
    issuer: optional('KEYCLOAK_ISSUER', ''),
    audience: optional('KEYCLOAK_AUDIENCE', 'nextride-api'),
    /** JWKS endpoint derived from issuer */
    get jwksUri(): string {
      return `${config.auth.issuer}/protocol/openid-connect/certs`;
    },
  },

  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:5173'),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
  },

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'NextRide <noreply@nextride.local>'),
  },
} as const;
