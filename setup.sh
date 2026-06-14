#!/bin/bash
set -e

echo "================================================"
echo "  Hassad Platform - Production Setup"
echo "================================================"
echo ""

# Check if .env.production already exists
if [ -f .env.production ]; then
    echo "⚠️  .env.production already exists. Skipping generation."
    echo "   Delete it first if you want to regenerate: rm .env.production"
    echo ""
else
    echo "📝 Generating .env.production from template..."
    cp .env.production.example .env.production

    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 64)
    JWT_REFRESH_SECRET=$(openssl rand -hex 64 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 64)
    POSTGRES_PASSWORD=$(openssl rand -hex 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 16)

    # Prompt for domain and IP
    echo ""
    read -p "Enter your domain (leave empty for IP-only mode): " DOMAIN_INPUT
    read -p "Enter your VPS public IP: " SERVER_IP_INPUT

    # Replace placeholders
    sed -i "s/DOMAIN=.*/DOMAIN=${DOMAIN_INPUT}/" .env.production
    sed -i "s/SERVER_IP=.*/SERVER_IP=${SERVER_IP_INPUT}/" .env.production
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env.production
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" .env.production
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" .env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://hassad:${POSTGRES_PASSWORD}@postgres:5432/hassad|" .env.production

    chmod 600 .env.production
    echo ""
    echo "✅ .env.production created with random secrets."
    echo ""
fi

echo "🚀 Starting deployment..."
echo ""
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "================================================"
echo "  Deployment complete!"
echo "================================================"
echo ""
if [ -n "$DOMAIN_INPUT" ]; then
    echo "🌐 Your app should be available at: https://${DOMAIN_INPUT}"
    echo ""
    echo "📋 Next step: Get TLS certificate"
    echo "   sudo certbot --nginx -d ${DOMAIN_INPUT}"
else
    echo "🌐 Your app should be available at: http://${SERVER_IP_INPUT}"
fi
echo ""
echo "📊 Check status:  docker compose -f docker-compose.prod.yml ps"
echo "📋 View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo ""
