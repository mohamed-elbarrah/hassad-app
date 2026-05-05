import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateClientDto,
  UpdateClientDto,
  HandoverClientDto,
} from "../dto/client.dto";
import { ClientStatus } from "@hassad/shared";
import { CanonicalClientService } from "../../requests/canonical-client.service";

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private readonly canonicalClientService: CanonicalClientService,
  ) {}

  async create(userId: string, dto: CreateClientDto) {
    const { client } = await this.prisma.$transaction(async (tx) => {
      const result = await this.canonicalClientService.upsertCanonicalClient(
        tx,
        {
          email: dto.email ?? null,
          companyName: dto.companyName,
          contactName: dto.contactName,
          phoneWhatsapp: dto.phoneWhatsapp,
          businessName: dto.businessName,
          businessType: dto.businessType,
          preferredManagerId: dto.accountManager ?? null,
          status: ClientStatus.ACTIVE,
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

      return result;
    });

    return client;
  }

  async findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
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
        include: { manager: { select: { id: true, name: true } } },
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
        projects: true,
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
