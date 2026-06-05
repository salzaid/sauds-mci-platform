# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – deps
#   Install ALL dependencies (including devDeps needed for the build step).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

# pnpm is the package manager used by this project
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy manifest files first so Docker layer-caches the install step
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – builder
#   Compile the React frontend (Vite) and the Express server (esbuild).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree
COPY . .

# Build:
#   1. vite build  → dist/public  (frontend SPA)
#   2. esbuild     → dist/index.js (Express server bundle)
RUN pnpm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 – runner
#   Lean production image: only the compiled artefacts + runtime deps.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Install only the packages needed at runtime
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install mysql-client so the entrypoint can wait for MySQL to be ready
RUN apk add --no-cache mysql-client

WORKDIR /app

# Copy package manifests and install production-only deps
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy compiled artefacts from the builder stage
COPY --from=builder /app/dist ./dist

# Copy Drizzle migration SQL files so the entrypoint can run migrations
COPY drizzle/ ./drizzle/

# Copy the entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# The server listens on PORT (defaults to 3000 if not set)
EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
