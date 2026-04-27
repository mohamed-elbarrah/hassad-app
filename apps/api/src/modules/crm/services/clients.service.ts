import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateClientDto } from '../dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        manager: true,
      },
    });
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
        eventType: 'CLIENT_UPDATED',
        description: 'Client record updated',
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
      orderBy: { occurredAt: 'desc' },
    });
  }
}
