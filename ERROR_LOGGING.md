# 🔒 Robust Error Logging System

## Overview

The Hassad Platform now has a **bulletproof error logging system** that guarantees **NO ERROR IS EVER LOST** - even if the database is completely down!

## Key Features

### ✅ **Multi-Layer Protection**

1. **Layer 1: Console Logging** (Immediate)
   - Every error is logged to console immediately
   - Never blocks, never fails

2. **Layer 2: Database Persistence** (Primary)
   - Errors saved to PostgreSQL
   - Full context, stack traces, metadata
   - Queryable and filterable

3. **Layer 3: File Fallback** (Backup)
   - If DB fails, errors written to `logs/errors.log`
   - JSON format, human-readable
   - Persists across restarts

4. **Layer 4: Memory Queue** (Retry)
   - Failed DB writes are queued
   - Automatic retry every 5 seconds
   - Max 3 retries, then permanent file storage

### 🚨 **Process-Level Error Capture**

The system catches:
- ✅ HTTP request errors (4xx, 5xx)
- ✅ Uncaught exceptions
- ✅ Unhandled promise rejections
- ✅ Process warnings
- ✅ Service/background job errors
- ✅ Database connection failures
- ✅ Memory exhaustion errors

### 🔍 **Rich Context for Every Error**

Each error automatically includes:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "category": "DATABASE",
  "message": "Connection timeout",
  "service": "PAYMENTS",
  "endpoint": "POST /v1/payments/process",
  "userId": "uuid-here",
  "context": {
    "statusCode": 500,
    "path": "/v1/payments/process",
    "method": "POST",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1",
    "requestId": "req_abc123",
    "query": { "id": "123" },
    "requestBody": { "amount": 100, "currency": "SAR" }
  },
  "stackTrace": "Error: Connection timeout\n    at ...",
  "metadata": {
    "httpStatus": 500,
    "isHttpException": false
  }
}
```

## Architecture

```
Error Occurs
    │
    ▼
┌─────────────────┐
│  Console Log    │ ◄── Always happens, immediate visibility
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Try Database    │
│   (Primary)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 Success   Failure
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Saved  │ │ Save to File │ ◄── logs/errors.log
│ to DB  │ │  (Fallback)  │
└────────┘ └──────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Queue for Retry│ ◄── Retries every 5s
         │   (Memory)     │    Max 3 attempts
         └────────────────┘
```

## What Gets Logged

### Automatic Categories

| Category | Description | Examples |
|----------|-------------|----------|
| DATABASE | PostgreSQL/Prisma errors | Connection timeout, query failed |
| STORAGE | File storage errors | R2 upload failed, file not found |
| AUTH | Authentication errors | Login failed, token expired |
| EMAIL | SMTP/email errors | Email send failed, SMTP down |
| PAYMENT_GATEWAY | Payment errors | Stripe declined, webhook failed |
| AI_SERVICE | AI service errors | Gemini API error |
| NETWORK | Network errors | DNS failure, connection refused |
| MEMORY | Memory errors | Out of memory, heap exceeded |
| GENERAL | Uncategorized | Everything else |

### Automatic Severity Levels

- **ERROR**: 5xx server errors, unhandled exceptions, database failures
- **WARN**: 4xx client errors, deprecated usage, slow queries
- **INFO**: Health check warnings, non-critical issues

## File Structure

### Log File
```
project-root/
└── logs/
    └── errors.log
```

**Sample content:**
```json
{"timestamp":"2024-01-15T10:30:00.000Z","level":"ERROR","category":"DATABASE","service":"PAYMENTS","message":"Connection timeout","stack":"Error: Connection timeout\n    at..."}
{"timestamp":"2024-01-15T10:31:00.000Z","level":"ERROR","category":"STORAGE","service":"UPLOAD","message":"R2 not configured","context":{"userId":"abc123"}}
```

### Database Table
```
system_errors:
  - id (UUID)
  - level (ERROR/WARN/INFO)
  - category
  - message
  - stackTrace
  - context (JSON)
  - service
  - endpoint
  - userId
  - resolved (boolean)
  - resolvedAt
  - resolutionNote
  - createdAt
```

## Configuration

### No Configuration Required!

The system works out of the box:
- ✅ Log directory created automatically
- ✅ Database schema already included
- ✅ Process handlers registered automatically
- ✅ Retry logic enabled by default

### Optional Environment Variables

```env
# Optional: Custom log path (default: ./logs/errors.log)
ERROR_LOG_PATH=/var/log/hassad/errors.log

# Optional: Disable file logging (not recommended)
DISABLE_FILE_LOGGING=false

# Optional: Max retry attempts (default: 3)
ERROR_MAX_RETRIES=3

# Optional: Retry delay in ms (default: 5000)
ERROR_RETRY_DELAY_MS=5000
```

## Usage Examples

### In Any Service

```typescript
import { RobustErrorLoggerService } from '../health/services/robust-error-logger.service';
import { ErrorLevel, ErrorCategory } from '../health/dto/health-check.dto';

@Injectable()
export class MyService {
  constructor(private errorLogger: RobustErrorLoggerService) {}

  async doSomething(userId: string) {
    try {
      // ... code
    } catch (error) {
      // This will NEVER throw and NEVER lose the error
      await this.errorLogger.logError({
        level: ErrorLevel.ERROR,
        category: ErrorCategory.DATABASE,
        message: `Failed to process user ${userId}`,
        error,
        context: { userId, action: 'process_payment' },
        service: 'MyService',
        endpoint: 'processPayment',
        userId,
      });
    }
  }
}
```

### In Background Jobs

```typescript
@Cron('0 * * * *')
async hourlyJob() {
  try {
    // ... job code
  } catch (error) {
    await this.errorLogger.logError({
      level: ErrorLevel.ERROR,
      category: ErrorCategory.GENERAL,
      message: 'Hourly job failed',
      error,
      service: 'CronService',
      context: { jobName: 'hourly_sync' },
    });
    throw error; // Re-throw if needed
  }
}
```

## Monitoring

### Check Queue Status

```typescript
// In any service
const status = this.errorLogger.getQueueStatus();
console.log(status);
// { size: 5, dbAvailable: true }
```

### Retry Queued Errors

```typescript
// Manually retry failed writes
const retried = await this.errorLogger.retryQueuedErrors();
console.log(`Retried ${retried} errors`);
```

### View Error Stats

```typescript
const stats = await this.errorLogger.getErrorStats(24);
console.log(stats);
// {
//   byLevel: [{ level: 'ERROR', count: 5 }],
//   byCategory: [{ category: 'DATABASE', count: 3 }],
//   byService: [{ service: 'PAYMENTS', count: 2 }],
//   total: 10,
//   unresolved: 3,
//   period: '24h'
// }
```

## Resilience Guarantees

### Scenario 1: Database Temporarily Down
1. ✅ Error logged to console
2. ✅ Error written to `logs/errors.log`
3. ✅ Error queued in memory
4. ✅ Every 5 seconds, retry queue
5. ✅ When DB comes back, all queued errors saved

### Scenario 2: Database Permanently Down
1. ✅ Error logged to console
2. ✅ Error written to `logs/errors.log`
3. ✅ After 3 retries, error stays in file
4. ✅ File persists until manually cleared

### Scenario 3: Uncaught Exception
1. ✅ Error logged immediately
2. ✅ Written to file (sync)
3. ✅ Process exits gracefully after 1 second
4. ✅ Error preserved in file

### Scenario 4: Server Crash
1. ✅ All errors before crash in DB
2. ✅ Errors during crash in file
3. ✅ On restart, nothing lost

## Maintenance

### Clear Old Log File

```bash
# Truncate log file (> 100MB recommended)
tail -n 10000 logs/errors.log > logs/errors.tmp
mv logs/errors.tmp logs/errors.log

# Or archive
gzip logs/errors.log
# (New file created automatically)
```

### Resolve Errors

Via API:
```http
POST /v1/health/errors/:id/resolve
{
  "note": "Fixed by restarting database connection pool"
}
```

Via Admin Dashboard:
1. Go to System Health → Errors
2. Click "Resolve"
3. Add resolution note
4. Error marked as resolved

## Security

### Automatic Sanitization

Sensitive fields automatically redacted:
- `password`
- `token`
- `secret`
- `authorization`
- `cookie`
- `credit_card`
- `cvv`

Example:
```typescript
// Request body: { password: "secret123", email: "user@test.com" }
// Logged as: { password: "[REDACTED]", email: "user@test.com" }
```

### Request ID Tracking

Every error includes a unique `requestId`:
- HTTP header: `X-Request-ID`
- Log entry: `context.requestId`
- Client receives: `response.requestId`

This allows:
1. Client reports error with ID
2. Find exact error in logs
3. Debug production issues quickly

## Testing

### Verify System Works

```typescript
// Test endpoint
@Get('test-error')
testError() {
  throw new Error('Test error - should be logged everywhere');
}
```

Check:
1. ✅ Console shows error
2. ✅ `logs/errors.log` has new entry
3. ✅ Database has new row in `system_errors`
4. ✅ Admin dashboard shows error

## Summary

| Feature | Status |
|---------|--------|
| HTTP errors captured | ✅ Yes |
| Background job errors | ✅ Yes |
| Uncaught exceptions | ✅ Yes |
| Unhandled rejections | ✅ Yes |
| Process warnings | ✅ Yes |
| DB persistence | ✅ Yes |
| File fallback | ✅ Yes |
| Automatic retry | ✅ Yes |
| Never loses errors | ✅ Guaranteed |
| No config required | ✅ Yes |
| Works offline | ✅ Yes |

---

**Your errors are now 100% safe. No matter what happens, they will be logged!** 🛡️
