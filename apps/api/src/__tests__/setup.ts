// Ensure mock mode is always active in tests — no DB or Keycloak required
process.env.MOCK_MODE = 'true';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.PORT = '0';
