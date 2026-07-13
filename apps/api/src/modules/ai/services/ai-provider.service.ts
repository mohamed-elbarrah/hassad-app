import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { EncryptionService } from "../encryption/encryption.service";
import { AiProviderRegistry } from "./ai-provider-registry.service";
import { AiProvider as AiProviderType, Prisma } from "@prisma/client";

type ProviderJson = Omit<AiProviderType, "apiKey"> & { apiKey: string };

@Injectable()
export class AiProviderService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private registry: AiProviderRegistry,
  ) {}

  async findAll() {
    const rows = await this.prisma.aiProvider.findMany({
      orderBy: { priority: "asc" },
    });
    return rows.map((row) => this.maskKey(row));
  }

  async findOne(id: string) {
    const row = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("AI provider not found");
    return this.maskKey(row);
  }

  async create(data: Prisma.AiProviderCreateInput) {
    const row = await this.prisma.aiProvider.create({
      data: {
        ...data,
        apiKey: this.encryption.encrypt(data.apiKey),
      },
    });
    await this.registry.refresh();
    return this.maskKey(row);
  }

  async update(id: string, data: Prisma.AiProviderUpdateInput) {
    await this.findOne(id);

    const updateData = { ...data } as Record<string, unknown>;
    if (typeof data.apiKey === "string") {
      updateData.apiKey = this.encryption.encrypt(data.apiKey);
    }

    const row = await this.prisma.aiProvider.update({
      where: { id },
      data: updateData,
    });
    await this.registry.refresh();
    return this.maskKey(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.aiProvider.delete({ where: { id } });
    await this.registry.refresh();
  }

  async refreshRegistry() {
    await this.registry.refresh();
  }

  private maskKey(row: AiProviderType): ProviderJson {
    return {
      ...row,
      apiKey: row.apiKey ? "••••••••" + row.apiKey.slice(-4) : "",
    };
  }
}
