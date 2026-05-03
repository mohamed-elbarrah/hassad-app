import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from '../services/portal.service';
import { CreateDeliverableDto, CreateRevisionDto, CreateIntakeFormDto } from '../dto/portal.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly prisma: PrismaService,
  ) {}

  /** Resolve clientId from JWT payload or DB lookup for CLIENT users */
  private async resolveClientId(user: any): Promise<string | null> {
    if (user.clientId) return user.clientId;
    if (user.role !== 'CLIENT') return null;
    const client = await this.prisma.client.findFirst({
      where: { email: user.email },
      select: { id: true },
    });
    return client?.id ?? null;
  }

  @Get('portal/dashboard')
  @RequirePermissions('portal.read')
  async getDashboard(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { contracts: [], invoices: [], projects: [], campaigns: [] };
    return this.portalService.getDashboard(clientId);
  }

  @Get('portal/contracts')
  @RequirePermissions('portal.read')
  async getContracts(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 20 };
    return this.portalService.getContracts(clientId, {
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get('portal/invoices')
  @RequirePermissions('portal.read')
  async getInvoices(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 20 };
    return this.portalService.getInvoices(clientId, {
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

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

  @Get('portal/campaigns')
  @RequirePermissions('portal.read')
  async getPortalCampaigns(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return [];
    return this.portalService.findCampaignsByClient(clientId);
  }

  @Get('portal/project-progress')
  @RequirePermissions('portal.read')
  async getProjectProgress(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return null;
    return this.portalService.getProjectProgress(clientId);
  }

  @Get('portal/campaigns/:id')
  @RequirePermissions('portal.read')
  async getPortalCampaignOne(@Param('id') id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return null;
    return this.portalService.findCampaignOne(id, clientId);
  }
}

