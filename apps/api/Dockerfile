# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all workspace deps first (better layer caching)
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm ci --workspaces

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api

# Build shared package
RUN npm run build --workspace=packages/shared

# Generate Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run db:generate --workspace=apps/api

# Build API
RUN npm run build --workspace=apps/api

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Only production deps
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm ci --workspaces --omit=dev

# Copy built artefacts
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/node_modules/.prisma apps/api/node_modules/.prisma

# Prisma schema for migrations
COPY apps/api/prisma apps/api/prisma

RUN chown -R appuser:appgroup /app/packages/shared/dist /app/apps/api/dist /app/apps/api/node_modules/.prisma /app/apps/api/prisma

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
