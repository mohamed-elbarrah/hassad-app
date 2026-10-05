import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  AnnouncementAudienceType,
  AnnouncementPriority,
  AnnouncementStatus,
  IssueStatus,
  IssueSeverity,
  Prisma,
} from "@prisma/client";
import {
  AssignIssueDto,
  CreateAnnouncementDto,
  CreateIssueMessageDto,
  CreateIssueReportDto,
  UpdateAnnouncementDto,
  UpdateIssueStatusDto,
} from "../dto/communication.dto";
import { StorageService } from "../../../common/storage/storage.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { NotificationEventType } from "@hassad/shared";
import { StorageCategory, EXTENSION_MIME_MAP, STORAGE_CONFIG } from "../../../common/storage/storage.constants";
import { extname } from "path";

const ISSUE_MAX_FILES = 5;
const ISSUE_MAX_TOTAL_SIZE = 50 * 1024 * 1024;

const audienceForRole: Record<string, AnnouncementAudienceType | undefined> = {
  ADMIN: AnnouncementAudienceType.ADMIN,
  PM: AnnouncementAudienceType.PM,
  SALES: AnnouncementAudienceType.SALES,
  MARKETING: AnnouncementAudienceType.MARKETING,
  ACCOUNTANT: AnnouncementAudienceType.ACCOUNTANT,
  TEAM: AnnouncementAudienceType.TEAM,
};

@Injectable()
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private announcementWhere(
    userId: string,
    role?: string,
  ): Prisma.AnnouncementWhereInput {
    const roleAudience = role ? audienceForRole[role] : undefined;
    const audiences: AnnouncementAudienceType[] =
      role === "CLIENT"
        ? [AnnouncementAudienceType.CLIENT_PORTAL]
        : [
            AnnouncementAudienceType.ALL_STAFF,
            ...(roleAudience ? [roleAudience] : []),
          ];
    return {
      status: { in: [AnnouncementStatus.PUBLISHED, AnnouncementStatus.SCHEDULED] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
      audiences: { some: { audience: { in: audiences } } },
      userStates: { none: { userId, dismissedAt: { not: null } } },
    };
  }

  async getActiveAnnouncements(userId: string, role: string) {
    const where = this.announcementWhere(userId, role);

    return this.prisma.announcement.findMany({
      where,
      include: { audiences: true },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
    });
  }

  async markAnnouncementState(
    userId: string,
    announcementId: string,
    state: "viewedAt" | "dismissedAt",
    role: string,
  ) {
    const visible = await this.prisma.announcement.findFirst({
      where: { id: announcementId, ...this.announcementWhere(userId, role) },
      select: { id: true, allowDismissal: true },
    });
    if (!visible) throw new NotFoundException({ code: "ANNOUNCEMENT_NOT_FOUND" });
    if (state === "dismissedAt" && !visible.allowDismissal) {
      throw new BadRequestException({ code: "ANNOUNCEMENT_DISMISSAL_NOT_ALLOWED" });
    }

    return this.prisma.announcementUserState.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      create: { announcementId, userId, [state]: new Date() },
      update: { [state]: new Date() },
    });
  }

  async listAnnouncements(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Prisma.AnnouncementWhereInput = query.search
      ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { body: { contains: query.search, mode: "insensitive" } }] }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({ where, include: { audiences: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
      this.prisma.announcement.count({ where }),
    ]);
    return {
      __standardResponse: true as const,
      data: { data },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createAnnouncement(userId: string, dto: CreateAnnouncementDto) {
    this.validateDates(dto.startsAt, dto.expiresAt);
    return this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        type: dto.type,
        priority: dto.priority,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        allowDismissal: dto.allowDismissal ?? true,
        actionLabel: dto.actionLabel?.trim(),
        actionUrl: this.validateActionUrl(dto.actionUrl),
        createdById: userId,
        audiences: { create: dto.audiences.map((audience) => ({ audience })) },
      },
      include: { audiences: true },
    });
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "ANNOUNCEMENT_NOT_FOUND" });
    if (existing.status === AnnouncementStatus.ARCHIVED) {
      throw new BadRequestException({ code: "ANNOUNCEMENT_ARCHIVED" });
    }
    this.validateDates(dto.startsAt, dto.expiresAt);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.announcementAudience.deleteMany({ where: { announcementId: id } });
      return tx.announcement.update({
        where: { id },
        data: {
          title: dto.title.trim(),
          body: dto.body.trim(),
          type: dto.type,
          priority: dto.priority,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          allowDismissal: dto.allowDismissal ?? true,
          actionLabel: dto.actionLabel?.trim() || null,
          actionUrl: this.validateActionUrl(dto.actionUrl) ?? null,
          status:
            dto.startsAt && new Date(dto.startsAt) > new Date()
              ? AnnouncementStatus.SCHEDULED
              : existing.status === AnnouncementStatus.SCHEDULED
                ? AnnouncementStatus.PUBLISHED
                : existing.status,
          publishedAt:
            dto.startsAt && new Date(dto.startsAt) > new Date()
              ? null
              : existing.status === AnnouncementStatus.SCHEDULED
                ? new Date()
                : existing.publishedAt,
          audiences: { create: dto.audiences.map((audience) => ({ audience })) },
        },
        include: { audiences: true },
      });
    });
    if (updated.status === AnnouncementStatus.PUBLISHED && existing.status !== AnnouncementStatus.PUBLISHED) {
      await this.notifyAnnouncement(updated.id, updated.audiences.map((item) => item.audience));
    }
    return updated;
  }

  async publishAnnouncement(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException({ code: "ANNOUNCEMENT_NOT_FOUND" });
    if (announcement.status === AnnouncementStatus.ARCHIVED) {
      throw new BadRequestException({ code: "ANNOUNCEMENT_ARCHIVED" });
    }
    if (announcement.status === AnnouncementStatus.PUBLISHED || announcement.status === AnnouncementStatus.SCHEDULED) {
      throw new BadRequestException({ code: "ANNOUNCEMENT_ALREADY_PUBLISHED" });
    }
    const published = await this.prisma.announcement.update({
      where: { id },
      data: {
        status: announcement.startsAt && announcement.startsAt > new Date()
          ? AnnouncementStatus.SCHEDULED
          : AnnouncementStatus.PUBLISHED,
        publishedAt: announcement.startsAt && announcement.startsAt > new Date() ? null : new Date(),
      },
      include: { audiences: true },
    });
    if (published.status === AnnouncementStatus.PUBLISHED) {
      await this.notifyAnnouncement(published.id, published.audiences.map((item) => item.audience));
    }
    return published;
  }

  @Cron("*/1 * * * *")
  async activateScheduledAnnouncements() {
    const scheduled = await this.prisma.announcement.findMany({ where: { status: AnnouncementStatus.SCHEDULED, startsAt: { lte: new Date() } }, include: { audiences: true } });
    for (const announcement of scheduled) {
      const activated = await this.prisma.announcement.updateMany({ where: { id: announcement.id, status: AnnouncementStatus.SCHEDULED }, data: { status: AnnouncementStatus.PUBLISHED, publishedAt: new Date() } });
      if (activated.count) await this.notifyAnnouncement(announcement.id, announcement.audiences.map((item) => item.audience));
    }
  }

  async archiveAnnouncement(id: string) {
    const result = await this.prisma.announcement.updateMany({
      where: { id, status: { not: AnnouncementStatus.ARCHIVED } },
      data: { status: AnnouncementStatus.ARCHIVED, archivedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException({ code: "ANNOUNCEMENT_NOT_FOUND" });
    return { id, status: AnnouncementStatus.ARCHIVED };
  }

  async createIssue(userId: string, source: "DASHBOARD" | "PORTAL", dto: CreateIssueReportDto, files?: Express.Multer.File[]) {
    const issue = await this.prisma.issueReport.create({
      data: {
        reporterId: userId, source, category: dto.category, severity: dto.severity,
        title: dto.title.trim(), description: dto.description.trim(), pagePath: dto.pagePath?.trim(),
        history: { create: { changedBy: userId, eventCode: "ISSUE_REPORTED" } },
      },
    });
    try {
      await this.saveIssueAttachments(issue.id, userId, files);
    } catch (error) {
      await this.prisma.issueReport.delete({ where: { id: issue.id } }).catch(() => undefined);
      throw error;
    }
    return this.getIssue(issue.id, userId);
  }

  async getUserIssues(userId: string) {
    return this.prisma.issueReport.findMany({
      where: { OR: [{ reporterId: userId }, { assignedToId: userId }] },
      orderBy: { createdAt: "desc" },
      include: { assignedTo: { select: { id: true, name: true } }, attachments: true },
    }).then((issues) => Promise.all(issues.map((issue) => this.withAttachmentUrls(issue))));
  }

  async listIssues(query: { page?: number; limit?: number; search?: string; status?: IssueStatus; severity?: IssueSeverity }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Prisma.IssueReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] } : {}),
    };
    const [issues, total] = await Promise.all([
      this.prisma.issueReport.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ status: "asc" }, { createdAt: "desc" }], include: { reporter: { select: { id: true, name: true, email: true } }, assignedTo: { select: { id: true, name: true } }, attachments: true } }),
      this.prisma.issueReport.count({ where }),
    ]);
    return {
      __standardResponse: true as const,
      data: { data: await Promise.all(issues.map((issue) => this.withAttachmentUrls(issue))) },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async searchIssueAssignees(search?: string) {
    return this.prisma.user.findMany({ where: { isActive: true, role: { name: { not: "CLIENT" } }, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}) }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" }, take: 50 });
  }

  async getIssue(id: string, userId?: string) {
    const issue = await this.prisma.issueReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true } }, attachments: true } },
        attachments: true,
        history: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!issue) throw new NotFoundException({ code: "ISSUE_NOT_FOUND" });
    if (userId && issue.reporterId !== userId && issue.assignedToId !== userId) {
      throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    }
    const attachments = await this.withAttachmentUrls(issue);
    return {
      ...attachments,
      messages: await Promise.all(issue.messages.map(async (message) => ({
        ...message,
        attachments: await this.withAttachmentUrls({ attachments: message.attachments }),
      }))),
    };
  }

  async updateIssueStatus(id: string, userId: string, dto: UpdateIssueStatusDto) {
    const existing = await this.getIssue(id);
    const allowed: Record<IssueStatus, IssueStatus[]> = {
      OPEN: [IssueStatus.IN_PROGRESS, IssueStatus.CLOSED],
      IN_PROGRESS: [IssueStatus.WAITING_FOR_USER, IssueStatus.RESOLVED, IssueStatus.CLOSED],
      WAITING_FOR_USER: [IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.CLOSED],
      RESOLVED: [IssueStatus.CLOSED, IssueStatus.IN_PROGRESS],
      CLOSED: [],
    };
    if (existing.status !== dto.status && !allowed[existing.status].includes(dto.status)) {
      throw new BadRequestException({ code: "INVALID_ISSUE_STATUS_TRANSITION" });
    }
    const timestamps = {
      resolvedAt: dto.status === IssueStatus.RESOLVED ? new Date() : null,
      closedAt: dto.status === IssueStatus.CLOSED ? new Date() : null,
    };
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.issueReport.update({ where: { id }, data: { status: dto.status, ...timestamps } });
      await tx.issueHistory.create({ data: { issueId: id, changedBy: userId, eventCode: `ISSUE_STATUS_${dto.status}` } });
      return issue;
    });
  }

  async assignIssue(id: string, userId: string, dto: AssignIssueDto) {
    await this.getIssue(id);
    if (dto.assignedToId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assignedToId, isActive: true, role: { name: { not: "CLIENT" } } },
        select: { id: true },
      });
      if (!assignee) throw new BadRequestException({ code: "INVALID_ISSUE_ASSIGNEE" });
    }
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.issueReport.update({ where: { id }, data: { assignedToId: dto.assignedToId || null } });
      await tx.issueHistory.create({ data: { issueId: id, changedBy: userId, eventCode: "ISSUE_ASSIGNED", metadata: { assignedToId: dto.assignedToId ?? null } } });
      return issue;
    });
  }

  async addIssueMessage(id: string, authorId: string, dto: CreateIssueMessageDto, isAdmin = false, files?: Express.Multer.File[]) {
    const issue = await this.getIssue(id);
    if (!isAdmin && issue.reporterId !== authorId && issue.assignedToId !== authorId) throw new ForbiddenException({ code: "PERMISSION_DENIED" });
    if (issue.status === IssueStatus.CLOSED) throw new BadRequestException({ code: "ISSUE_CLOSED" });
    const message = await this.prisma.issueMessage.create({ data: { issueId: id, authorId, content: dto.content.trim() }, include: { author: { select: { id: true, name: true } } } });
    try {
      await this.saveIssueAttachments(id, authorId, files, message.id);
    } catch (error) {
      await this.prisma.issueMessage.delete({ where: { id: message.id } }).catch(() => undefined);
      throw error;
    }
    return this.getIssue(id);
  }

  private async saveIssueAttachments(issueId: string, uploadedBy: string, files?: Express.Multer.File[], messageId?: string) {
    if (!files?.length) return;
    if (files.length > ISSUE_MAX_FILES || files.reduce((total, file) => total + file.size, 0) > ISSUE_MAX_TOTAL_SIZE) {
      throw new BadRequestException({ code: "ISSUE_ATTACHMENTS_TOO_LARGE", details: { maxFiles: ISSUE_MAX_FILES, maxBytes: ISSUE_MAX_TOTAL_SIZE } });
    }
    const uploadedKeys: string[] = [];
    try {
      const records = [];
      for (const file of files) {
        const expectedMime = EXTENSION_MIME_MAP[extname(file.originalname).toLowerCase()];
        const config = STORAGE_CONFIG[StorageCategory.ISSUE_ATTACHMENT];
        if (!file.buffer?.length || !expectedMime || file.mimetype !== expectedMime || !config.allowedMimeTypes.includes(expectedMime)) {
          throw new BadRequestException({ code: "INVALID_FILE_TYPE", details: { extension: extname(file.originalname).toLowerCase(), mimeType: file.mimetype } });
        }
        const header = file.buffer;
        const validContent = file.mimetype === "text/plain" ||
          (file.mimetype === "application/pdf" && header.subarray(0, 5).toString() === "%PDF-") ||
          (file.mimetype === "image/png" && header.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) ||
          (file.mimetype === "image/jpeg" && header.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) ||
          (file.mimetype === "image/gif" && ["GIF87a", "GIF89a"].includes(header.subarray(0, 6).toString())) ||
          (file.mimetype === "image/webp" && header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP") ||
          (["application/msword"].includes(file.mimetype) && header.subarray(0, 4).equals(Buffer.from("d0cf11e0", "hex"))) ||
          (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && header.subarray(0, 4).equals(Buffer.from("504b0304", "hex")));
        if (!validContent) throw new BadRequestException({ code: "INVALID_FILE_CONTENT", details: {} });
        const result = await this.storage.upload({ category: StorageCategory.ISSUE_ATTACHMENT, entityId: issueId, file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size }, subPath: messageId ? `messages/${messageId}` : "report" });
        uploadedKeys.push(result.key);
        records.push({ issueId, messageId, uploadedBy, fileName: result.originalName, filePath: result.key, fileSize: result.size, mimeType: result.mimeType });
      }
      await this.prisma.issueAttachment.createMany({ data: records });
    } catch (error) {
      await Promise.all(uploadedKeys.map((key) => this.storage.deleteByKey(key)));
      throw error;
    }
  }

  private async withAttachmentUrls<T extends { attachments?: Array<{ id: string; fileName: string; filePath: string; fileSize: number; mimeType: string; uploadedAt: Date }> }>(entity: T) {
    const attachments = await Promise.all((entity.attachments ?? []).map(async (attachment) => ({
      id: attachment.id, fileName: attachment.fileName, fileSize: attachment.fileSize, mimeType: attachment.mimeType,
      uploadedAt: attachment.uploadedAt, url: await this.storage.getPresignedUrl(attachment.filePath),
    })));
    return { ...entity, attachments };
  }

  private async notifyAnnouncement(
    announcementId: string,
    audiences: AnnouncementAudienceType[],
  ) {
    const roleAudiences = audiences.filter((audience) => audience !== AnnouncementAudienceType.ALL_STAFF && audience !== AnnouncementAudienceType.CLIENT_PORTAL);
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          ...(audiences.includes(AnnouncementAudienceType.ALL_STAFF) ? [{ role: { name: { not: "CLIENT" } } }] : []),
          ...(roleAudiences.length ? [{ role: { name: { in: roleAudiences.map((audience) => audience) } } }] : []),
          ...(audiences.includes(AnnouncementAudienceType.CLIENT_PORTAL) ? [{ role: { name: "CLIENT" } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!users.length) return;
    await this.notifications.notifyUsers({
      userIds: users.map((user) => user.id),
      entityId: announcementId,
      entityType: "announcement",
      eventType: NotificationEventType.ANNOUNCEMENT_PUBLISHED,
      metadata: { announcementId },
    });
  }

  private validateActionUrl(value?: string) {
    if (!value) return undefined;
    const url = value.trim();
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    throw new BadRequestException({ code: "INVALID_ANNOUNCEMENT_ACTION_URL" });
  }

  private validateDates(startsAt?: string, expiresAt?: string) {
    if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
      throw new BadRequestException({ code: "INVALID_ANNOUNCEMENT_DATES" });
    }
  }
}
