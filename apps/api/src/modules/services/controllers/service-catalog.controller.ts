import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServiceCatalogService } from '../services/service-catalog.service';
import { CreateServiceCatalogDto, UpdateServiceCatalogDto, CreateDeliverableTemplateDto } from '../dto/service-catalog.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

  @Post()
  @RequirePermissions('services.create')
  create(@Body() dto: CreateServiceCatalogDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions('services.read')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @RequirePermissions('services.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('services.update')
  update(@Param('id') id: string, @Body() dto: UpdateServiceCatalogDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('services.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('deliverable-templates')
  @RequirePermissions('services.create')
  addDeliverableTemplate(@Body() dto: CreateDeliverableTemplateDto) {
    return this.service.addDeliverableTemplate(dto);
  }

  @Delete('deliverable-templates/:id')
  @RequirePermissions('services.delete')
  removeDeliverableTemplate(@Param('id') id: string) {
    return this.service.removeDeliverableTemplate(id);
  }
}