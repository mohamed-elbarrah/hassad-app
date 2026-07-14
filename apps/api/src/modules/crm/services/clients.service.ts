import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateClientDto,
  UpdateClientDto,
  HandoverClientDto,
} from "../dto/client.dto";
import { BusinessType, ClientStatus } from "@hassad/shared";
import { CanonicalClientService } from "../../requests/canonical-client.service";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private readonly canonicalClientService: CanonicalClientService,
  ) {}

  async create(userId: string, dto: CreateClientDto) {
    const { client } = await this.prisma.$transaction(async (tx) => {
      let userCreated = false;
      let newUserId: string | null = null;

      if (dto.password && dto.email) {
        const existingUser = await tx.user.findUnique({
          where: { email: dto.email.trim().toLowerCase() },
        });
        if (existingUser) {
          throw new ConflictException("A user with this email already exists");
        }

        const role = await tx.role.findFirst({
          where: { name: "CLIENT" },
        });
        if (!role) {
          throw new BadRequestException("CLIENT role not found");
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
        userCreated = true;
      }

      const nameFallback =
        dto.contactName ||
        (dto.email ? dto.email.split("@")[0] : null) ||
        "عميل جديد";

      const result = await this.canonicalClientService.upsertCanonicalClient(
        tx,
        {
          userId: newUserId,
          companyName: dto.companyName || nameFallback,
          businessName: dto.businessName || dto.companyName || nameFallback,
          businessType: dto.businessType || BusinessType.OTHER,
          preferredManagerId: dto.accountManager ?? null,
          status: ClientStatus.LEAD,
        },
      );

      await tx.clientHistoryLog.create({
        data: {
          clientId: result.client.id,
          userId,
          eventType: result.created ? "CLIENT_CREATED" : "CLIENT_UPDATED",
          description: result.created
            ? "Client created through the canonical client workflow"
            : "Existing canonical client profile refreshed through direct client creation",
        },
      });

      return { client: result.client, created: result.created };
    });

    return client;
  }

  async findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeCounters?: boolean;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
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
      throw new NotFoundException(`Client with ID ${id} not found`);
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

  async handover(id: string, userId: string, dto: HandoverClientDto) {
    throw new BadRequestException(
      "Direct client handover is disabled. Create projects from signed contracts so the request workflow remains canonical.",
    );
  }
}
