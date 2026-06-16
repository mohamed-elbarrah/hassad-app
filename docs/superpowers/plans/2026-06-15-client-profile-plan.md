# Client Profile System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Client Profile entity with business context + project history, and a streamlined repeat-request flow where sales creates requests for existing clients without identity re-entry.

**Architecture:** New `ClientProfile` model (1:1 with Client, hybrid typed+Json columns) + denormalized counters on `Client` + enriched `ClientHistoryLog` event types + new `/requests/for-client` endpoint. Frontend adds tabbed client profile page (Sales/Admin), client list (Sales), simplified new-request modal, and portal improvements for returning clients.

**Tech Stack:** NestJS 11, Prisma 6, Next.js 16 App Router, Redux RTK Query, Tailwind CSS 4, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-06-15-client-profile-design.md`

---

## File Structure Map

```
apps/api/prisma/schema.prisma                            # MODIFY — add ClientProfile model, counters, DIRECT enum
apps/api/src/modules/crm/
  crm.module.ts                                           # MODIFY — register new services
  services/
    clients.service.ts                                    # MODIFY — include profile + counters in findOne/findAll
    client-profile.service.ts                             # CREATE — CRUD for ClientProfile
    client-counter.service.ts                             # CREATE — update denormalized counters on business events
  controllers/
    clients.controller.ts                                 # MODIFY — add profile endpoints
    client-profile.controller.ts                          # CREATE — profile CRUD endpoints
  dto/
    client-profile.dto.ts                                 # CREATE — UpsertClientProfileDto

apps/api/src/modules/requests/
  requests.module.ts                                      # MODIFY — register CreateRequestForClientService
  requests.service.ts                                     # MODIFY — add createForClient() method
  requests.controller.ts                                  # MODIFY — add POST /requests/for-client
  dto/
    request-for-client.dto.ts                             # CREATE — CreateRequestForClientDto

apps/api/src/scripts/
  backfill-client-profiles.ts                             # CREATE — empty profiles for existing ACTIVE clients
  backfill-client-counters.ts                             # CREATE — compute initial counter values

packages/shared/src/
  index.ts                                                # MODIFY — add ClientProfile type, update Client type
  schemas/client.schema.ts                                # MODIFY — add Zod schemas for profile

apps/web/features/
  clients/clientsApi.ts                                   # MODIFY — add profile endpoints
  requests/requestsApi.ts                                 # MODIFY — add for-client endpoint

apps/web/app/(dashboard)/dashboard/sales/clients/
  page.tsx                                                # CREATE — sales client list (wire ClientsTable)
  [id]/page.tsx                                           # CREATE — tabbed client profile (divert admin here too)

apps/web/app/(dashboard)/dashboard/admin/clients/
  [id]/page.tsx                                           # MODIFY — reuse sales profile page

apps/web/app/(dashboard)/dashboard/pm/projects/
  [id]/page.tsx                                           # MODIFY — add clickable client name

apps/web/app/(portal)/portal/
  new-order/page.tsx                                      # MODIFY — simplified form for returning clients
  profile/page.tsx                                        # CREATE — client's own read-only profile

apps/web/components/dashboard/crm/
  NewRequestForClientModal.tsx                            # CREATE — modal form (read-only identity + services)
  KanbanCard.tsx                                          # MODIFY — returning-client indicator + profile link
```

---

### Phase 1: Foundation — Database + API

### Task 1.1: Add ClientProfile model and Client counters to Prisma schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Add DIRECT to ClientSource enum**

```prisma
enum ClientSource {
  AD
  REFERRAL
  WEBSITE
  WHATSAPP
  PLATFORM
  DIRECT            // Added for returning-client requests
}
```

- [ ] **Add ClientProfile model after the Client model** (after the `ClientHistoryLog` model around line 288)

```prisma
/// 1:1 with Client. Stores business context and preferences.
/// Uses typed columns for queryable fields + customFields Json
/// for future extensibility without schema migrations.
model ClientProfile {
  id                      String   @id @default(uuid())
  clientId                String   @unique
  client                  Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  industry                String?
  businessDescription     String?  @db.Text
  targetAudience          String?
  budgetRangeMin          Float?
  budgetRangeMax          Float?
  communicationPreference String?
  preferredLanguage       String?  @default("ar")
  timezone                String?  @default("Asia/Riyadh")
  preferredPlatforms      String?
  competitors             Json?
  brandAssets             Json?
  customFields            Json?

  createdBy               String?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  @@map("client_profile")
}
```

- [ ] **Add denormalized counter fields to Client model**

Add these fields inside `model Client { ... }` block (after existing fields, before the closing `}`):

```prisma
  // === Denormalized counters (computed via events, not manual) ===
  totalProjects           Int      @default(0)
  activeProjects          Int      @default(0)
  completedProjects       Int      @default(0)
  cancelledProjects       Int      @default(0)
  totalContractValue      Float    @default(0)
  totalInvoiced           Float    @default(0)
  totalPaid               Float    @default(0)
  lastProjectAt           DateTime?
  avgSatisfactionScore    Float?

  // === New Relation ===
  profile                 ClientProfile?
  @@map("clients")
```

- [ ] **Push schema to DB**

Run: `npx prisma db push --skip-generate && npx prisma generate`
Expected: New `client_profile` table created, `clients` table has new columns, `ClientSource` updated

- [ ] **Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(db): add ClientProfile model and Client counters"
```

---

### Task 1.2: Create ClientProfile DTOs and shared types

**Files:**
- Create: `apps/api/src/modules/crm/dto/client-profile.dto.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/schemas/client.schema.ts`

- [ ] **Create UpsertClientProfileDto**

```typescript
// apps/api/src/modules/crm/dto/client-profile.dto.ts
import { IsOptional, IsString, IsNumber, IsArray, IsObject } from 'class-validator';

export class UpsertClientProfileDto {
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  budgetRangeMin?: number;

  @IsOptional()
  @IsNumber()
  budgetRangeMax?: number;

  @IsOptional()
  @IsString()
  communicationPreference?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  preferredPlatforms?: string;

  @IsOptional()
  @IsArray()
  competitors?: { name: string; url?: string; notes?: string }[];

  @IsOptional()
  @IsObject()
  brandAssets?: { logoUrl?: string; brandColors?: string[]; fonts?: string[]; guidelinesUrl?: string };

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
```

- [ ] **Add ClientProfile interface to shared package**

```typescript
// packages/shared/src/index.ts — add to the file, near the Client interface

export interface ClientProfile {
  id: string;
  clientId: string;
  industry?: string | null;
  businessDescription?: string | null;
  targetAudience?: string | null;
  budgetRangeMin?: number | null;
  budgetRangeMax?: number | null;
  communicationPreference?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  preferredPlatforms?: string | null;
  competitors?: { name: string; url?: string; notes?: string }[] | null;
  brandAssets?: { logoUrl?: string; brandColors?: string[]; fonts?: string[]; guidelinesUrl?: string } | null;
  customFields?: Record<string, unknown> | null;
}
```

- [ ] **Update Client interface in shared package — add missing fields**

```typescript
// packages/shared/src/index.ts — update Client interface
export interface Client {
  id: string;
  leadId?: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  businessName: string;
  businessType: BusinessType;
  accountManager?: string | null;
  status: ClientStatus;
  portalAccessToken?: string | null;
  portalTokenExpiresAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  // === ADDED ===
  userId?: string | null;
  intakeCompleted?: boolean;
  totalProjects?: number;
  activeProjects?: number;
  completedProjects?: number;
  cancelledProjects?: number;
  totalContractValue?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  avgSatisfactionScore?: number | null;
  profile?: ClientProfile | null;
}
```

- [ ] **Update Zod schemas**

```typescript
// packages/shared/src/schemas/client.schema.ts — add import
import { z } from 'zod';

export const UpsertClientProfileSchema = z.object({
  industry: z.string().optional(),
  businessDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  budgetRangeMin: z.number().positive().optional(),
  budgetRangeMax: z.number().positive().optional(),
  communicationPreference: z.enum(['email', 'whatsapp', 'phone', 'chat']).optional(),
  preferredLanguage: z.string().optional(),
  timezone: z.string().optional(),
  preferredPlatforms: z.string().optional(),
  competitors: z.array(z.object({
    name: z.string(),
    url: z.string().url().optional(),
    notes: z.string().optional(),
  })).optional(),
  brandAssets: z.object({
    logoUrl: z.string().url().optional(),
    brandColors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    guidelinesUrl: z.string().url().optional(),
  }).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export type UpsertClientProfileInput = z.infer<typeof UpsertClientProfileSchema>;
```

- [ ] **Build shared package**

Run: `npm --prefix packages/shared run build`
Expected: Build succeeds with new types

- [ ] **Commit**

```bash
git add apps/api/src/modules/crm/dto/client-profile.dto.ts \
       packages/shared/src/index.ts \
       packages/shared/src/schemas/client.schema.ts
git commit -m "feat(shared): add ClientProfile types and DTO"
```

---

### Task 1.3: Create ClientProfileService (CRUD + upsert)

**Files:**
- Create: `apps/api/src/modules/crm/services/client-profile.service.ts`

- [ ] **Create ClientProfileService with upsert, getByClientId, and update**

```typescript
// apps/api/src/modules/crm/services/client-profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertClientProfileDto } from '../dto/client-profile.dto';

@Injectable()
export class ClientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getByClientId(clientId: string) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });
    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }
    return profile;
  }

  async upsert(clientId: string, dto: UpsertClientProfileDto, userId?: string) {
    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });

    const data: any = { ...dto, createdBy: userId };

    const profile = existing
      ? await this.prisma.clientProfile.update({
          where: { clientId },
          data,
        })
      : await this.prisma.clientProfile.create({
          data: { ...data, clientId },
        });

    // Write history log
    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: userId || 'system',
        eventType: existing ? 'CLIENT_PROFILE_UPDATED' : 'CLIENT_PROFILE_CREATED',
        description: existing ? 'Client profile updated' : 'Client profile created',
        metadata: { profileId: profile.id },
      },
    });

    return profile;
  }

  async delete(clientId: string) {
    const existing = await this.prisma.clientProfile.findUnique({
      where: { clientId },
    });
    if (!existing) {
      throw new NotFoundException('Client profile not found');
    }
    await this.prisma.clientProfile.delete({
      where: { clientId },
    });
  }
}
```

- [ ] **Commit**

```bash
git add apps/api/src/modules/crm/services/client-profile.service.ts
git commit -m "feat(api): add ClientProfileService with upsert"
```

---

### Task 1.4: Create ClientCounterService

**Files:**
- Create: `apps/api/src/modules/crm/services/client-counter.service.ts`

- [ ] **Create ClientCounterService with recompute and event hooks**

```typescript
// apps/api/src/modules/crm/services/client-counter.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProjectStatus, InvoiceStatus, Prisma } from '@prisma/client';

@Injectable()
export class ClientCounterService {
  private readonly logger = new Logger(ClientCounterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recomputeAll(clientId: string): Promise<void> {
    const [
      projectStats,
      contractStats,
      invoiceStats,
      satisfactionStats,
      lastProject,
    ] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        where: { clientId, isArchived: false },
        _count: true,
      }),
      this.prisma.contract.aggregate({
        where: { clientId, status: { in: ['SIGNED', 'ACTIVE'] } },
        _sum: { totalValue: true },
      }),
      this.prisma.invoice.aggregate({
        where: { clientId, status: { in: ['PAID', 'PARTIAL'] } },
        _sum: { amount: true },
      }),
      this.prisma.satisfactionRating.aggregate({
        where: { clientId },
        _avg: { score: true },
      }),
      this.prisma.project.findFirst({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalProjects: projectStats.reduce((sum, g) => sum + g._count, 0),
        activeProjects: projectStats.find(g => g.status === 'ACTIVE')?._count ?? 0,
        completedProjects: projectStats.find(g => g.status === 'COMPLETED')?._count ?? 0,
        cancelledProjects: projectStats.find(g => g.status === 'CANCELLED')?._count ?? 0,
        totalContractValue: contractStats._sum.totalValue ?? 0,
        totalInvoiced: invoiceStats._sum.amount ?? 0,
        totalPaid: invoiceStats._sum.amount ?? 0,
        lastProjectAt: lastProject?.createdAt ?? null,
        avgSatisfactionScore: satisfactionStats._avg.score ?? null,
      },
    });

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: 'system',
        eventType: 'CLIENT_COUNTERS_UPDATED',
        description: 'Client counters recomputed',
      },
    });

    this.logger.log(`Recomputed counters for client ${clientId}`);
  }

  // Called as fire-and-forget after project status change
  async onProjectStatusChange(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (project) {
      await this.recomputeAll(project.clientId);
    }
  }

  // Called as fire-and-forget after invoice payment
  async onInvoicePaid(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { clientId: true },
    });
    if (invoice) {
      await this.recomputeAll(invoice.clientId);
    }
  }

  // Called as fire-and-forget after satisfaction rating
  async onSatisfactionRated(clientId: string): Promise<void> {
    await this.recomputeAll(clientId);
  }

  // Called as fire-and-forget after contract signed
  async onContractSigned(contractId: string): Promise<void> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { clientId: true },
    });
    if (contract) {
      await this.recomputeAll(contract.clientId);
    }
  }
}
```

- [ ] **Commit**

```bash
git add apps/api/src/modules/crm/services/client-counter.service.ts
git commit -m "feat(api): add ClientCounterService for denormalized counters"
```

---

### Task 1.5: Create ClientProfile controller and register in CRM module

**Files:**
- Create: `apps/api/src/modules/crm/controllers/client-profile.controller.ts`
- Modify: `apps/api/src/modules/crm/controllers/clients.controller.ts`
- Modify: `apps/api/src/modules/crm/crm.module.ts`

- [ ] **Create ClientProfileController**

```typescript
// apps/api/src/modules/crm/controllers/client-profile.controller.ts
import {
  Controller, Get, Put, Patch, Delete, Param, Body,
  UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { ClientProfileService } from '../services/client-profile.service';
import { UpsertClientProfileDto } from '../dto/client-profile.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientProfileController {
  constructor(private readonly profileService: ClientProfileService) {}

  @Get(':id/profile')
  @RequirePermissions('clients.read')
  async getProfile(@Param('id') id: string) {
    return this.profileService.getByClientId(id);
  }

  @Put(':id/profile')
  @RequirePermissions('clients.update')
  async upsertProfile(
    @Param('id') id: string,
    @Body() dto: UpsertClientProfileDto,
    @Req() req: any,
  ) {
    return this.profileService.upsert(id, dto, req.user?.id);
  }

  @Delete(':id/profile')
  @RequirePermissions('clients.update')
  async deleteProfile(@Param('id') id: string) {
    return this.profileService.delete(id);
  }
}
```

- [ ] **Update ClientsController — add profile + counters to findOne and findAll**

```typescript
// apps/api/src/modules/crm/controllers/clients.controller.ts
// Modify the findAll method to include counters when requested

// Add query param filter to include counters:
// In the controller, update findAll to accept includeCounters query param
// GET /clients?includeCounters=true

// Modify the findOne response to always include profile + counters:
// In the service, update findOne to include profile and all counter fields
```

- [ ] **Update ClientsService.findOne to include profile and counters**

```typescript
// apps/api/src/modules/crm/services/clients.service.ts
async findOne(id: string) {
  const client = await this.prisma.client.findUnique({
    where: { id },
    include: {
      manager: true,
      contracts: true,
      projects: {
        where: { isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      profile: true,  // ADDED
    },
  });
  if (!client) throw new NotFoundException('Client not found');
  return client;
}
```

- [ ] **Update findAll to support includeCounters**

```typescript
// apps/api/src/modules/crm/services/clients.service.ts
async findAll(filters: { status?: ClientStatus; search?: string; page?: number; limit?: number; includeCounters?: boolean }) {
  const { status, search, page = 1, limit = 20, includeCounters } = filters;
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    this.prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        manager: true,
        profile: includeCounters ? true : undefined,
        ...(includeCounters && {
          _count: { select: { projects: true } },
        }),
      },
    }),
    this.prisma.client.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Update clientsApi RTK query in Phase 2 with the actual frontend changes — skip for now**

- [ ] **Register ClientProfileService and ClientCounterService in CRM module**

```typescript
// apps/api/src/modules/crm/crm.module.ts
import { ClientProfileService } from './services/client-profile.service';
import { ClientCounterService } from './services/client-counter.service';
import { ClientProfileController } from './controllers/client-profile.controller';

@Module({
  imports: [NotificationsModule, RequestsModule],
  controllers: [
    LeadsController,
    ClientsController,
    AutomationController,
    ClientProfileController,    // ADDED
  ],
  providers: [
    LeadsService,
    ClientsService,
    AutomationService,
    ClientProfileService,       // ADDED
    ClientCounterService,       // ADDED
  ],
  exports: [
    LeadsService,
    ClientsService,
    ClientProfileService,       // ADDED — so other modules can use it
    ClientCounterService,       // ADDED
  ],
})
export class CrmModule {}
```

- [ ] **Build to verify no compilation errors**

Run: `npx turbo run build --filter=api`
Expected: Build succeeds

- [ ] **Commit**

```bash
git add apps/api/src/modules/crm/
git commit -m "feat(api): add ClientProfile controller and register services"
```

---

### Task 1.6: Create /requests/for-client endpoint

**Files:**
- Create: `apps/api/src/modules/requests/dto/request-for-client.dto.ts`
- Modify: `apps/api/src/modules/requests/requests.service.ts`
- Modify: `apps/api/src/modules/requests/requests.controller.ts`

- [ ] **Create CreateRequestForClientDto**

```typescript
// apps/api/src/modules/requests/dto/request-for-client.dto.ts
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestServiceItemDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRequestForClientDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @IsNotEmpty()
  services: RequestServiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Add createForClient method to RequestsService**

```typescript
// apps/api/src/modules/requests/requests.service.ts

async createForClient(
  dto: CreateRequestForClientDto,
  userId: string,
): Promise<any> {
  const client = await this.prisma.client.findUnique({
    where: { id: dto.clientId },
    include: { manager: true },
  });
  if (!client) {
    throw new NotFoundException('Client not found');
  }
  if (client.status === 'STOPPED') {
    throw new BadRequestException('Cannot create request for a stopped client');
  }

  // Resolve sales rep: prefer account manager, fall back to auto-assignment
  let salesId = client.accountManager;
  if (!salesId) {
    const assignment = await this.salesAssignmentService.findBestSales(dto.clientId);
    salesId = assignment?.id;
  }

  // Create request inside a transaction
  const request = await this.prisma.$transaction(async (tx) => {
    const req = await tx.request.create({
      data: {
        clientId: dto.clientId,
        submittedBy: userId,
        assignedSalesId: salesId,
        source: 'DIRECT',
        status: 'SUBMITTED',
        notes: dto.notes,
        // Deprecated identity fields left null — read from client relation
        companyName: '',
        contactName: '',
        phoneWhatsapp: '',
        businessName: '',
        businessType: 'OTHER',
      },
    });

    // Create request services
    if (dto.services?.length) {
      await tx.requestService.createMany({
        data: dto.services.map((s) => ({
          requestId: req.id,
          serviceId: s.serviceId,
          quantity: s.quantity ?? 1,
          notes: s.notes,
        })),
      });
    }

    // Create initial status history
    await tx.requestStatusHistory.create({
      data: {
        requestId: req.id,
        fromStatus: null,
        toStatus: 'SUBMITTED',
        changedBy: userId,
        note: 'Request created for existing client',
      },
    });

    // Write client history log
    await tx.clientHistoryLog.create({
      data: {
        clientId: dto.clientId,
        userId,
        eventType: 'CLIENT_REQUEST_CREATED',
        description: 'New request created for existing client',
        metadata: { requestId: req.id },
      },
    });

    return req;
  });

  // After transaction: fire-and-forget notification
  if (salesId) {
    this.notificationService.sendNotification(...) // existing notification pattern
      .catch((err) => this.logger.error('Notification failed', err));
  }

  return this.findOne(request.id);
}
```

- [ ] **Add route to RequestsController**

```typescript
// apps/api/src/modules/requests/requests.controller.ts

@Post('requests/for-client')
@RequirePermissions('leads.create')
async createForClient(
  @Body() dto: CreateRequestForClientDto,
  @Req() req: any,
) {
  return this.requestsService.createForClient(dto, req.user.id);
}
```

- [ ] **Register DTO in module**

```typescript
// apps/api/src/modules/requests/requests.module.ts — no change needed if using global ValidationPipe
```

- [ ] **Build to verify**

Run: `npx turbo run build --filter=api`
Expected: Build succeeds

- [ ] **Commit**

```bash
git add apps/api/src/modules/requests/
git commit -m "feat(api): add POST /requests/for-client endpoint"
```

---

### Task 1.7: Wire counter hooks into business events

**Files:**
- Modify: `apps/api/src/modules/projects/projects.service.ts` (or wherever project status changes)
- Modify: `apps/api/src/modules/finance/invoices.service.ts` (or wherever invoice payments happen)
- Modify: `apps/api/src/modules/crm/services/satisfaction.service.ts` (or wherever satisfaction is rated)

- [ ] **Inject ClientCounterService into relevant modules**

For each module that triggers a counter-relevant event, inject `ClientCounterService` and call the appropriate method after the core transaction commits. Follow the existing fire-and-forget pattern used for notifications.

Example for project status change:

```typescript
// Where project status changes (e.g., projects.service.ts or wherever status transitions happen)
import { ClientCounterService } from '../../crm/services/client-counter.service';

@Injectable()
export class ProjectsService {
  constructor(
    // ... existing deps
    private readonly clientCounterService: ClientCounterService,
  ) {}

  async changeStatus(projectId: string, newStatus: ProjectStatus, userId: string) {
    // ... existing status change logic in transaction ...

    // After transaction: fire-and-forget counter update
    this.clientCounterService.onProjectStatusChange(projectId)
      .catch((err) => this.logger.error('Counter update failed', err));
  }
}
```

- [ ] **Register CrmModule in ProjectsModule and FinanceModule**

```typescript
// apps/api/src/modules/projects/projects.module.ts
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [ ..., CrmModule ],
})
export class ProjectsModule {}
```

- [ ] **Build to verify**

Run: `npx turbo run build --filter=api`
Expected: Build succeeds

- [ ] **Commit**

```bash
git add apps/api/src/modules/projects/ apps/api/src/modules/finance/
git commit -m "feat(api): wire ClientCounterService hooks into project and finance events"
```

---

### Task 1.8: Create backfill scripts

**Files:**
- Create: `apps/api/src/scripts/backfill-client-profiles.ts`
- Create: `apps/api/src/scripts/backfill-client-counters.ts`

- [ ] **Create backfill-client-profiles.ts**

```typescript
// apps/api/src/scripts/backfill-client-profiles.ts
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' apps/api/src/scripts/backfill-client-profiles.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const client of clients) {
    const existing = await prisma.clientProfile.findUnique({
      where: { clientId: client.id },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.clientProfile.create({
      data: { clientId: client.id },
    });
    created++;
    console.log(`Created profile for client ${client.id}`);
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Create backfill-client-counters.ts**

```typescript
// apps/api/src/scripts/backfill-client-counters.ts
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' apps/api/src/scripts/backfill-client-counters.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: { id: true },
  });

  for (const client of clients) {
    const [projectStats, contractStats, invoiceStats, satisfactionStats, lastProject] =
      await Promise.all([
        prisma.project.groupBy({
          by: ['status'],
          where: { clientId: client.id, isArchived: false },
          _count: true,
        }),
        prisma.contract.aggregate({
          where: { clientId: client.id, status: { in: ['SIGNED', 'ACTIVE'] } },
          _sum: { totalValue: true },
        }),
        prisma.invoice.aggregate({
          where: { clientId: client.id, status: 'PAID' },
          _sum: { amount: true },
        }),
        prisma.satisfactionRating.aggregate({
          where: { clientId: client.id },
          _avg: { score: true },
        }),
        prisma.project.findFirst({
          where: { clientId: client.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalProjects: projectStats.reduce((sum, g) => sum + g._count, 0),
        activeProjects: projectStats.find((g) => g.status === 'ACTIVE')?._count ?? 0,
        completedProjects: projectStats.find((g) => g.status === 'COMPLETED')?._count ?? 0,
        cancelledProjects: projectStats.find((g) => g.status === 'CANCELLED')?._count ?? 0,
        totalContractValue: contractStats._sum.totalValue ?? 0,
        totalInvoiced: invoiceStats._sum.amount ?? 0,
        totalPaid: invoiceStats._sum.amount ?? 0,
        lastProjectAt: lastProject?.createdAt ?? null,
        avgSatisfactionScore: satisfactionStats._avg.score ?? null,
      },
    });

    console.log(`Updated counters for client ${client.id}`);
  }

  console.log('Done. All counters backfilled.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Commit**

```bash
git add apps/api/src/scripts/
git commit -m "feat(scripts): add backfill scripts for client profiles and counters"
```

---

### Phase 2: Sales UI

### Task 2.1: Add client profile and for-client endpoints to frontend API slices

**Files:**
- Modify: `apps/web/features/clients/clientsApi.ts`
- Modify: `apps/web/features/requests/requestsApi.ts`

- [ ] **Add profile endpoints to clientsApi**

```typescript
// apps/web/features/clients/clientsApi.ts — add after existing endpoints

getClientProfile: builder.query<ClientProfile, string>({
  query: (id) => `/clients/${id}/profile`,
  providesTags: (_result, _err, id) => [{ type: 'ClientProfile', id }],
}),

upsertClientProfile: builder.mutation<ClientProfile, { id: string; data: UpsertClientProfileDto }>({
  query: ({ id, data }) => ({
    url: `/clients/${id}/profile`,
    method: 'PUT',
    body: data,
  }),
  invalidatesTags: (_result, _err, { id }) => [
    { type: 'ClientProfile', id },
    { type: 'Client', id },
  ],
}),
```

- [ ] **Add for-client endpoint to requestsApi**

```typescript
// apps/web/features/requests/requestsApi.ts — add after existing endpoints

createRequestForClient: builder.mutation<RequestItem, CreateRequestForClientDto>({
  query: (body) => ({
    url: '/requests/for-client',
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Request'],
}),
```

- [ ] **Add tag types at the top of each file**

```typescript
// clientsApi.ts — add 'ClientProfile' to tagTypes
const clientsApi = createApi({
  reducerPath: 'clientsApi',
  tagTypes: ['Client', 'ClientProfile', 'Project'],
  // ...
});
```

- [ ] **Build to verify**

Run: `npx turbo run build --filter=web`
Expected: Build succeeds (may need to import new types from shared)

- [ ] **Commit**

```bash
git add apps/web/features/clients/clientsApi.ts apps/web/features/requests/requestsApi.ts
git commit -m "feat(web): add client profile and for-client API endpoints"
```

---

### Task 2.2: Create sales client list page

**Files:**
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/page.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/layout.tsx` (if needed for nested layout)

- [ ] **Create sales clients page**

```tsx
// apps/web/app/(dashboard)/dashboard/sales/clients/page.tsx
'use client';

import { useState } from 'react';
import { ClientsTable } from '@/components/dashboard/crm/ClientsTable';
import { ClientFiltersBar } from '@/components/dashboard/crm/ClientFiltersBar';
import { useGetClientsQuery } from '@/features/clients/clientsApi';

export default function SalesClientsPage() {
  const [filters, setFilters] = useState({ status: '', search: '', includeCounters: true });
  const { data, isLoading } = useGetClientsQuery(filters);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">العملاء</h1>
        <p className="text-sm text-muted-foreground">
          إجمالي {data?.total ?? 0} عميل
        </p>
      </div>

      <ClientFiltersBar
        onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
      />

      <ClientsTable
        data={data?.items ?? []}
        isLoading={isLoading}
        onRowClick={(client) => {
          window.location.href = `/dashboard/sales/clients/${client.id}`;
        }}
      />
    </div>
  );
}
```

- [ ] **Create layout to maintain sidebar navigation**

```tsx
// apps/web/app/(dashboard)/dashboard/sales/layout.tsx
// If one doesn't exist, create a simple layout that renders children
// with the sales sidebar navigation already provided by the parent dashboard layout
```

- [ ] **Verify the page is accessible by navigating**

The sales dashboard already exists at `/dashboard/sales/` with sub-routes. Adding `clients/page.tsx` gives us `/dashboard/sales/clients`.

- [ ] **Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/sales/clients/
git commit -m "feat(web): add sales client list page with ClientsTable"
```

---

### Task 2.3: Build tabbed client profile page

**Files:**
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/page.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/overview-tab.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/projects-tab.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/finance-tab.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/activity-tab.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/profile-edit-tab.tsx`

- [ ] **Create the main profile page with tab navigation**

```tsx
// apps/web/app/(dashboard)/dashboard/sales/clients/[id]/page.tsx
'use client';

import { use } from 'react';
import { useState } from 'react';
import { useGetClientByIdQuery } from '@/features/clients/clientsApi';
import { useGetClientProfileQuery } from '@/features/clients/clientsApi';
import { ClientInfoCard } from '@/components/dashboard/crm/ClientInfoCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './overview-tab';
import { ProjectsTab } from './projects-tab';
import { FinanceTab } from './finance-tab';
import { ActivityTab } from './activity-tab';
import { ProfileEditTab } from './profile-edit-tab';
import { NewRequestForClientModal } from '@/components/dashboard/crm/NewRequestForClientModal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: client, isLoading } = useGetClientByIdQuery(id);
  const { data: profile } = useGetClientProfileQuery(id);
  const [showNewRequest, setShowNewRequest] = useState(false);

  if (isLoading || !client) return <div>Loading...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.companyName}</h1>
          <p className="text-sm text-muted-foreground">
            {client.contactName} • {client.phoneWhatsapp} • {client.email}
          </p>
        </div>
        <Button onClick={() => setShowNewRequest(true)}>
          <PlusCircle className="ml-2 h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      <ClientInfoCard client={client} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="projects">المشاريع</TabsTrigger>
          <TabsTrigger value="finance">المالية</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
          <TabsTrigger value="profile">الملف التعريفي</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab client={client} profile={profile} />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsTab clientId={id} />
        </TabsContent>
        <TabsContent value="finance">
          <FinanceTab clientId={id} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab clientId={id} />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileEditTab clientId={id} profile={profile} />
        </TabsContent>
      </Tabs>

      {showNewRequest && (
        <NewRequestForClientModal
          client={client}
          open={showNewRequest}
          onClose={() => setShowNewRequest(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Create OverviewTab**

```tsx
// apps/web/app/(dashboard)/dashboard/sales/clients/[id]/overview-tab.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OverviewTabProps {
  client: any;
  profile: any;
}

export function OverviewTab({ client, profile }: OverviewTabProps) {
  const stats = [
    { label: 'إجمالي المشاريع', value: client.totalProjects ?? 0 },
    { label: 'نشط', value: client.activeProjects ?? 0, color: 'text-green-600' },
    { label: 'مكتمل', value: client.completedProjects ?? 0, color: 'text-blue-600' },
    { label: 'ملغي', value: client.cancelledProjects ?? 0, color: 'text-red-600' },
    { label: 'إجمالي العقود', value: `SAR ${(client.totalContractValue ?? 0).toLocaleString()}` },
    { label: 'المدفوع', value: `SAR ${(client.totalPaid ?? 0).toLocaleString()}` },
    { label: 'تقييم الرضا', value: client.avgSatisfactionScore ? `${client.avgSatisfactionScore.toFixed(1)} / 5.0` : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stat.color ?? ''}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>نبذة عن العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.industry && (
              <p><span className="font-medium">المجال:</span> {profile.industry}</p>
            )}
            {profile.businessDescription && (
              <p><span className="font-medium">وصف النشاط:</span> {profile.businessDescription}</p>
            )}
            {profile.targetAudience && (
              <p><span className="font-medium">الجمهور المستهدف:</span> {profile.targetAudience}</p>
            )}
            {(profile.budgetRangeMin || profile.budgetRangeMax) && (
              <p>
                <span className="font-medium">الميزانية:</span>{' '}
                {profile.budgetRangeMin ? `SAR ${profile.budgetRangeMin.toLocaleString()}` : ''}
                {profile.budgetRangeMin && profile.budgetRangeMax ? ' — ' : ''}
                {profile.budgetRangeMax ? `SAR ${profile.budgetRangeMax.toLocaleString()}` : ''}
              </p>
            )}
            {profile.preferredPlatforms && (
              <p><span className="font-medium">المنصات المفضلة:</span> {profile.preferredPlatforms}</p>
            )}
          </CardContent>
        </Card>
      )}

      {client.lastProjectAt && (
        <Card>
          <CardHeader>
            <CardTitle>آخر نشاط</CardTitle>
          </CardHeader>
          <CardContent>
            <p>آخر مشروع: {new Date(client.lastProjectAt).toLocaleDateString('ar-SA')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Create remainder of tab components (simplified — reuse existing components where possible)**

ProjectsTab: Fetch `useGetProjectsQuery({ clientId })` and render a table with name, status, dates, PM.
FinanceTab: Fetch `useGetInvoicesQuery({ clientId })` and reuse finance components.
ActivityTab: Fetch `useGetClientActivityQuery(id)` and render existing `ClientTimeline`.
ProfileEditTab: Form for profile fields + `useUpsertClientProfileMutation`.

- [ ] **Build to verify**

Run: `npx turbo run build --filter=web`
Expected: Build succeeds

- [ ] **Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/sales/clients/[id]/
git commit -m "feat(web): add tabbed client profile page"
```

---

### Task 2.4: Create NewRequestForClientModal

**Files:**
- Create: `apps/web/components/dashboard/crm/NewRequestForClientModal.tsx`

- [ ] **Create modal component**

```tsx
// apps/web/components/dashboard/crm/NewRequestForClientModal.tsx
'use client';

import { useState } from 'react';
import { useGetServicesQuery } from '@/features/services/servicesApi';
import { useCreateRequestForClientMutation } from '@/features/requests/requestsApi';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  client: { id: string; companyName: string; contactName: string; phoneWhatsapp: string; businessName: string; businessType: string };
  open: boolean;
  onClose: () => void;
}

export function NewRequestForClientModal({ client, open, onClose }: Props) {
  const { data: services } = useGetServicesQuery({ isActive: true });
  const [createRequest, { isLoading }] = useCreateRequestForClientMutation();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error('يرجى اختيار خدمة واحدة على الأقل');
      return;
    }
    try {
      await createRequest({
        clientId: client.id,
        services: selectedServices.map((id) => ({ serviceId: id, quantity: 1 })),
        notes: notes || undefined,
      }).unwrap();
      toast.success('تم إنشاء الطلب بنجاح');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'فشل إنشاء الطلب');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب جديد — {client.companyName}</DialogTitle>
          <DialogDescription>
            إنشاء طلب جديد لصالح عميل حالي. بيانات العميل مقروءة فقط.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Read-only client info */}
          <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
            <p><span className="font-medium">الشركة:</span> {client.companyName}</p>
            <p><span className="font-medium">جهة الاتصال:</span> {client.contactName}</p>
            <p><span className="font-medium">الهاتف:</span> {client.phoneWhatsapp}</p>
            <p><span className="font-medium">نوع النشاط:</span> {client.businessType}</p>
          </div>

          {/* Service selection */}
          <div className="space-y-2">
            <p className="font-medium">الخدمات المطلوبة</p>
            <div className="grid grid-cols-1 gap-2">
              {services?.map((service: any) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices((prev) => [...prev, service.id]);
                      } else {
                        setSelectedServices((prev) => prev.filter((id) => id !== service.id));
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{service.nameAr}</p>
                    {service.descriptionAr && (
                      <p className="text-xs text-muted-foreground">{service.descriptionAr}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="font-medium">ملاحظات</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="وصف المشروع أو ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/components/dashboard/crm/NewRequestForClientModal.tsx
git commit -m "feat(web): add NewRequestForClientModal with read-only identity"
```

---

### Task 2.5: Enhance Kanban cards with returning-client indicator

**Files:**
- Modify: `apps/web/components/dashboard/crm/KanbanCard.tsx`

- [ ] **Add returning-client indicator to KanbanCard**

```tsx
// apps/web/components/dashboard/crm/KanbanCard.tsx — modify the existing card component

// Inside the card, after the companyName display:
{/* Returning client indicator */}
{request.client?.totalProjects > 0 && (
  <Link
    href={`/dashboard/sales/clients/${request.clientId}`}
    className="text-xs text-primary hover:underline"
    onClick={(e) => e.stopPropagation()}
  >
    ↳ {request.client.totalProjects} مشاريع سابقة
  </Link>
)}
```

The `GET /requests` endpoint already returns request data. We need to ensure it includes `client.totalProjects` in the response. This requires the backend to include the counter field when serializing requests.

- [ ] **Update RequestsService.findAll to include client counters**

```typescript
// apps/api/src/modules/requests/requests.service.ts
async findAll(filters: RequestFilters) {
  const { status, search, assignedSalesId, clientId, page = 1, limit = 50 } = filters;
  const where: any = {};
  if (status) where.status = status;
  if (assignedSalesId) where.assignedSalesId = assignedSalesId;
  if (clientId) where.clientId = clientId;

  const [items, total] = await Promise.all([
    this.prisma.request.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: true,
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            phoneWhatsapp: true,
            totalProjects: true,
            activeProjects: true,
          },
        },
        services: { include: { service: true } },
      },
    }),
    this.prisma.request.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Commit**

```bash
git add apps/web/components/dashboard/crm/KanbanCard.tsx apps/api/src/modules/requests/requests.service.ts
git commit -m "feat: add returning-client indicator to Kanban cards"
```

---

### Phase 3: PM, Admin, Portal

### Task 3.1: Add client link to PM project cards

**Files:**
- Modify: `apps/web/app/(dashboard)/dashboard/pm/projects/[id]/page.tsx` (or the project card component)

- [ ] **Find the project card/table component and add client name as clickable link**

The project model already has `clientId` relation. Ensure the PM project detail page shows the client name with a link to the read-only profile view.

- [ ] **Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/pm/
git commit -m "feat(web): add clickable client name to PM project pages"
```

---

### Task 3.2: Replace admin client detail placeholders

**Files:**
- Modify: `apps/web/app/(dashboard)/dashboard/admin/clients/[id]/page.tsx`

- [ ] **Reuse the sales profile page for admin**

Instead of maintaining two separate client detail pages, redirect or reuse the tabbed profile page for the admin route:

```tsx
// apps/web/app/(dashboard)/dashboard/admin/clients/[id]/page.tsx
'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

// Reuse the sales client profile page
const SalesClientProfile = dynamic(
  () => import('@/app/(dashboard)/dashboard/sales/clients/[id]/page'),
  { ssr: false },
);

export default function AdminClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SalesClientProfile params={Promise.resolve({ id })} />;
}
```

Alternatively, build a standalone admin page that reuses the same tab components:

```tsx
// Simplified: import the same tab components used in the sales profile
import { OverviewTab } from '../../sales/clients/[id]/overview-tab';
import { ProjectsTab } from '../../sales/clients/[id]/projects-tab';
// ... etc
```

- [ ] **Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/admin/clients/[id]/page.tsx
git commit -m "feat(web): replace admin client page placeholders with real profile tabs"
```

---

### Task 3.3: Update portal new-order page for returning clients

**Files:**
- Modify: `apps/web/app/(portal)/portal/new-order/page.tsx`

- [ ] **Modify the form to detect returning clients and show simplified view**

```tsx
// Add at the top of the component, before the form rendering:

// Check if this client has completed intake before (returning client)
const isReturningClient = client?.intakeCompleted === true;
```

When `isReturningClient` is true:
- Render identity fields as read-only text instead of editable inputs
- Keep service selection and description as interactive
- Show a label: "أنت عميل سابق — فقط أخبرنا بما تحتاج"

The existing form collects `companyName`, `contactName`, `phoneWhatsapp`, `email` in Step 1. For returning clients, skip Step 1 entirely and show the data as a read-only summary card before Step 2.

- [ ] **Commit**

```bash
git add apps/web/app/(portal)/portal/new-order/page.tsx
git commit -m "feat(web): simplify portal new-order for returning clients"
```

---

### Task 3.4: Add read-only profile view to portal

**Files:**
- Create: `apps/web/app/(portal)/portal/profile/page.tsx`

- [ ] **Create portal profile page**

```tsx
// apps/web/app/(portal)/portal/profile/page.tsx
'use client';

import { useGetClientProfileQuery } from '@/features/clients/clientsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalProfilePage() {
  // The user's clientId comes from auth state
  const { data: profile, isLoading } = useGetClientProfileQuery(clientId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-semibold">الملف التعريفي</h1>
      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle>معلومات النشاط التجاري</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.industry && <DisplayField label="المجال" value={profile.industry} />}
            {profile.businessDescription && <DisplayField label="وصف النشاط" value={profile.businessDescription} />}
            {profile.targetAudience && <DisplayField label="الجمهور المستهدف" value={profile.targetAudience} />}
            {/* ... other fields read-only */}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">لا توجد معلومات إضافية. يمكنك تحديث ملفك من خلال فريق المبيعات.</p>
      )}
    </div>
  );
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
```

- [ ] **Add link to profile in portal navigation**

The portal layout already has navigation links. Add a "الملف التعريفي" link.

- [ ] **Commit**

```bash
git add apps/web/app/(portal)/portal/profile/
git commit -m "feat(web): add read-only profile view to client portal"
```

---

### Phase 4: Deprecation & Cleanup

### Task 4.1: Stop writing deprecated identity fields to Request

**Files:**
- Modify: `apps/api/src/modules/requests/requests.service.ts`

- [ ] **Update createPortalRequest to leave identity fields null**

In the existing `createPortalRequest()` method, stop populating `companyName`, `contactName`, `phoneWhatsapp`, `email`, `businessName`, `businessType`. Instead, set them to empty strings (since they're `String` fields with no default in the schema) or make them nullable and leave them null.

```typescript
// In createPortalRequest — the request create call:
const request = await tx.request.create({
  data: {
    clientId: resolvedClient.id,
    submittedBy: clientUserId,
    assignedSalesId: salesAssignment?.id,
    companyName: '',       // deprecated — read from client
    contactName: '',       // deprecated
    phoneWhatsapp: '',     // deprecated
    businessName: '',      // deprecated
    businessType: 'OTHER', // deprecated
    source: dto.source,
    notes: notes,
  },
});
```

- [ ] **Update all frontend consumers to read identity from client relation**

Check these files:
- `KanbanCard.tsx` — reads `request.contactName`, `request.companyName` → change to `request.client.contactName`, `request.client.companyName`
- Request detail page — reads identity from request → change to `request.client`
- Portal requests list — reads identity from request → change to `request.client`

- [ ] **Commit**

```bash
git add apps/api/src/modules/requests/requests.service.ts apps/web/components/dashboard/crm/
git commit -m "refactor: stop writing deprecated identity fields on Request, read from client relation"
```

### Task 4.2: Drop deprecated columns (future — after verifying no regressions)

- [ ] **After Phase 4.1 is live and verified for at least one release cycle, remove the deprecated columns from Prisma schema**

```prisma
model Request {
  // Remove these fields entirely:
  // companyName  String    @map("company_name")
  // contactName  String    @map("contact_name")
  // phoneWhatsapp String   @map("phone_whatsapp")
  // email        String?
  // businessName String    @map("business_name")
  // businessType BusinessType  @map("business_type")
}
```

Run: `npx prisma db push`

- [ ] **Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "cleanup: drop deprecated identity columns from Request"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every requirement from the spec has a corresponding task (ClientProfile model, counters, DIRECT enum, profile endpoints, for-client endpoint, sales client list, tabbed profile, new-request modal, Kanban indicators, admin placeholders, portal simplified form, portal profile view, deprecation)
- [ ] **Placeholder scan:** No "TBD", "TODO", or incomplete code blocks
- [ ] **Type consistency:** `ClientProfile` type matches across shared package, DTOs, service, and frontend
