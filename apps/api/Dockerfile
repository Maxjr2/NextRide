# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all workspace deps first (better layer caching)
COPY package.json package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm install --workspaces

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api

# Build shared package
RUN npm run build --workspace=packages/shared

# Generate Prisma client
RUN npm run db:generate --workspace=apps/api

# Build API
RUN npm run build --workspace=apps/api

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package.json package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm install --workspaces --omit=dev

# Copy built artefacts
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/node_modules/.prisma apps/api/node_modules/.prisma

# Prisma schema for migrations
COPY apps/api/prisma apps/api/prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
