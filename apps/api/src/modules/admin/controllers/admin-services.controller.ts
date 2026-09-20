import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import {
  CreateAdminDeliverableTemplateDto,
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
} from "../../services/dto/service-catalog.dto";
import { ServiceCatalogService } from "../../services/services/service-catalog.service";

@Controller("admin/services")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminServicesController {
  constructor(private readonly serviceCatalog: ServiceCatalogService) {}

  @Get()
  @RequirePermissions("services.read")
  findAll() {
    return this.serviceCatalog.findAll(true);
  }

  @Get(":id")
  @RequirePermissions("services.read")
  findOne(@Param("id") id: string) {
    return this.serviceCatalog.findOne(id);
  }

  @Post()
  @RequirePermissions("services.create")
  create(@Body() dto: CreateServiceCatalogDto) {
    return this.serviceCatalog.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("services.update")
  update(@Param("id") id: string, @Body() dto: UpdateServiceCatalogDto) {
    return this.serviceCatalog.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("services.delete")
  archive(@Param("id") id: string) {
    return this.serviceCatalog.remove(id);
  }

  @Post(":id/deliverables")
  @RequirePermissions("services.create")
  addDeliverable(
    @Param("id") id: string,
    @Body() dto: CreateAdminDeliverableTemplateDto,
  ) {
    return this.serviceCatalog.addDeliverableTemplate({
      ...dto,
      serviceId: id,
    });
  }

  @Delete(":id/deliverables/:deliverableId")
  @RequirePermissions("services.delete")
  removeDeliverable(@Param("deliverableId") deliverableId: string) {
    return this.serviceCatalog.removeDeliverableTemplate(deliverableId);
  }
}
