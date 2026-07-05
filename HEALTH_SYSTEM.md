# Hassad Platform - Health Monitoring System

## Overview

A comprehensive, production-ready health monitoring system that provides real-time visibility into system health, external service status, and error tracking.

## Features

### 🏥 Health Checks

- **Liveness Check** (`/health/live`) - Quick check for load balancers
- **Readiness Check** (`/health/ready`) - Verifies critical dependencies (DB, memory)
- **Detailed Health Check** (`/health`) - Full system health with all services
- **Health Summary** (`/health/summary`) - Aggregated dashboard data

### 📊 Service Monitoring

Monitors the following external services:

- **Database (PostgreSQL)** - Connection and query performance
- **R2 Storage (Cloudflare)** - Object storage connectivity
- **SMTP** - Email service status
- **Stripe** - Payment gateway health

### 🚨 Error Logging & Tracking

- Automatic error capture from HTTP requests
- Categorized errors (Database, Storage, Auth, etc.)
- Stack trace preservation
- Error resolution workflow
- Historical error analytics

### 📈 Historical Data

- Health check history with scoring
- Service response time trends
- Error frequency analysis
- Configurable retention

## API Endpoints

### Health Endpoints

```
GET  /health                    # Full health check (Admin only)
GET  /health/live               # Liveness probe (Public)
GET  /health/ready              # Readiness probe (Public)
GET  /health/summary            # Dashboard summary (Admin only)
GET  /health/history            # Historical data (Admin only)
GET  /health/services          # Service statuses (Admin only)
```

### Error Endpoints

```
GET  /health/errors             # Error log with filtering (Admin only)
GET  /health/errors/stats       # Error statistics (Admin only)
GET  /health/errors/unresolved-count  # Count of unresolved errors
POST /health/errors/:id/resolve      # Mark error as resolved
```

### Admin Endpoints (Updated)

```
GET  /admin/health              # Backward compatible health data
```

## Database Schema

### SystemHealthCheck

Stores periodic health snapshots:

- `status`: HEALTHY | DEGRADED | UNHEALTHY
- `overallScore`: 0-100 health score
- `components`: JSON blob of all component statuses
- `memoryUsed`, `memoryTotal`, `cpuUsage`: System metrics
- `totalResponseTime`: Check duration

### SystemError

Persistent error log:

- `level`: ERROR | WARN | INFO
- `category`: DATABASE | STORAGE | AUTH | etc.
- `message`, `stackTrace`: Error details
- `context`: JSON metadata (userId, requestId, etc.)
- `service`, `endpoint`: Source location
- `resolved`, `resolvedAt`, `resolutionNote`: Resolution tracking

### ExternalServiceHealth

Service status tracking:

- `serviceName`: R2_STORAGE | SMTP | STRIPE | DATABASE
- `status`: UP | DEGRADED | DOWN
- `responseTime`: Last check response time
- `lastError`, `lastErrorAt`: Last failure info
- `consecutiveFailures`: For alerting
- `timeoutThreshold`, `degradationThreshold`: Configurable limits

## Frontend Dashboard

### Components

1. **HealthStatusCard**: Overall system health with score
2. **ServiceHealthCard**: Individual service status with details
3. **ErrorLogTable**: Sortable/filterable error log with resolution
4. **ErrorStats**: Error distribution by category

### Features

- Real-time health updates
- Service response times
- Error categorization and filtering
- Error resolution workflow
- Historical health trends

### Usage

```typescript
// Get current health
const { data: health } = useGetHealthQuery();

// Get error statistics
const { data: errorStats } = useGetErrorStatsQuery(24); // 24 hours

// Get service statuses
const { data: services } = useGetServiceHealthQuery();

// Get recent errors
const { data: errors } = useGetErrorsQuery({ hours: 24, limit: 50 });

// Resolve an error
const [resolveError] = useResolveErrorMutation();
await resolveError({ id: errorId, note: "Fixed in commit abc123" });
```

## Error Categories

- **DATABASE**: PostgreSQL/Prisma errors
- **STORAGE**: R2/object storage errors
- **AUTH**: Authentication/authorization errors
- **EMAIL**: SMTP/email service errors
- **PAYMENT_GATEWAY**: Stripe/payment errors
- **AI_SERVICE**: AI/Gemini errors
- **NETWORK**: Network/timeout errors
- **MEMORY**: Memory exhaustion errors
- **GENERAL**: Uncategorized errors

## Configuration

### Environment Variables

```env
# Existing (already configured)
DATABASE_URL=postgresql://...
CLOUDFLARE_R2_*=...
SMTP_*=...
STRIPE_*=...

# No new env vars required!
```

### Service Thresholds

Default thresholds (configurable per service):

- **Timeout**: 5000ms (mark as DOWN)
- **Degradation**: 2000ms (mark as DEGRADED)

## Error Tracking

The system automatically captures and categorizes errors:

1. **HTTP Exception Filter**: Catches all unhandled errors
2. **Automatic Categorization**: Based on path and error message
3. **Context Preservation**: User ID, request path, stack trace
4. **Database Persistence**: Stored in `system_errors` table

### Manual Error Logging

```typescript
// In any service
constructor(private errorLogger: ErrorLoggerService) {}

async someMethod() {
  try {
    // ... code
  } catch (error) {
    await this.errorLogger.logError({
      level: ErrorLevel.ERROR,
      category: ErrorCategory.STORAGE,
      message: "Failed to upload file",
      error,
      context: { fileId, userId },
      service: "MyService",
    });
  }
}
```

## Health Score Calculation

```
Score = (Healthy Components / Total Components) × 100

Status:
- HEALTHY: Score = 100%, all critical services UP
- DEGRADED: Score 50-99%, or non-critical services down
- UNHEALTHY: Score < 50%, or critical services (DB) down
```

## Monitoring Best Practices

1. **Check Frequency**: Every 30 seconds for dashboards
2. **Alerting**: Alert when `consecutiveFailures >= 3`
3. **Resolution**: Always add resolution notes for context
4. **Review**: Weekly review of unresolved errors

## Migration from Old System

The old `/admin/health` endpoint is preserved for backward compatibility:

- Returns basic health status
- Includes new `overallScore` field
- Includes `services` array
- Includes `unresolvedErrors` count

For full features, use the new `/health/*` endpoints.

## Production Checklist

- [x] Database migrations applied
- [x] Prisma client generated
- [x] Health module registered
- [x] Exception filter updated
- [x] Frontend dashboard created
- [x] Redux store updated
- [x] All builds successful

## Troubleshooting

### Health checks return empty

- Verify Prisma client is generated: `npx prisma generate`
- Check database connection
- Verify HealthModule is imported in AppModule

### Errors not being logged

- Check HttpExceptionFilter is properly registered in main.ts
- Verify ErrorLoggerService is in HealthModule providers
- Check console for database write errors

### Services show as DOWN

- Check environment variables are set
- Verify network connectivity
- Check service-specific logs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Admin Dashboard                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ /health  │ │ /errors  │ │/services │
            └────┬─────┘ └────┬─────┘ └────┬─────┘
                 │            │            │
        ┌────────┴────────────┴────────────┴────────┐
        │            Health Module                  │
        │  ┌─────────────┐    ┌──────────────────┐  │
        │  │   Health    │    │  ErrorLogger     │  │
        │  │ Controller  │    │  Service         │  │
        │  └──────┬──────┘    └────────┬─────────┘  │
        │         │                     │            │
        │  ┌──────┴──────┐    ┌─────────┴────────┐  │
        │  │ Health      │    │ HealthPersistence│  │
        │  │ Indicators  │    │ Service          │  │
        │  └──────┬──────┘    └────────┬─────────┘  │
        │         │                     │            │
        └─────────┼─────────────────────┼────────────┘
                  │                     │
        ┌─────────▼─────────┐  ┌────────▼─────────┐
        │   Terminus        │  │   Prisma        │
        │   (Health Checks) │  │   (Database)    │
        └───────────────────┘  └─────────────────┘
```

## License

Part of Hassad Platform - Internal use only.
