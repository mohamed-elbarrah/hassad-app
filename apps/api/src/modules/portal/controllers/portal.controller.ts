import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from '../services/portal.service';
import { CreateDeliverableDto, CreateRevisionDto, CreateIntakeFormDto } from '../dto/portal.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller() // Using different paths for different entities
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('deliverables')
  @RequirePermissions('portal.manage_deliverables')
  createDeliverable(@CurrentUser() user: any, @Body() dto: CreateDeliverableDto) {
    return this.portalService.createDeliverable(user.id, dto);
  }

  @Get('deliverables/:id')
  @RequirePermissions('portal.read')
  findDeliverable(@Param('id') id: string) {
    return this.portalService.findDeliverable(id);
  }

  @Post('deliverables/:id/approve')
  @RequirePermissions('portal.approve_deliverables')
  approveDeliverable(@Param('id') id: string, @CurrentUser() user: any) {
    return this.portalService.approveDeliverable(id, user.id);
  }

  @Post('deliverables/:id/reject')
  @RequirePermissions('portal.approve_deliverables')
  rejectDeliverable(@Param('id') id: string) {
    return this.portalService.rejectDeliverable(id);
  }

  @Post('deliverables/:id/revisions')
  @RequirePermissions('portal.request_revisions')
  createRevision(
    @Param('id') id: string,
    @CurrentUser() user: any, // In reality, this would be a CLIENT user
    @Body() dto: CreateRevisionDto,
  ) {
    // Assuming we have a way to get the clientId from the current user
    return this.portalService.createRevision(id, user.id, dto);
  }

  @Get('deliverables/:id/revisions')
  @RequirePermissions('portal.read')
  getRevisions(@Param('id') id: string) {
    return this.portalService.getRevisions(id);
  }

  @Get('projects/:id/deliverables')
  @RequirePermissions('portal.read')
  getDeliverablesByProject(@Param('id') projectId: string) {
    return this.portalService.findDeliverablesByProject(projectId);
  }

  @Get('clients/:id/deliverables')
  @RequirePermissions('portal.read')
  getDeliverablesByClient(@Param('id') clientId: string) {
    return this.portalService.findDeliverablesByClient(clientId);
  }

  @Post('clients/:id/intake-form')
  @RequirePermissions('portal.manage_intake')
  createIntakeForm(@Param('id') clientId: string, @Body() dto: CreateIntakeFormDto) {
    return this.portalService.createIntakeForm(clientId, dto);
  }

  @Get('clients/:id/intake-form')
  @RequirePermissions('portal.read')
  getIntakeForm(@Param('id') clientId: string) {
    return this.portalService.getIntakeForm(clientId);
  }


}
