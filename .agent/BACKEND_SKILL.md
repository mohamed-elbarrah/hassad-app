# BACKEND_SKILL.md — Hassad Backend Standards

> Read AGENT.md first. This file governs all work inside `apps/api/`.

---

## Versions (locked)

```json
{
  "@nestjs/core": "^11.x",
  "@nestjs/common": "^11.x",
  "@nestjs/jwt": "^11.x",
  "@nestjs/passport": "^11.x",
  "@nestjs/schedule": "^5.x",
  "@nestjs/config": "^4.x",
  "prisma": "^6.x",
  "@prisma/client": "^6.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "typescript": "^5.x"
}
```

> NestJS 11 key changes from v10: improved module key generation (faster startup),
> JSON logging support in ConsoleLogger, ParseDatePipe added, cache-manager v6 (Keyv-based).

---

## Folder Structure (mandatory)

```
apps/api/
├── src/
│   ├── main.ts                   ← bootstrap, global pipes, CORS, prefix
│   ├── app.module.ts             ← root module, imports all feature modules
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   │
│   ├── clients/
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   └── dto/
│   │       ├── create-client.dto.ts
│   │       ├── update-client.dto.ts
│   │       └── client-filters.dto.ts
│   │
│   ├── projects/
│   ├── tasks/
│   ├── invoices/
│   ├── proposals/
│   ├── contracts/
│   ├── campaigns/
│   ├── notifications/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   └── pipes/
│   │       └── parse-pagination.pipe.ts
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── test/
```

**Rule:** One NestJS module per business domain. Never import one feature module's service into another — communicate through events or a shared service in `common/`.

---

## main.ts Bootstrap

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(), // NestJS 11 ConsoleLogger with JSON support
  })

  app.setGlobalPrefix('v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true,        // auto-transforms query params to their declared types
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
```

---

## Module Anatomy (every module follows this)

### 1. Controller — routing + input validation only

```typescript
// clients/clients.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UserRole } from '@hassad/shared'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { ClientFiltersDto } from './dto/client-filters.dto'
import type { JwtPayload } from '../auth/types'

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PM)
  findAll(@Query() filters: ClientFiltersDto, @CurrentUser() user: JwtPayload) {
    return this.clientsService.findAll(filters, user)
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PM)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.clientsService.findOne(id, user)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() dto: CreateClientDto, @CurrentUser() user: JwtPayload) {
    return this.clientsService.create(dto, user)
  }
}
```

**Rules for controllers:**
- No business logic — only call service methods
- No direct Prisma usage
- All routes must have explicit guards and role decorators
- Always pass the `user` from `@CurrentUser()` to the service for ownership/permission checks

---

### 2. Service — all business logic lives here

```typescript
// clients/clients.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { UserRole } from '@hassad/shared'
import { CreateClientDto } from './dto/create-client.dto'
import { ClientFiltersDto } from './dto/client-filters.dto'
import type { JwtPayload } from '../auth/types'

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ClientFiltersDto, user: JwtPayload) {
    const where: Prisma.ClientWhereInput = {}

    // SALES sees only their assigned clients
    if (user.role === UserRole.SALES) {
      where.assignedTo = user.id
    }

    if (filters.status) where.status = filters.status
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { businessName: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const page = filters.page ?? 1
    const limit = Math.min(filters.limit ?? 20, 100)

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          businessType: true,
          status: true,
          pipelineStage: true,
          assignedEmployee: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string, user: JwtPayload) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        proposals: { select: { id: true, status: true, createdAt: true } },
        contracts: { select: { id: true, status: true, value: true } },
        projects: { select: { id: true, status: true, progress: true } },
      },
    })

    if (!client) throw new NotFoundException(`Client ${id} not found`)

    if (user.role === UserRole.SALES && client.assignedTo !== user.id) {
      throw new ForbiddenException('You do not have access to this client')
    }

    return client
  }

  async create(dto: CreateClientDto, user: JwtPayload) {
    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          ...dto,
          assignedTo: user.id,
          status: 'LEAD',
          pipelineStage: 'NEW',
        },
      })

      await tx.clientActivity.create({
        data: { clientId: client.id, userId: user.id, action: 'CLIENT_CREATED' },
      })

      return client
    })
  }
}
```

---

### 3. DTOs — class-validator on every input

```typescript
// clients/dto/create-client.dto.ts
import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator'
import { BusinessType, ClientSource } from '@hassad/shared'

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  phone: string

  @IsOptional()
  @IsString()
  email?: string

  @IsString()
  @MinLength(2)
  businessName: string

  @IsEnum(BusinessType)
  businessType: BusinessType

  @IsEnum(ClientSource)
  source: ClientSource

  @IsOptional()
  @IsString()
  notes?: string
}
```

```typescript
// clients/dto/client-filters.dto.ts
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { ClientStatus } from '@hassad/shared'

export class ClientFiltersDto {
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}
```

---

## Prisma 6 Rules

### Always use `select` on list endpoints

```typescript
// ✅ Explicit field selection — fast
const client = await this.prisma.client.findUnique({
  where: { id },
  select: { id: true, name: true, phone: true, status: true },
})

// ❌ FORBIDDEN — loads entire record + triggers N+1 risk
const client = await this.prisma.client.findUnique({
  where: { id },
  // no select = all fields loaded
})
```

### Paginate every list

```typescript
// Every findMany must have skip + take
const [items, total] = await Promise.all([
  this.prisma.client.findMany({ where, skip, take, orderBy }),
  this.prisma.client.count({ where }),
])
```

### Use transactions for multi-table writes

```typescript
await this.prisma.$transaction(async (tx) => {
  const project = await tx.project.create({ data: projectData })
  await tx.clientActivity.create({ data: activityData })
  await tx.notification.create({ data: notificationData })
  return project
})
```

### Prisma 6 config file (prisma.config.ts)

```typescript
// prisma/prisma.config.ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL! },
})
```

---

## Performance Rules

### ✅ DO

- Index every column used in `WHERE`, `ORDER BY`, or foreign key joins
- Use `select` instead of `include` for list endpoints
- Use `Promise.all()` for independent parallel queries
- Use `@nestjs/schedule` Cron jobs for background work (invoice checks, contract alerts)
- Paginate every list — default 20, max 100

### ❌ FORBIDDEN

- N+1 queries — always use nested `select` / `include` instead of looping with queries
- `findMany` without `take` — always paginate
- Heavy computations inside request handlers — move to background jobs
- Querying inside a loop
- Disabling `ValidationPipe`'s `whitelist` — every endpoint must strip unknown fields

---

## Error Handling

Use NestJS built-in exceptions — never throw raw `Error`:

```typescript
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'

if (!client) throw new NotFoundException('Client not found')
if (!authorized) throw new ForbiddenException('Access denied')
```

Global exception filter formats all errors consistently:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Client not found",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/v1/clients/abc123"
}
```

---

## Response Format

All success responses go through `ResponseInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Paginated:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Module files | kebab-case | `clients.module.ts` |
| Classes | PascalCase | `ClientsService` |
| Methods | camelCase | `findAll`, `createClient` |
| Prisma fields | camelCase | `createdAt`, `assignedTo` |
| API routes | kebab-case | `/pipeline-stage` |
| DTO classes | PascalCase + `Dto` | `CreateClientDto` |
| Enum values | SCREAMING_SNAKE_CASE | `ClientStatus.NEW_LEAD` |

---

## ❌ What is Strictly Forbidden

1. **Business logic in controllers** — controllers route and delegate only
2. **Direct Prisma calls outside services** — never in controllers or guards
3. **`any` type** — use `unknown` or define proper types
4. **Missing guards on any endpoint** — every route must have explicit role restriction
5. **Unhandled promises** — always `await` or `.catch()`
6. **`@ts-ignore` / `@ts-nocheck`**
7. **Secrets in code** — environment variables only
8. **Skipping DTO validation** — every POST/PATCH body needs a validated DTO with `whitelist: true`
9. **Silent catch blocks** — always handle or rethrow
10. **Disabling `forbidNonWhitelisted`** — extra fields from clients must be rejected
