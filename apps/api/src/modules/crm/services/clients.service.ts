import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateClientDto,
  UpdateClientDto,
  HandoverClientDto,
} from "../dto/client.dto";
import { BusinessType, ClientKind, ClientStatus } from "@hassad/shared";
import { CanonicalClientService } from "../../requests/canonical-client.service";
type AdminClientCreationInput = {
  email: string;
  phoneWhatsapp: string;
  accountManager?: string;
};

const BCRYPT_ROUNDS = 12;

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private readonly canonicalClientService: CanonicalClientService,
  ) {}

  async createAdminClient(
    adminId: string,
    dto: AdminClientCreationInput,
    tx?: Prisma.TransactionClient,
  ) {
    const email = dto.email.trim().toLowerCase();
    const phoneWhatsapp = dto.phoneWhatsapp.trim();
    if (!phoneWhatsapp) {
      throw new BadRequestException({
        code: "PHONE_WHATSAPP_REQUIRED",
        details: { field: "phoneWhatsapp" },
      });
    }
    const pendingIntakeName = "PENDING_INTAKE";

    const create = async (tx: Prisma.TransactionClient) => {
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictException({
          code: "EMAIL_ALREADY_IN_USE",
          details: { email },
        });
      }

      let accountManagerId: string | undefined;
      if (dto.accountManager) {
        const manager = await tx.user.findFirst({
          where: {
            id: dto.accountManager,
            isActive: true,
            role: { name: "SALES" },
          },
          select: { id: true },
        });
        if (!manager) {
          throw new BadRequestException({
            code: "INVALID_ACCOUNT_MANAGER",
            details: { accountManager: dto.accountManager },
          });
        }
        accountManagerId = manager.id;
      }

      const role = await tx.role.findFirst({ where: { name: "CLIENT" } });
      if (!role) {
        throw new BadRequestException({
          code: "CLIENT_ROLE_NOT_FOUND",
          details: {},
        });
      }

      const user = await tx.user.create({
        data: {
          name: email.split("@")[0],
          email,
          phoneWhatsapp,
          passwordHash: null,
          passwordSetAt: null,
          roleId: role.id,
        },
      });

      // Do not use the generic canonical upsert here: its legacy business-name
      // fallback could merge two pending-intake accounts with the same placeholder.
      const client = await tx.client.create({
        data: {
          userId: user.id,
          companyName: pendingIntakeName,
          businessName: pendingIntakeName,
          businessType: BusinessType.OTHER,
          accountManager: accountManagerId,
          kind: ClientKind.LEAD,
          status: ClientStatus.ACTIVE,
          intakeCompleted: false,
        },
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId: client.id,
          userId: adminId,
          eventType: "CLIENT_CREATED",
          description: "CLIENT_CREATED",
          metadata: { source: "ADMIN_ONBOARDING", intakeCompleted: false },
        },
      });

      return { clientId: client.id, userId: user.id };
    };

    return tx ? create(tx) : this.prisma.$transaction(create);
  }

  async create(userId: string, dto: CreateClientDto) {
    const { client } = await this.prisma.$transaction(async (tx) => {
      let newUserId: string | null = null;

      if (dto.password && dto.email) {
        const existingUser = await tx.user.findUnique({
          where: { email: dto.email.trim().toLowerCase() },
        });
        if (existingUser) {
          throw new ConflictException({
            code: "EMAIL_ALREADY_IN_USE",
            details: { email: dto.email.trim().toLowerCase() },
          });
        }

        const role = await tx.role.findFirst({
          where: { name: "CLIENT" },
        });
        if (!role) {
          throw new BadRequestException({
            code: "CLIENT_ROLE_NOT_FOUND",
            details: {},
          });
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await tx.user.create({
          data: {
            name: dto.contactName || dto.email.split("@")[0],
            email: dto.email.trim().toLowerCase(),
            // OWNERSHIP: User owns phone — single source of truth for
            // personal identity. Client.phoneWhatsapp is a CRM-side
            // legacy field kept for backward compatibility.
            phoneWhatsapp: dto.phoneWhatsapp || null,
            passwordHash,
            roleId: role.id,
          },
        });
        newUserId = user.id;
      }

      const nameFallback =
        dto.contactName ||
        (dto.email ? dto.email.split("@")[0] : null) ||
        "UNNAMED_CLIENT";

      const result = await this.canonicalClientService.upsertCanonicalClient(
        tx,
        {
          userId: newUserId,
          companyName: dto.companyName || nameFallback,
          businessName: dto.businessName || dto.companyName || nameFallback,
          businessType: dto.businessType || BusinessType.OTHER,
          preferredManagerId: dto.accountManager ?? null,
          kind: ClientKind.LEAD,
          status: ClientStatus.ACTIVE,
        },
      );

      await tx.clientHistoryLog.create({
        data: {
          clientId: result.client.id,
          userId,
          eventType: result.created ? "CLIENT_CREATED" : "CLIENT_UPDATED",
          description: result.created
            ? "CLIENT_CREATED"
            : "CLIENT_PROFILE_REFRESHED",
        },
      });

      return { client: result.client, created: result.created };
    });

    return client;
  }

  async findAll(filters: {
    kind?: ClientKind;
    status?: ClientStatus;
    search?: string;
    page?: number;
    limit?: number;
    includeCounters?: boolean;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: Prisma.ClientWhereInput = {};
    if (filters.kind) where.kind = filters.kind;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { businessName: { contains: filters.search, mode: "insensitive" } },
        {
          manager: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          user: {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              {
                phoneWhatsapp: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: {
          manager: { select: { id: true, name: true } },
          profile: filters.includeCounters ? true : undefined,
          // Personal identity lives on `User` (joined via userId).
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneWhatsapp: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllForSales(filters: {
    kind?: ClientKind;
    status?: ClientStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await this.findAll(filters);
    return {
      ...result,
      items: result.items.map(
        ({
          portalAccessToken: _portalAccessToken,
          portalTokenExpiresAt: _portalTokenExpiresAt,
          ...client
        }) => client,
      ),
    };
  }

  async findOneForSales(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        businessName: true,
        businessType: true,
        accountManager: true,
        kind: true,
        status: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspendReason: true,
        suspendedById: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        intakeCompleted: true,
        totalProjects: true,
        activeProjects: true,
        completedProjects: true,
        cancelledProjects: true,
        totalContractValue: true,
        totalInvoiced: true,
        totalPaid: true,
        lastProjectAt: true,
        avgSatisfactionScore: true,
        manager: { select: { id: true, name: true, email: true } },
        profile: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneWhatsapp: true,
            avatarUrl: true,
          },
        },
        historyLogs: {
          orderBy: { occurredAt: "desc" },
          take: 50,
          select: {
            id: true,
            eventType: true,
            description: true,
            occurredAt: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { id },
      });
    }

    return client;
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        manager: true,
        contracts: true,
        projects: {
          where: { isArchived: false },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        profile: true,
        // Personal identity (name, email, phone) on `User`.
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneWhatsapp: true,
            avatarUrl: true,
          },
        },
        historyLogs: {
          orderBy: { occurredAt: "desc" },
          take: 50,
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { id },
      });
    }

    return client;
  }

  async update(id: string, userId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId: id,
        userId,
        eventType: "CLIENT_UPDATED",
        description: "Client record updated",
      },
    });

    return client;
  }

  async getActivity(id: string) {
    return this.prisma.clientHistoryLog.findMany({
      where: { clientId: id },
      include: {
        user: true,
      },
      orderBy: { occurredAt: "desc" },
    });
  }

  async handover(_id: string, _userId: string, _dto: HandoverClientDto) {
    throw new BadRequestException({
      code: "CLIENT_HANDOVER_DISABLED",
      details: {},
    });
  }
}
