import {
  Body,
  Controller,
  UploadedFiles,
  UseInterceptors,
  ForbiddenException,
  Get,
  Param,
  Query,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CurrentUser, type JwtPayload } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import {
  AssignIssueDto,
  CreateAnnouncementDto,
  CreateIssueMessageDto,
  CreateIssueReportDto,
  UpdateAnnouncementDto,
  UpdateIssueStatusDto,
} from "../dto/communication.dto";
import { CommunicationListQueryDto } from "../dto/communication-query.dto";
import { CommunicationService } from "../services/communication.service";

@Controller("dashboard/announcements")
@UseGuards(JwtAuthGuard)
export class DashboardAnnouncementsController {
  constructor(private readonly service: CommunicationService) {}

  @Get("active")
  getActive(@CurrentUser() user: JwtPayload) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.getActiveAnnouncements(user.id, user.role);
  }

  @Post(":id/view")
  view(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.markAnnouncementState(user.id, id, "viewedAt", user.role);
  }

  @Post(":id/dismiss")
  dismiss(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.markAnnouncementState(user.id, id, "dismissedAt", user.role);
  }
}

@Controller("portal/announcements")
@UseGuards(JwtAuthGuard)
export class PortalAnnouncementsController {
  constructor(private readonly service: CommunicationService) {}

  @Get("active")
  getActive(@CurrentUser() user: JwtPayload) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.getActiveAnnouncements(user.id, "CLIENT");
  }

  @Post(":id/view")
  view(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.markAnnouncementState(user.id, id, "viewedAt", "CLIENT");
  }

  @Post(":id/dismiss")
  dismiss(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.markAnnouncementState(user.id, id, "dismissedAt", "CLIENT");
  }
}

@Controller("admin/announcements")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAnnouncementsController {
  constructor(private readonly service: CommunicationService) {}

  @Get()
  @RequirePermissions("communication.announcements.read")
  list(@Query() query: CommunicationListQueryDto) { return this.service.listAnnouncements(query); }

  @Post()
  @RequirePermissions("communication.announcements.create")
  create(@CurrentUser("id") userId: string, @Body() dto: CreateAnnouncementDto) { return this.service.createAnnouncement(userId, dto); }

  @Patch(":id")
  @RequirePermissions("communication.announcements.update")
  update(@Param("id") id: string, @Body() dto: UpdateAnnouncementDto) { return this.service.updateAnnouncement(id, dto); }

  @Post(":id/publish")
  @RequirePermissions("communication.announcements.update")
  publish(@Param("id") id: string) { return this.service.publishAnnouncement(id); }

  @Post(":id/archive")
  @RequirePermissions("communication.announcements.update")
  archive(@Param("id") id: string) { return this.service.archiveAnnouncement(id); }
}

@Controller("dashboard/issues")
@UseGuards(JwtAuthGuard)
export class DashboardIssuesController {
  constructor(protected readonly service: CommunicationService) {}

  @Post()
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { files: 5, fileSize: 10 * 1024 * 1024 } }))
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateIssueReportDto, @UploadedFiles() files?: Express.Multer.File[]) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.createIssue(user.id, "DASHBOARD", dto, files);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.getUserIssues(user.id);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.getIssue(id, user.id);
  }

  @Post(":id/messages")
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { files: 5, fileSize: 10 * 1024 * 1024 } }))
  message(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: CreateIssueMessageDto, @UploadedFiles() files?: Express.Multer.File[]) {
    if (user.role === "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.addIssueMessage(id, user.id, dto, false, files);
  }
}

@Controller("portal/issues")
@UseGuards(JwtAuthGuard)
export class PortalIssuesController {
  constructor(private readonly service: CommunicationService) {}

  @Post()
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { files: 5, fileSize: 10 * 1024 * 1024 } }))
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateIssueReportDto, @UploadedFiles() files?: Express.Multer.File[]) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.createIssue(user.id, "PORTAL", dto, files);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.getUserIssues(user.id);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.getIssue(id, user.id);
  }

  @Post(":id/messages")
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { files: 5, fileSize: 10 * 1024 * 1024 } }))
  message(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: CreateIssueMessageDto, @UploadedFiles() files?: Express.Multer.File[]) {
    if (user.role !== "CLIENT") throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    return this.service.addIssueMessage(id, user.id, dto, false, files);
  }
}

@Controller("admin/issues")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminIssuesController {
  constructor(private readonly service: CommunicationService) {}

  @Get()
  @RequirePermissions("communication.issues.read")
  list(@Query() query: CommunicationListQueryDto) { return this.service.listIssues(query); }

  @Get("assignees")
  @RequirePermissions("communication.issues.read")
  assignees(@Query("search") search?: string) { return this.service.searchIssueAssignees(search); }

  @Get(":id")
  @RequirePermissions("communication.issues.read")
  get(@Param("id") id: string) { return this.service.getIssue(id); }

  @Patch(":id/status")
  @RequirePermissions("communication.issues.update")
  status(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: UpdateIssueStatusDto) { return this.service.updateIssueStatus(id, userId, dto); }

  @Patch(":id/assignment")
  @RequirePermissions("communication.issues.update")
  assign(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: AssignIssueDto) { return this.service.assignIssue(id, userId, dto); }

  @Post(":id/messages")
  @RequirePermissions("communication.issues.update")
  @UseInterceptors(FilesInterceptor("files", 5, { limits: { files: 5, fileSize: 10 * 1024 * 1024 } }))
  message(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: CreateIssueMessageDto, @UploadedFiles() files?: Express.Multer.File[]) { return this.service.addIssueMessage(id, userId, dto, true, files); }
}
