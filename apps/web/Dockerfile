# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Build args — only pass what Next.js needs at build time (public URLs only, NEVER secrets)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy workspace config and package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install all dependencies
RUN npm ci

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# Build shared first, then Next.js
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/web

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy root package.json (needed for workspace-aware npm commands like --workspace)
COPY --from=build /app/package.json /app/

# Copy built artifacts
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/shared/dist /app/packages/shared/dist
COPY --from=build /app/packages/shared/package.json /app/packages/shared/
COPY --from=build /app/apps/web/.next /app/apps/web/.next
COPY --from=build /app/apps/web/package.json /app/apps/web/
COPY --from=build /app/apps/web/public /app/apps/web/public
COPY --from=build /app/apps/web/next.config.ts /app/apps/web/

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
