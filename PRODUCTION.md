# PRODUCTION.md — Hassad Platform Deployment Standard

This document defines the **single, non-negotiable** deployment pattern for Hassad Platform on any VPS. Every team member follows these rules. No ad-hoc deviations.

---

## 1. Core Rules

| #       | Rule                                                                                                                      | Why                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **R1**  | **Everything runs in Docker Compose** — PostgreSQL, API, Web, Nginx. One `docker-compose.prod.yml` file.                  | Single source of truth. `docker compose up -d --build` deploys everything.                       |
| **R2**  | **PostgreSQL in Docker with a named volume** — `postgres_data:/var/lib/postgresql/data`. Never bind-mount to host.        | Data survives container recreation and can be backed up or restored independently of containers. |
| **R3**  | **`prisma migrate deploy` in production** — entrypoint runs migrations, never `db push`.                                  | Migration history, rollback capability, no accidental schema drift.                              |
| **R4**  | **`prisma migrate dev` in development** — generate migration files locally, commit them to `apps/api/prisma/migrations/`. | Migrations are versioned, reviewable in PRs.                                                     |
| **R5**  | **Nginx is the ONLY publicly exposed service** — ports 80/443. API, Web, PostgreSQL are internal Docker network only.     | Single attack surface. UFW blocks everything else.                                               |
| **R6**  | **UFW firewall on VPS** — allow 22, 80, 443. Deny all others.                                                             | Defense in depth. Even if a port is accidentally exposed in compose, UFW blocks it.              |
| **R7**  | **Log rotation on every service** — `max-size: 10m`, `max-file: 5`.                                                       | Prevent disk exhaustion from container logs.                                                     |
| **R8**  | **Let's Encrypt mounted directly** — `/etc/letsencrypt` on host → Nginx container via volume.                             | Cert renewal is automatic (certbot on host). Nginx always sees live certs.                       |
| **R9**  | **WebSocket via `map` directive** — `map $http_upgrade $connection_upgrade` in nginx.conf.                                | Standard, robust Socket.IO handling.                                                             |
| **R10** | **Single `.env.production` file** — gitignored, `chmod 600`, referenced by compose `env_file`.                            | All secrets in one place. Never committed.                                                       |
| **R11** | **Dockerfiles build from monorepo root context** — `context: .` in compose, Dockerfile in app folder.                     | Workspace packages (`@hassad/shared`) resolve correctly. No hacks.                               |
| **R12** | **Healthchecks on API and Web** — Docker waits for healthy before routing traffic.                                        | No traffic to half-started containers.                                                           |

---

## 2. Architecture Overview

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │    Nginx       │  ports 80, 443 (only public ports)
              │  (reverse      │
              │   proxy)       │
              └───┬────────┬───┘
                  │        │
    /v1/*         │        │  /* (everything else)
                  ▼        ▼
          ┌──────────┐  ┌──────────┐
          │   API    │  │   Web    │
          │ NestJS   │  │ Next.js  │
          │ :3001    │  │ :3000    │
          └────┬─────┘  └──────────┘
               │
               ▼
          ┌──────────┐
          │PostgreSQL│
          │   :5432  │
          └──────────┘

All inter-service communication: Docker internal network
All hostnames: api, web, postgres
```

---

## 3. File Structure

```
hassad-platform/
├── docker-compose.prod.yml          # THE deployment file
├── .env.production.example          # template (committed)
├── .env.production                  # real secrets (gitignored, chmod 600)
├── .dockerignore                    # root-level — prevents sending node_modules, .git, etc. to Docker daemon
├── .gitignore                       # includes .env.production
├── PRODUCTION.md                    # this file
│
├── apps/
│   ├── api/
│   │   ├── Dockerfile               # multi-stage NestJS build
│   │   ├── .dockerignore
│   │   └── prisma/
│   │       └── migrations/          # committed migration history
│   └── web/
│       ├── Dockerfile               # multi-stage Next.js build
│       └── .dockerignore
│
├── nginx/
│   ├── nginx.conf                   # main config + map directive
│   └── conf.d/
│       │   ├── hassad.conf.https.template  # HTTPS server block (used when DOMAIN is set)
    │   └── hassad.conf.http.template   # HTTP-only server block (used when DOMAIN is empty)
│
└── scripts/
    └── entrypoint.sh                # migrate deploy → start API
```

---

## 4. Development Workflow: Prisma Migrations

**This is a change from the current `prisma db push` workflow.**

### When you modify `apps/api/prisma/schema.prisma`:

```bash
cd apps/api
npx prisma migrate dev --name describe_your_change
# Example: npx prisma migrate dev --name add_invoice_table

# This generates:
# apps/api/prisma/migrations/<timestamp>_describe_your_change/migration.sql

# Commit the migration folder!
git add apps/api/prisma/migrations/
git commit -m "feat(db): add invoice table"
```

### In production (automatic via entrypoint.sh):

```bash
npx prisma migrate deploy   # applies pending migrations, no drift risk
npx prisma generate         # rebuild Prisma client
node dist/main.js           # start API
```

### Why this matters:

- Migration files are **versioned** and **reviewable** in pull requests.
- `migrate deploy` applies only what hasn't been applied — safe for repeated runs.
- Rollback is possible by reverting a migration commit and deploying.
- No risk of `db push` accidentally dropping columns or data.

---

## 5. VPS One-Time Setup

```bash
# 1. Install Docker + Compose
sudo apt update && sudo apt install docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Log out and back in for group membership to take effect

# 2. Firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose   # verify

# 3. Let's Encrypt (Certbot) — only if you have a domain
# Skip this section if using IP-only mode (DOMAIN is empty).

sudo apt install certbot python3-certbot-nginx

# Option A: Obtain cert using Nginx plugin (recommended)
sudo certbot --nginx -d ${DOMAIN}

# Option B: Standalone mode (if Nginx is not yet running)
sudo certbot certonly --standalone -d ${DOMAIN}
# ⚠️ For renewal: certbot renew --pre-hook "docker compose -f /opt/hassad/docker-compose.prod.yml stop nginx" --post-hook "docker compose -f /opt/hassad/docker-compose.prod.yml start nginx"

# Certs land in /etc/letsencrypt/live/${DOMAIN}/
# Auto-renewal is handled by certbot systemd timer (verify: systemctl status certbot.timer)

# 4. Clone repo
git clone <repo-url> /opt/hassad
cd /opt/hassad

# 5. Create .env.production from template
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production   # fill in real secrets
```

---

## 6. Deploy Command

```bash
cd /opt/hassad
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**That's it.** One command. DB migrations run automatically. Nginx picks up renewed certs automatically.

### Useful operational commands:

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=100 api
docker compose -f docker-compose.prod.yml logs -f --tail=100 web

# Restart a single service
docker compose -f docker-compose.prod.yml restart api

# Reload Nginx after config change
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Database backup (using container name — more reliable, works in cron)
docker exec hassad-postgres pg_dump -U hassad hassad | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip -c backup_20260114.sql.gz | docker exec -i hassad-postgres psql -U hassad hassad

# Check health
docker compose -f docker-compose.prod.yml ps
curl -s https://yourdomain.com/v1/health | jq
```

---

## 7. Quick Reference: What Goes Where

| Concern              | Where                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Add a new env var    | `.env.production.example` (template) + `.env.production` (real) + `docker-compose.prod.yml` (pass to service)                    |
| Change DB schema     | `schema.prisma` → `prisma migrate dev` → commit migration folder                                                                 |
| Change Nginx routing | Edit `nginx/conf.d/hassad.conf.https.template` (or `.http.template`) → `docker compose restart nginx` (envsubst runs at startup) |
| Add a new service    | `docker-compose.prod.yml` + Dockerfile in its folder                                                                             |
| Renew TLS cert       | Automatic (certbot systemd timer). Ensure `/etc/letsencrypt` is mounted in compose.                                              |
| Backup DB            | `docker exec hassad-postgres pg_dump ...` (see section 6)                                                                        |
| View logs            | `docker compose logs -f --tail=100 <service>`                                                                                    |

---

## 8. Rules for Anyone Editing This Setup

1. **Never expose a port directly** — only Nginx has `ports:` in compose. Everything else communicates over internal Docker network (`api`, `web`, `postgres` as hostnames).

2. **Never put secrets in Dockerfiles** — use build `args:` in compose, passed from `.env.production`.

3. **Never skip the migration step** — schema change → `prisma migrate dev` → commit migration. No exceptions.

4. **Never bind-mount PostgreSQL data** — always use the named volume `postgres_data`.

5. **Always include log rotation** — every new service gets the `logging:` block:

   ```yaml
   logging:
     driver: json-file
     options:
       max-size: "10m"
       max-file: "5"
   ```

6. **Always add healthchecks** — every new service defines `healthcheck:` in compose.

7. **Keep `.env.production` out of git** — it's in `.gitignore`. Only `.env.production.example` is committed.

8. **Build from monorepo root** — all Dockerfiles assume `context: .` (the repo root), not the app folder. The Dockerfile path is specified via `dockerfile:` in compose.

9. **Maintain the root `.dockerignore`** — without it, Docker sends `node_modules`, `.git`, `.next`, `dist`, and other junk to the daemon on every build. Keep it updated when new build artifacts appear.

10. **Never pass secrets as Docker build args** — only public URLs (like `NEXT_PUBLIC_API_URL`) go in build args. Secrets like `JWT_SECRET` are injected at runtime via `env_file`. Build args are embedded in the image layers and visible via `docker history`.

11. **Use the `map` directive for WebSocket upgrades** — in `nginx/nginx.conf`:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

Then in location blocks: `proxy_set_header Connection $connection_upgrade;`

12. **Mount Let's Encrypt live directory, never copy certs** — in compose:

    ```yaml
    volumes:
      - /etc/letsencrypt/live/${DOMAIN}/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
      - /etc/letsencrypt/live/${DOMAIN}/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
    ```

13. **Single source of truth: `DOMAIN` (or `SERVER_IP`)** — `.env.production` has two variables:

- `DOMAIN=yourdomain.com` — set this for production with HTTPS
- `SERVER_IP=123.45.67.89` — always required, used as fallback when DOMAIN is empty

All URLs auto-adapt: `https://${DOMAIN:-${SERVER_IP}}`. Change one variable, everything follows.

---

## 9. Environment Variables Reference

### `.env.production` — all variables needed

> **⚠️ Two modes:**
>
> - **With domain:** set `DOMAIN=yourdomain.com` → HTTPS + TLS certs
> - **IP-only (fallback):** leave `DOMAIN` empty → HTTP only, access via `http://<SERVER_IP>`  
>   All URLs auto-adapt based on whether `DOMAIN` is set.

```bash
# ── Domain / IP (SET ONE OF THESE) ─────────────────
DOMAIN=yourdomain.com    # Your domain. Leave EMPTY to use IP-only mode.
SERVER_IP=123.45.67.89   # Your VPS public IP. Always required.

# ── PostgreSQL ─────────────────────────────────────
POSTGRES_USER=hassad
POSTGRES_PASSWORD=<strong_random_password>
POSTGRES_DB=hassad
# DATABASE_URL is auto-constructed in docker-compose.yml from POSTGRES variables
DATABASE_URL=postgresql://hassad:<POSTGRES_PASSWORD>@postgres:5432/hassad

# ── JWT Secrets ────────────────────────────────────
JWT_SECRET=<long_random_string>
JWT_REFRESH_SECRET=<long_random_string>
# Required: stable high-entropy secret used to encrypt database-backed AI provider API keys.
KEY_ENCRYPTION_SECRET=<stable_random_string>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_TOKEN_MAX_AGE=3600000
COOKIE_REFRESH_TOKEN_MAX_AGE=604800000

# ── API ────────────────────────────────────────────
PORT=3001
NODE_ENV=production
# WEB_URL, FRONTEND_URL auto-constructed from DOMAIN (or SERVER_IP if DOMAIN is empty)

# ── Web (Next.js) ──────────────────────────────────
# NEXT_PUBLIC_API_URL, APP_URL auto-constructed from DOMAIN (or SERVER_IP fallback)

# ── Email (SMTP) ───────────────────────────────────
SMTP_HOST=<your_smtp_host>
SMTP_PORT=587
SMTP_USER=<your_smtp_user>
SMTP_PASS=<your_smtp_password>
# SMTP_FROM auto-constructed from DOMAIN (or noreply@<SERVER_IP> fallback)

# ── File Storage (Cloudflare R2) ───────────────────
CLOUDFLARE_R2_BUCKET=<bucket_name>
CLOUDFLARE_R2_ENDPOINT=<endpoint_url>
CLOUDFLARE_R2_ACCESS_KEY=<access_key>
CLOUDFLARE_R2_SECRET_KEY=<secret_key>
CLOUDFLARE_R2_PUBLIC_DOMAIN=<public_domain>

# ── Payments (Moyasar) ─────────────────────────────
MOYASAR_API_KEY=<api_key>

# ── Google OAuth ───────────────────────────────────
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
# GOOGLE_CALLBACK_URL auto-constructed from DOMAIN (or SERVER_IP fallback)
# ⚠️ OAuth providers require a real domain. IP-only mode won't work with OAuth.

# ── Snapchat OAuth ─────────────────────────────────
SNAPCHAT_CLIENT_ID=<client_id>
SNAPCHAT_CLIENT_SECRET=<client_secret>
# SNAPCHAT_CALLBACK_URL auto-constructed from DOMAIN (or SERVER_IP fallback)

# ── AI providers ───────────────────────────────────
# Providers and API keys are managed in the admin AI settings; do not put keys here.
# If baseUrl is omitted or blank, the API persists these defaults:
# OpenAI:     https://api.openai.com/v1
# OpenRouter: https://openrouter.ai/api/v1
# Anthropic:  https://api.anthropic.com/v1
# Google:     https://generativelanguage.googleapis.com
```

---

## 10. docker-compose.prod.yml Specification

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
    # No ports exposed — internal Docker network only

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    env_file: .env.production
    environment:
      - WEB_URL=https://${DOMAIN:-${SERVER_IP}}
      - FRONTEND_URL=https://${DOMAIN:-${SERVER_IP}}
      - GOOGLE_CALLBACK_URL=https://${DOMAIN:-${SERVER_IP}}/v1/auth/google/callback
      - SNAPCHAT_CALLBACK_URL=https://${DOMAIN:-${SERVER_IP}}/v1/auth/snapchat/callback
      - SMTP_FROM=Hassad Platform <noreply@${DOMAIN:-${SERVER_IP}}>
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
    # No ports exposed

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=https://${DOMAIN:-${SERVER_IP}}/v1
    restart: always
    env_file: .env.production
    environment:
      - APP_URL=https://${DOMAIN:-${SERVER_IP}}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      api:
        condition: service_healthy
    healthcheck:
      test:
        ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
    # No ports exposed

  nginx:
    image: nginx:1.27-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN=${DOMAIN}
      - SERVER_IP=${SERVER_IP}
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d/hassad.conf.https.template:/etc/nginx/conf.d/hassad.conf.https.template:ro
      - ./nginx/conf.d/hassad.conf.http.template:/etc/nginx/conf.d/hassad.conf.http.template:ro
      - /etc/letsencrypt/live/${DOMAIN:-dummy}/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
      - /etc/letsencrypt/live/${DOMAIN:-dummy}/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
    command: /bin/sh -c "if [ -n \"$${DOMAIN}\" ]; then envsubst '$${DOMAIN}' < /etc/nginx/conf.d/hassad.conf.https.template > /etc/nginx/conf.d/hassad.conf; else envsubst '$${SERVER_IP}' < /etc/nginx/conf.d/hassad.conf.http.template > /etc/nginx/conf.d/hassad.conf; fi && nginx -g 'daemon off;'"
    depends_on:
      - api
      - web
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

volumes:
  postgres_data:
    driver: local
```

---

## 11. Nginx Configuration Specification

### `nginx/nginx.conf`

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # ── WebSocket upgrade mapping (Rule R9) ──
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    include /etc/nginx/conf.d/*.conf;
}
```

### `nginx/conf.d/hassad.conf.https.template`

> **Used when `DOMAIN` is set.** `${DOMAIN}` is replaced at container startup by `envsubst`. Provides full HTTPS with TLS certificates.

```nginx
upstream api_backend {
    server api:3001;
}

upstream web_backend {
    server web:3000;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    client_max_body_size 50m;

    # ── API routes (with WebSocket support for Socket.IO) ──
    location /v1/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (uses map from nginx.conf)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
    }

    # ── Next.js app (everything else) ──
    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### `nginx/conf.d/hassad.conf.http.template`

> **Used when `DOMAIN` is empty (IP-only fallback).** `${SERVER_IP}` is replaced at container startup. HTTP only — no TLS.

```nginx
upstream api_backend {
    server api:3001;
}

upstream web_backend {
    server web:3000;
}

server {
    listen 80;
    server_name ${SERVER_IP};

    client_max_body_size 50m;

    # ── API routes (with WebSocket support for Socket.IO) ──
    location /v1/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
    }

    # ── Next.js app (everything else) ──
    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 12. Dockerfile Specifications

### `apps/api/Dockerfile`

```dockerfile
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
```

### `apps/web/Dockerfile`

```dockerfile
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
```

### `apps/api/.dockerignore`

```
node_modules/
dist/
.env
.env.example
.git
.gitignore
*.md
```

### `apps/web/.dockerignore`

```
node_modules/
.next/
.env.local
.env.example
.git
.gitignore
*.md
```

### Root `.dockerignore` (at `hassad-platform/.dockerignore`)

**Critical** — without this, Docker sends the entire repo (including `node_modules`, `.git`, build artifacts) to the daemon on every build, making builds slow and potentially leaking local env files into the image.

```
node_modules/
.git/
.next/
dist/
coverage/
.env
.env.*
*.md
nginx/ssl/
backups/
```

---

## 13. Entrypoint Script

### `scripts/entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Starting API server..."
exec node dist/main.js
```

---

## 14. .gitignore Additions

Add these lines to the root `.gitignore`:

```
# Production
.env.production
nginx/ssl/
```

### Root `.dockerignore` (create at project root — see §12 for full spec)

```
node_modules/
.git/
.next/
dist/
coverage/
.env
.env.*
*.md
nginx/ssl/
backups/
```

---

## 15. Backup Strategy

### Automated daily backup (add to VPS crontab):

> **Important:** Use `docker exec <container-name>` instead of `docker compose exec` in cron.
> `docker compose` relies on the working directory and compose file path, which may not be available in cron's minimal environment. Find the container name with `docker ps --format '{{.Names}}' | grep postgres`.

```bash
# /etc/cron.d/hassad-backup
# Container name is: hassad-postgres (verify with docker ps)
0 3 * * * root docker exec hassad-postgres pg_dump -U hassad hassad | gzip > /backups/hassad/hassad_$(date +\%Y\%m\%d).sql.gz
0 0 * * 0 root find /backups/hassad/ -name "*.gz" -mtime +30 -delete
```

### Offsite replication (optional):

```bash
# Add to cron after the dump line:
rsync -avz /backups/hassad/ user@offsite-server:/backups/hassad/
```

---

## 16. Troubleshooting

| Symptom               | Check                                                         |
| --------------------- | ------------------------------------------------------------- |
| 502 Bad Gateway       | `docker compose ps` — are api/web healthy?                    |
| DB connection refused | `docker compose logs postgres` — is it healthy?               |
| Nginx config error    | `docker compose exec nginx nginx -t`                          |
| Certs expired         | `sudo certbot renew --dry-run`                                |
| Disk full             | `docker system prune -a` (cleans old images), check log sizes |
| Migration stuck       | `docker compose exec api npx prisma migrate status`           |
