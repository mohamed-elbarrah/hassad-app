# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Copy workspace config and package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all dependencies (workspaces resolve correctly)
RUN npm ci

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client (needed for TypeScript types during build)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build shared first, then API
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# NOTE: Do NOT run npm prune --production here.
# The production stage copies node_modules as-is because:
# 1. prisma CLI (devDependency) is needed at runtime for migrate deploy + generate
# 2. The production stage is a separate minimal image — only needed artifacts are copied

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built artifacts from build stage
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/shared/dist /app/packages/shared/dist
COPY --from=build /app/packages/shared/package.json /app/packages/shared/
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma
COPY --from=build /app/apps/api/package.json /app/apps/api/

# Copy entrypoint script
COPY scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3001
CMD ["/app/entrypoint.sh"]
