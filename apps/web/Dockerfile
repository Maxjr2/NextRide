# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all workspace deps first (better layer caching)
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci --workspaces

# Copy source
COPY packages/shared packages/shared
COPY apps/web apps/web

# Build shared package
RUN npm run build --workspace=packages/shared

# Build-time env vars (baked into the SPA bundle by Vite)
# VITE_API_URL is intentionally left unset so the client uses relative /api/v1
# paths, allowing nginx to proxy to whatever backend is configured at runtime.
ARG VITE_MOCK_MODE=false
ARG VITE_KEYCLOAK_URL=
ARG VITE_KEYCLOAK_REALM=nextride
ARG VITE_KEYCLOAK_CLIENT_ID=nextride-web

ENV VITE_MOCK_MODE=${VITE_MOCK_MODE}
ENV VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}
ENV VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM}
ENV VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}

RUN npm run build --workspace=apps/web

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

# Remove default site
RUN rm /etc/nginx/conf.d/default.conf

# Copy built SPA assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Template is processed at container startup by the nginx entrypoint via envsubst.
# Required env vars: API_HOST, API_PORT
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
