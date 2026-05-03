import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateServiceCatalogDto, UpdateServiceCatalogDto, CreateDeliverableTemplateDto } from '../dto/service-catalog.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateServiceCatalogDto) {
    return this.prisma.serviceCatalog.create({
      data: {
        name: dto.name,
        nameAr: dto.nameAr,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        category: dto.category,
        estimatedDays: dto.estimatedDays ?? 30,
        basePrice: dto.basePrice ?? 0,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.serviceCatalog.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { deliverableTemplates: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.serviceCatalog.findUnique({
      where: { id },
      include: { deliverableTemplates: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!service) throw new NotFoundException(`Service with ID ${id} not found`);
    return service;
  }

  async update(id: string, dto: UpdateServiceCatalogDto) {
    await this.findOne(id);
    return this.prisma.serviceCatalog.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.serviceCatalog.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addDeliverableTemplate(dto: CreateDeliverableTemplateDto) {
    await this.findOne(dto.serviceId);
    return this.prisma.deliverableTemplate.create({ data: dto });
  }

  async removeDeliverableTemplate(id: string) {
    const tmpl = await this.prisma.deliverableTemplate.findUnique({ where: { id } });
    if (!tmpl) throw new NotFoundException(`DeliverableTemplate with ID ${id} not found`);
    return this.prisma.deliverableTemplate.delete({ where: { id } });
  }
}