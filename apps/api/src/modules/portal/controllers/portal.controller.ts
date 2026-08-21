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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  NotFoundException,
  ForbiddenException,
  Logger,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ClientKind } from "@hassad/shared";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { PortalService } from "../services/portal.service";
import {
  CreateDeliverableDto,
  CreateRevisionDto,
  CreateIntakeFormDto,
  SaveDraftDto,
  ReportTimelineQueryDto,
  RequestProjectRevisionDto,
  SnoozeActionItemDto,
  PortalProjectsQueryDto,
} from "../dto/portal.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import {
  ClientApproveStrategyDto,
  ClientRequestRevisionDto as StrategyRevisionDto,
} from "../../marketing/dto/marketing-strategy.dto";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalController {
  private readonly logger = new Logger(PortalController.name);

  constructor(
    private readonly portalService: PortalService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /** Parse and validate page limit parameter (NEW) */
  private parseLimit(
    query: string | undefined,
    defaultLimit: number = 20,
    maxLimit: number = 100,
  ): number {
    const limit = Number(query);
    if (!Number.isInteger(limit) || limit < 1) return defaultLimit;
    return Math.min(limit, maxLimit);
  }

  private parsePage(query: string | undefined): number {
    const page = Number(query);
    return Number.isInteger(page) && page >= 1 ? page : 1;
  }

  /** Resolve clientId from JWT payload or DB lookup for CLIENT users */
  private async resolveClientId(user: any): Promise<string | null> {
    if (user.clientId) return user.clientId;
    if (user.role !== "CLIENT") return null;

    // Personal identity (email) now lives on `User`; we look up the
    // client by its linked `userId` only.
    const client = await this.prisma.client.findFirst({
      where: { userId: user.id },
    });

    if (client) return client.id;

    // Edge case: CLIENT user exists but has no Client record.
    // This can happen if a user was created outside the normal
    // onboarding flow (admin-created, legacy import, etc.).
    // Auto-create a minimal business record so portal endpoints work.
    // Personal identity (name, email, phone) is NOT stored here — it
    // lives on the `User` table and is joined via `userId`.
    const created = await this.prisma.client.create({
      data: {
        userId: user.id,
        companyName: user.name || "Unknown",
        businessName: user.name || "Unknown",
        businessType: "OTHER",
        kind: ClientKind.LEAD,
        status: "ACTIVE",
      },
    });

    this.logger.warn(
      `Auto-created missing Client record (id=${created.id}) for user ${user.id} (${user.email})`,
    );

    return created.id;
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

  /** Verify the period exists, belongs to the given project, and that project
   *  is owned by the current client. Used to defend download URLs against
   *  IDOR — the periodId alone is not sufficient authorization context.
   *  (Audit issue #3) */
  private async verifyPeriodBelongsToProject(
    clientId: string,
    projectId: string,
    periodId: string,
  ): Promise<void> {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
      select: { projectId: true, project: { select: { clientId: true } } },
    });
    if (
      !period ||
      period.projectId !== projectId ||
      period.project.clientId !== clientId
    ) {
      throw new NotFoundException({
        code: "REPORT_NOT_AVAILABLE",
        details: {},
      });
    }
  }

  /** Verify the file exists, belongs to the given project, and that project
   *  is owned by the current client. (Audit issue #3) */
  private async verifyFileBelongsToProject(
    clientId: string,
    projectId: string,
    fileId: string,
  ): Promise<void> {
    const file = await this.prisma.projectFile.findUnique({
      where: { id: fileId },
      select: {
        projectId: true,
        project: { select: { clientId: true } },
      },
    });
    if (
      !file ||
      file.projectId !== projectId ||
      file.project.clientId !== clientId
    ) {
      throw new NotFoundException({ code: "FILE_NOT_FOUND", details: {} });
    }
  }

  @Get("portal/dashboard")
  @RequirePermissions("portal.read")
  async getDashboard(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      return { contracts: [], invoices: [], projects: [], campaigns: [] };
    return this.portalService.getDashboard(clientId);
  }

  @Get("portal/team-members")
  @RequirePermissions("portal.read")
  async getTeamMembers(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getClientTeamMembers(clientId);
  }

  @Get("portal/contracts")
  @RequirePermissions("portal.read")
  async getContracts(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return { data: [], total: 0, page: 1, limit: 20 };
    return this.portalService.getContracts(clientId, {
      status,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder: sortOrder === "asc" ? "asc" : "desc",
      page: this.parsePage(page),
      limit: this.parseLimit(limit, 20), // CHANGED - was Number(limit) || 20
    });
  }

  @Get("portal/contracts/:id")
  @RequirePermissions("portal.read")
  async getContractById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.portalService.getContractById({
      contractId: id,
      clientId: await this.resolveClientId(user),
      role: user.role,
    });
  }

  @Get("portal/finance/summary")
  @RequirePermissions("portal.read")
  async getFinanceSummary(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      return {
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
      page: this.parsePage(page),
      limit: this.parseLimit(limit, 20), // CHANGED - was Number(limit) || 20
    });
  }

  @Post("deliverables")
  @RequirePermissions("portal.manage_deliverables")
  @UseInterceptors(FileInterceptor("file"))
  async createDeliverable(
    @CurrentUser() user: any,
    @Body() dto: CreateDeliverableDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new ForbiddenException({ code: "FILE_REQUIRED", details: {} });
    }
    const uploadResult = await this.storageService.upload({
      category: StorageCategory.DELIVERABLE,
      entityId: dto.projectId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
    return this.portalService.createDeliverable(user.id, dto, uploadResult.key);
  }

  @Get("deliverables/:id")
  @RequirePermissions("portal.read")
  async findDeliverable(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    return this.portalService.findDeliverable(id);
  }

  @Post("deliverables/:id/approve")
  @RequirePermissions("portal.approve_deliverables")
  async approveDeliverable(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    return this.portalService.approveDeliverable(id, user.id);
  }

  @Post("deliverables/:id/reject")
  @RequirePermissions("portal.approve_deliverables")
  async rejectDeliverable(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
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
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    return this.portalService.createRevision(id, user.id, dto);
  }

  @Get("deliverables/:id/revisions")
  @RequirePermissions("portal.read")
  async getRevisions(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (clientId && !(await this.verifyClientOwnsDeliverable(clientId, id))) {
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
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
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
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
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    return this.portalService.findDeliverablesByClient(clientIdFromUrl);
  }

  @Post("portal/upload-intake-files")
  @RequirePermissions("portal.manage_intake")
  @UseInterceptors(FilesInterceptor("files", 5))
  async uploadIntakeFiles(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      throw new ForbiddenException({ code: "CLIENT_NOT_FOUND", details: {} });
    }

    if (!files || files.length === 0) {
      throw new ForbiddenException({ code: "FILES_REQUIRED", details: {} });
    }

    const uploadedFiles: {
      key: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }[] = [];

    const uploadedKeys: string[] = [];

    try {
      for (const file of files) {
        const result = await this.storageService.upload({
          category: StorageCategory.INTAKE_FORM,
          entityId: clientId,
          file: {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
        });

        uploadedFiles.push({
          key: result.key,
          originalName: result.originalName,
          mimeType: result.mimeType,
          size: result.size,
          url: result.url,
        });

        uploadedKeys.push(result.key);
      }

      return uploadedFiles;
    } catch (error) {
      for (const key of uploadedKeys) {
        await this.storageService.deleteByKey(key).catch(() => {});
      }

      throw error;
    }
  }

  @Get("portal/intake-form")
  @RequirePermissions("portal.manage_intake")
  async getMyIntakeForm(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      throw new ForbiddenException({ code: "CLIENT_NOT_FOUND", details: {} });
    }
    return this.portalService.getIntakeForm(clientId);
  }

  @Post("portal/intake-form")
  @RequirePermissions("portal.manage_intake")
  async submitIntakeForm(
    @Body() dto: CreateIntakeFormDto,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      throw new ForbiddenException({ code: "CLIENT_NOT_FOUND", details: {} });
    }

    return this.portalService.createIntakeForm(
      clientId,
      dto,
      dto.uploadedFiles || [],
    );
  }

  @Patch("portal/intake-form/draft")
  @RequirePermissions("portal.manage_intake")
  async saveIntakeFormDraft(
    @Body() dto: SaveDraftDto,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      throw new ForbiddenException({ code: "CLIENT_NOT_FOUND", details: {} });
    }

    return this.portalService.saveDraft(clientId, dto);
  }

  @Post("clients/:id/intake-form")
  @RequirePermissions("portal.manage_intake")
  @UseInterceptors(FilesInterceptor("files", 10))
  async createIntakeForm(
    @Param("id") clientIdFromUrl: string,
    @Body() dto: CreateIntakeFormDto,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const clientId = await this.resolveClientId(user);
    if (clientId && clientId !== clientIdFromUrl) {
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    }

    const uploadedFileKeys: {
      key: string;
      originalName: string;
      mimeType: string;
    }[] = [];
    if (files && files.length > 0) {
      for (const f of files) {
        const result = await this.storageService.upload({
          category: StorageCategory.INTAKE_FORM,
          entityId: clientIdFromUrl,
          file: {
            buffer: f.buffer,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
          },
        });
        uploadedFileKeys.push({
          key: result.key,
          originalName: f.originalname,
          mimeType: f.mimetype,
        });
      }
    }

    return this.portalService.createIntakeForm(
      clientIdFromUrl,
      dto,
      uploadedFileKeys,
    );
  }

  @Get("clients/:id/intake-form")
  @RequirePermissions("portal.read")
  async getIntakeForm(
    @Param("id") clientIdFromUrl: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (clientId && clientId !== clientIdFromUrl) {
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    return this.portalService.getIntakeForm(clientIdFromUrl);
  }

  @Get("portal/campaigns")
  @RequirePermissions("portal.read")
  async getPortalCampaigns(
    @CurrentUser() user: any,
    @Query("projectId", new ParseUUIDPipe({ optional: true }))
    projectId?: string,
    @Query("periodId", new ParseUUIDPipe({ optional: true })) periodId?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return [];
    return this.portalService.findCampaignsByClient(clientId, {
      projectId,
      periodId,
    });
  }

  @Get("portal/projects")
  @RequirePermissions("portal.read")
  async getPortalProjects(
    @CurrentUser() user: any,
    @Query() query: PortalProjectsQueryDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getProjects(clientId, {
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get("portal/projects/:id/periods")
  @RequirePermissions("portal.read")
  async getProjectPeriods(
    @CurrentUser() user: any,
    @Param("id", ParseUUIDPipe) projectId: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    // Service throws NotFoundException for not-found / not-owned — let it
    // bubble so the client sees a real 404, not a misleading []. (Audit #9)
    return this.portalService.getProjectPeriods(clientId, projectId);
  }

  @Get("portal/requests")
  @RequirePermissions("portal.read")
  async getPortalRequests(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("statuses") statuses?: string,
    @Query("includeCancelled") includeCancelled?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getRequests(clientId, {
      page: this.parsePage(page),
      limit: this.parseLimit(limit, 6),
      search,
      statuses: statuses
        ?.split(",")
        .map((status) => status.trim())
        .filter(Boolean),
      includeCancelled: includeCancelled === "true",
    });
  }

  @Get("portal/project-progress")
  @RequirePermissions("portal.read")
  async getProjectProgress(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
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
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getActionItems(clientId, {
      type: type || undefined,
      page: this.parsePage(page),
      limit: this.parseLimit(limit, 20), // CHANGED - was Number(limit) || 20
    });
  }

  @Get("portal/activity-feed")
  @RequirePermissions("portal.read")
  async getActivityFeed(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getActivityFeed(clientId);
  }

  @Get("portal/campaigns/summary")
  @RequirePermissions("portal.read")
  async getCampaignSummary(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getCampaignSummary(clientId);
  }

  @Get("portal/reports")
  @RequirePermissions("portal.read")
  async getReports(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      return {
        kpiCards: [],
        smartTips: [],
        topCampaigns: [],
        platformDistribution: [],
        period: { dateFrom: null, dateTo: null },
      };
    }
    return this.portalService.getReportSummary(clientId);
  }

  @Get("portal/reports/timeline")
  @RequirePermissions("portal.read")
  async getReportTimeline(
    @CurrentUser() user: any,
    @Query() query: ReportTimelineQueryDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      return { labels: [], datasets: [] };
    }
    const dateFrom = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();
    const granularity = query.granularity || "month";
    return this.portalService.getReportTimeline(
      clientId,
      dateFrom,
      dateTo,
      granularity,
    );
  }

  @Post("portal/action-items/snooze")
  @RequirePermissions("portal.read")
  async snoozeActionItem(
    @CurrentUser() user: any,
    @Body() body: SnoozeActionItemDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
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
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.unsnoozeActionItem(clientId, itemType, itemId);
  }

  /**
   * List the client's currently-snoozed action items so the UI can show
   * a "snoozed" view and offer an "unsnooze" affordance.
   *
   * Pass `?activeOnly=false` to include items whose snooze already expired
   * (i.e. the reminder notification was already pushed). Useful for a
   * "history" view if you add one later.
   */
  @Get("portal/action-items/snoozed")
  @RequirePermissions("portal.read")
  async getSnoozedActionItems(
    @CurrentUser() user: any,
    @Query("activeOnly") activeOnly?: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return [];
    const flag = activeOnly === undefined ? true : activeOnly !== "false";
    return this.portalService.getSnoozedItems(clientId, flag);
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

  // ── Project Review (Client Approval) ──────────────────────────────────────

  @Get("portal/projects/review")
  @RequirePermissions("portal.read")
  async getReviewProjects(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return [];
    return this.portalService.getReviewProjects(clientId);
  }

  @Get("portal/projects/:id/review-detail")
  @RequirePermissions("portal.read")
  async getProjectReviewDetail(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getProjectReviewDetail(id, clientId);
  }

  @Post("portal/projects/:id/approve")
  @RequirePermissions("portal.approve_deliverables")
  async approveProject(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.approveProject(id, clientId);
  }

  @Post("portal/projects/:id/request-revision")
  @RequirePermissions("portal.request_revisions")
  async requestProjectRevision(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: RequestProjectRevisionDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.requestProjectRevision(id, clientId, dto);
  }

  @Get("portal/projects/:id/revisions")
  @RequirePermissions("portal.read")
  async getProjectRevisions(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getProjectRevisions(id, clientId);
  }

  // NOTE: declared after the static `portal/projects/review` route so the `:id`
  // param does not shadow it.
  @Get("portal/projects/:id")
  @RequirePermissions("portal.read")
  async getPortalProjectDetail(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getProjectDetail(clientId, id);
  }

  @Get("portal/projects/:projectId/periods/:periodId/report/download")
  @RequirePermissions("portal.read")
  async downloadPeriodReport(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Param("periodId", ParseUUIDPipe) periodId: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    // Defense in depth: validate the URL projectId matches the period's
    // owning project. The service already checks client ownership via the
    // period, but the URL contract should be enforced too. (Audit issue #3)
    await this.verifyPeriodBelongsToProject(clientId, projectId, periodId);
    return this.portalService.getPeriodReportDownloadUrl(clientId, periodId);
  }

  @Get("portal/projects/:projectId/periods/:periodId/files/:fileId/download")
  @RequirePermissions("portal.read")
  async downloadPeriodFile(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Param("fileId", ParseUUIDPipe) fileId: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    // Defense in depth: validate the URL projectId matches the file's
    // owning project. (Audit issue #3)
    await this.verifyFileBelongsToProject(clientId, projectId, fileId);
    return this.portalService.getPeriodFileDownloadUrl(clientId, fileId);
  }

  @Get("portal/invoices/:id")
  @RequirePermissions("portal.read")
  async getPortalInvoiceDetail(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getInvoiceDetail(clientId, id);
  }

  /**
   * Resolve a deliverable deep-link (`/portal/deliverables/:id`) back to
   * the owning project id. The frontend uses this to redirect into the
   * existing project-scoped review modal at `/portal/deliverables?focus=...`
   * instead of building a duplicate deliverable-only UI.
   * See: `getActionItems` for the matching `actionUrl` shape.
   */
  @Get("portal/deliverables/:id/redirect")
  @RequirePermissions("portal.read")
  async redirectDeliverableToProject(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.resolveDeliverableForReview(clientId, id);
  }

  // ── Marketing Strategy Portal Endpoints ────────────────────────────────

  @Get("portal/marketing-strategies")
  @RequirePermissions("portal.read")
  async getClientStrategies(@CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) return [];
    return this.portalService.getClientStrategies(clientId);
  }

  @Get("portal/marketing-strategies/:id")
  @RequirePermissions("portal.read")
  async getClientStrategyOne(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.getClientStrategyOne(id, clientId);
  }

  @Post("portal/marketing-strategies/:id/approve")
  @RequirePermissions("portal.approve_deliverables")
  async approveStrategy(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() _dto: ClientApproveStrategyDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });
    if (!client?.userId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.approveStrategy(id, client.userId);
  }

  @Post("portal/marketing-strategies/:id/request-revision")
  @RequirePermissions("portal.request_revisions")
  async requestStrategyRevision(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: StrategyRevisionDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });
    if (!client?.userId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });
    return this.portalService.requestStrategyRevision(
      id,
      client.userId,
      dto.comment,
    );
  }

  @Get("portal/marketing-strategies/:id/download")
  @RequirePermissions("portal.read")
  async downloadStrategy(@Param("id") id: string, @CurrentUser() user: any) {
    const clientId = await this.resolveClientId(user);
    if (!clientId)
      throw new ForbiddenException({
        code: "PORTAL_ACCESS_FORBIDDEN",
        details: {},
      });

    // Verify client owns this strategy
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      select: { clientId: true, filePath: true },
    });

    if (!strategy || strategy.clientId !== clientId) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    const url = await this.storageService.getPresignedUrl(strategy.filePath);
    return { url };
  }
}
