import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { PortalService } from "../services/portal.service";
import {
  CreateDeliverableDto,
  CreateRevisionDto,
  CreateIntakeFormDto,
} from "../dto/portal.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { PrismaService } from "../../../prisma/prisma.service";

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
    if (user.role !== "CLIENT") return null;
    const client = await this.prisma.client.findFirst({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
      select: { id: true },
    });
    return client?.id ?? null;
  }

  private async verifyClientOwnsDeliverable(
    clientId: string,
    deliverableId: string,
  ): Promise<boolean> {
    const del = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { project: { select: { clientId: true } } },
    });
    return del?.project?.clientId === clientId;
  }

  private async verifyClientOwnsProject(
    clientId: string,
    projectId: string,
  ): Promise<boolean> {
    const proj = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    return proj?.clientId === clientId;
  }

  @Get("portal/dashboard")
  @RequirePermissions("portal.read")
  async getDashboard(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      return { contracts: [], invoices: [], projects: [], campaigns: [] };
    return this.portalService.getDashboard(clientId);
  }

  @Get("portal/contracts")
  @RequirePermissions("portal.read")
  async getContracts(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 20 };
    return this.portalService.getContracts(clientId, {
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get("portal/finance/summary")
  @RequirePermissions("portal.read")
  async getFinanceSummary(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalRemaining: 0,
      nextInvoiceDueDate: null,
      nextInvoiceAmount: 0,
    };
    return this.portalService.getFinanceSummary(clientId);
  }

  @Get("portal/invoices")
  @RequirePermissions("portal.read")
  async getInvoices(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 20 };
    return this.portalService.getInvoices(clientId, {
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Post("deliverables")
  @RequirePermissions("portal.manage_deliverables")
  createDeliverable(
    @CurrentUser() user: any,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.portalService.createDeliverable(user.id, dto);
  }

  @Get("deliverables/:id")
  @RequirePermissions("portal.read")
  async findDeliverable(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException();
    }
    return this.portalService.findDeliverable(id);
  }

  @Post("deliverables/:id/approve")
  @RequirePermissions("portal.approve_deliverables")
  async approveDeliverable(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException();
    }
    return this.portalService.approveDeliverable(id, user.id);
  }

  @Post("deliverables/:id/reject")
  @RequirePermissions("portal.approve_deliverables")
  async rejectDeliverable(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException();
    }
    return this.portalService.rejectDeliverable(id);
  }

  @Post("deliverables/:id/revisions")
  @RequirePermissions("portal.request_revisions")
  async createRevision(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateRevisionDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException();
    }
    return this.portalService.createRevision(id, user.id, dto);
  }

  @Get("deliverables/:id/revisions")
  @RequirePermissions("portal.read")
  async getRevisions(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException();
    }
    return this.portalService.getRevisions(id);
  }

  @Get("projects/:id/deliverables")
  @RequirePermissions("portal.read")
  async getDeliverablesByProject(
    @Param("id") projectId: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (
      clientId &&
      !(await this.verifyClientOwnsProject(clientId, projectId))
    ) {
      throw new ForbiddenException();
    }
    return this.portalService.findDeliverablesByProject(projectId);
  }

  @Get("clients/:id/deliverables")
  @RequirePermissions("portal.read")
  async getDeliverablesByClient(
    @Param("id") clientIdFromUrl: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (clientId && clientId !== clientIdFromUrl) {
      throw new ForbiddenException();
    }
    return this.portalService.findDeliverablesByClient(clientIdFromUrl);
  }

  @Post("clients/:id/intake-form")
  @RequirePermissions("portal.manage_intake")
  async createIntakeForm(
    @Param("id") clientIdFromUrl: string,
    @Body() dto: CreateIntakeFormDto,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (clientId && clientId !== clientIdFromUrl) {
      throw new ForbiddenException();
    }
    return this.portalService.createIntakeForm(clientIdFromUrl, dto);
  }

  @Get("clients/:id/intake-form")
  @RequirePermissions("portal.read")
  async getIntakeForm(
    @Param("id") clientIdFromUrl: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (clientId && clientId !== clientIdFromUrl) {
      throw new ForbiddenException();
    }
    return this.portalService.getIntakeForm(clientIdFromUrl);
  }

  @Get("portal/campaigns")
  @RequirePermissions("portal.read")
  async getPortalCampaigns(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return [];
    return this.portalService.findCampaignsByClient(clientId);
  }

  @Get("portal/projects")
  @RequirePermissions("portal.read")
  async getPortalProjects(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 6 };
    return this.portalService.getProjects(clientId, {
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 6,
    });
  }

  @Get("portal/requests")
  @RequirePermissions("portal.read")
  async getPortalRequests(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 6 };
    return this.portalService.getRequests(clientId, {
      page: Number(page) || 1,
      limit: Number(limit) || 6,
    });
  }

  @Get("portal/project-progress")
  @RequirePermissions("portal.read")
  async getProjectProgress(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return null;
    return this.portalService.getProjectProgress(clientId);
  }

  @Get("portal/action-items")
  @RequirePermissions("portal.read")
  async getActionItems(
    @CurrentUser() user: any,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { items: [], total: 0, page: 1, limit: 20 };
    return this.portalService.getActionItems(clientId, {
      type: type || undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get("portal/activity-feed")
  @RequirePermissions("portal.read")
  async getActivityFeed(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { items: [] };
    return this.portalService.getActivityFeed(clientId);
  }

  @Get("portal/campaigns/summary")
  @RequirePermissions("portal.read")
  async getCampaignSummary(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      return {
        totalVisits: 0,
        totalConversions: 0,
        avgRoas: 0,
        improvementPercent: 0,
      };
    return this.portalService.getCampaignSummary(clientId);
  }

  @Post("portal/action-items/snooze")
  @RequirePermissions("portal.read")
  async snoozeActionItem(
    @CurrentUser() user: any,
    @Body() body: { itemType: string; itemId: string; hours?: number },
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { success: false };
    return this.portalService.snoozeActionItem(
      clientId,
      body.itemType,
      body.itemId,
      body.hours ?? 24,
    );
  }

  @Delete("portal/action-items/snooze/:itemType/:itemId")
  @RequirePermissions("portal.read")
  async unsnoozeActionItem(
    @CurrentUser() user: any,
    @Param("itemType") itemType: string,
    @Param("itemId") itemId: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { success: false };
    return this.portalService.unsnoozeActionItem(clientId, itemType, itemId);
  }

  @Get("portal/campaigns/:id")
  @RequirePermissions("portal.read")
  async getPortalCampaignOne(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return null;
    return this.portalService.findCampaignOne(id, clientId);
  }
}
