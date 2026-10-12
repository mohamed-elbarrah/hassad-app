import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  AnnouncementAudienceType,
  AnnouncementStatus,
  IssueStatus,
  Prisma,
} from "@prisma/client";
import {
  CreateAnnouncementDto,
  CreateIssueMessageDto,
  CreateIssueReportDto,
  UpdateAnnouncementDto,
  UpdateAnnouncementStatusDto,
  UpdateIssueStatusDto,
} from "../dto/communication.dto";
import { StorageService } from "../../../common/storage/storage.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { NotificationEventType } from "@hassad/shared";
import { StorageCategory, EXTENSION_MIME_MAP, STORAGE_CONFIG } from "../../../common/storage/storage.constants";
import { extname } from "path";

const ISSUE_MAX_FILES = 5;
const ISSUE_MAX_TOTAL_SIZE = 50 * 1024 * 1024;

const announcementStatusTransitions = (
  status: AnnouncementStatus,
  startsAt?: Date | null,
  expiresAt?: Date | null,
  now = new Date(),
): AnnouncementStatus[] => {
  if (expiresAt && expiresAt <= now) {
    if (status === AnnouncementStatus.PUBLISHED) return [AnnouncementStatus.ARCHIVED];
    if (status === AnnouncementStatus.SCHEDULED) return [AnnouncementStatus.DRAFT];
    return [];
  }
  switch (status) {
    case AnnouncementStatus.DRAFT:
      return startsAt && startsAt > now ? [AnnouncementStatus.SCHEDULED] : [AnnouncementStatus.PUBLISHED];
    case AnnouncementStatus.SCHEDULED:
      return [AnnouncementStatus.DRAFT];
    case AnnouncementStatus.PUBLISHED:
      return [AnnouncementStatus.ARCHIVED];
    case AnnouncementStatus.ARCHIVED:
      return [AnnouncementStatus.DRAFT];
  }
};

const ISSUE_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  OPEN: [IssueStatus.IN_PROGRESS, IssueStatus.CLOSED],
  IN_PROGRESS: [IssueStatus.WAITING_FOR_USER, IssueStatus.RESOLVED, IssueStatus.CLOSED],
  WAITING_FOR_USER: [IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.CLOSED],
  RESOLVED: [IssueStatus.CLOSED, IssueStatus.IN_PROGRESS],
  CLOSED: [],
};

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
      status: AnnouncementStatus.PUBLISHED,
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
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
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
      data: { data: data.map((announcement) => ({
        ...announcement,
        availableTransitions: announcementStatusTransitions(announcement.status, announcement.startsAt, announcement.expiresAt),
      })) },
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
    this.validateDates(dto.startsAt, dto.expiresAt);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    let shouldNotify = false;

    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{
          id: string;
          status: AnnouncementStatus;
          expiresAt: Date | null;
          publishedAt: Date | null;
        }>>`
          SELECT "id", "status", "expires_at" AS "expiresAt", "published_at" AS "publishedAt"
          FROM "announcements"
          WHERE "id" = ${id}
          FOR UPDATE
        `;
        const existing = locked[0];
        if (!existing) throw new NotFoundException({ code: "ANNOUNCEMENT_NOT_FOUND" });
        if (existing.status === AnnouncementStatus.ARCHIVED) {
          throw new BadRequestException({ code: "ANNOUNCEMENT_ARCHIVED" });
        }

        const now = new Date();
        const hasFutureStart = Boolean(startsAt && startsAt > now);
        const expirationHasPassed = Boolean(
          (existing.expiresAt && existing.expiresAt <= now) || (expiresAt && expiresAt <= now),
        );
        const shouldArchiveExpired = expirationHasPassed
          && (existing.status === AnnouncementStatus.PUBLISHED || existing.status === AnnouncementStatus.SCHEDULED);
        const nextStatus = shouldArchiveExpired
          ? AnnouncementStatus.ARCHIVED
          : existing.status === AnnouncementStatus.PUBLISHED
            ? hasFutureStart ? AnnouncementStatus.SCHEDULED : AnnouncementStatus.PUBLISHED
            : existing.status === AnnouncementStatus.SCHEDULED
              ? hasFutureStart ? AnnouncementStatus.SCHEDULED : AnnouncementStatus.DRAFT
              : hasFutureStart ? AnnouncementStatus.SCHEDULED : AnnouncementStatus.DRAFT;
        shouldNotify = nextStatus === AnnouncementStatus.PUBLISHED && existing.status !== AnnouncementStatus.PUBLISHED;

        if (shouldNotify) {
          await tx.announcement.updateMany({
            where: { status: AnnouncementStatus.PUBLISHED, id: { not: id } },
            data: { status: AnnouncementStatus.ARCHIVED, archivedAt: now },
          });
        }
        await tx.announcementAudience.deleteMany({ where: { announcementId: id } });
        return tx.announcement.update({
          where: { id },
          data: {
            title: dto.title.trim(),
            body: dto.body.trim(),
            type: dto.type,
            startsAt,
            expiresAt,
            allowDismissal: dto.allowDismissal ?? true,
            actionLabel: dto.actionLabel?.trim() || null,
            actionUrl: this.validateActionUrl(dto.actionUrl) ?? null,
            status: nextStatus,
            publishedAt: nextStatus === AnnouncementStatus.PUBLISHED
              ? existing.publishedAt ?? now
              : nextStatus === AnnouncementStatus.ARCHIVED
                ? existing.publishedAt
                : null,
            archivedAt: nextStatus === AnnouncementStatus.ARCHIVED ? now : null,
            audiences: { create: dto.audiences.map((audience) => ({ audience })) },
          },
          include: { audiences: true },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({ code: "ANNOUNCEMENT_ALREADY_ACTIVE" });
      }
      throw error;
    }
    if (shouldNotify) {
      await this.notifyAnnouncement(updated.id, updated.audiences.map((item) => item.audience));
    }
    return updated;
  }

  async updateAnnouncementStatus(id: string, dto: UpdateAnnouncementStatusDto) {
    let shouldNotify = false;
    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{
          id: string;
          status: AnnouncementStatus;
          startsAt: Date | null;
          expiresAt: Date | null;
          publishedAt: Date | null;
        }>>`
          SELECT "id", "status", "starts_at" AS "startsAt", "expires_at" AS "expiresAt", "published_at" AS "publishedAt"
          FROM "announcements"
          WHERE "id" = ${id}
          FOR UPDATE
        `;
        const existing = locked[0];
        if (!existing) throw new NotFoundException({ code: "ANNOUNCEMENT_NOT_FOUND" });
        if (existing.status === dto.status) {
          return tx.announcement.findUnique({ where: { id }, include: { audiences: true } });
        }

        const now = new Date();
        if ((dto.status === AnnouncementStatus.PUBLISHED || dto.status === AnnouncementStatus.SCHEDULED)
          && existing.expiresAt && existing.expiresAt <= now) {
          throw new BadRequestException({ code: "ANNOUNCEMENT_EXPIRED" });
        }
        const allowed = announcementStatusTransitions(existing.status, existing.startsAt, existing.expiresAt, now);
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException({ code: "INVALID_ANNOUNCEMENT_STATUS_TRANSITION" });
        }
        if (dto.status === AnnouncementStatus.PUBLISHED && existing.startsAt && existing.startsAt > now) {
          throw new BadRequestException({ code: "ANNOUNCEMENT_START_DATE_NOT_REACHED" });
        }
        if (dto.status === AnnouncementStatus.SCHEDULED && (!existing.startsAt || existing.startsAt <= now)) {
          throw new BadRequestException({ code: "ANNOUNCEMENT_SCHEDULE_DATE_REQUIRED" });
        }

        shouldNotify = dto.status === AnnouncementStatus.PUBLISHED;
        if (shouldNotify) await tx.announcement.updateMany({
          where: { status: AnnouncementStatus.PUBLISHED, id: { not: id } },
          data: { status: AnnouncementStatus.ARCHIVED, archivedAt: now },
        });
        return tx.announcement.update({
          where: { id },
          data: {
            status: dto.status,
            publishedAt: dto.status === AnnouncementStatus.PUBLISHED
              ? now
              : dto.status === AnnouncementStatus.ARCHIVED
                ? existing.publishedAt
                : null,
            archivedAt: dto.status === AnnouncementStatus.ARCHIVED ? now : null,
          },
          include: { audiences: true },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({ code: "ANNOUNCEMENT_ALREADY_ACTIVE" });
      }
      throw error;
    }

    if (shouldNotify) {
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
    const targetStatus = announcement.startsAt && announcement.startsAt > new Date()
      ? AnnouncementStatus.SCHEDULED
      : AnnouncementStatus.PUBLISHED;
    return this.updateAnnouncementStatus(id, { status: targetStatus });
  }

  @Cron("*/1 * * * *")
  async activateScheduledAnnouncements() {
    const now = new Date();
    await this.prisma.announcement.updateMany({
      where: {
        status: { in: [AnnouncementStatus.SCHEDULED, AnnouncementStatus.PUBLISHED] },
        expiresAt: { lte: now },
      },
      data: { status: AnnouncementStatus.ARCHIVED, archivedAt: now },
    });

    // Activate the earliest due item per tick so queued announcements each get a visible interval.
    const scheduled = await this.prisma.announcement.findFirst({
      where: {
        status: AnnouncementStatus.SCHEDULED,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      include: { audiences: true },
    });
    if (!scheduled) return;

    const activated = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; startsAt: Date | null; expiresAt: Date | null }>>`
        SELECT "id", "starts_at" AS "startsAt", "expires_at" AS "expiresAt"
        FROM "announcements"
        WHERE "id" = ${scheduled.id} AND "status" = 'SCHEDULED'::"announcement_statuses"
        FOR UPDATE
      `;
      if (!locked.length) return null;

      const activationTime = new Date();
      if (locked[0].expiresAt && locked[0].expiresAt <= activationTime) {
        await tx.announcement.update({ where: { id: scheduled.id }, data: { status: AnnouncementStatus.ARCHIVED, archivedAt: activationTime } });
        return null;
      }
      if (locked[0].startsAt && locked[0].startsAt > activationTime) return null;

      await tx.announcement.updateMany({
        where: { status: AnnouncementStatus.PUBLISHED, id: { not: scheduled.id } },
        data: { status: AnnouncementStatus.ARCHIVED, archivedAt: now },
      });
      return tx.announcement.update({
        where: { id: scheduled.id },
        data: { status: AnnouncementStatus.PUBLISHED, publishedAt: now, archivedAt: null },
        include: { audiences: true },
      });
    });
    if (activated) {
      await this.notifyAnnouncement(activated.id, activated.audiences.map((item) => item.audience));
    }
  }

  async archiveAnnouncement(id: string) {
    const announcement = await this.updateAnnouncementStatus(id, { status: AnnouncementStatus.ARCHIVED });
    return { id: announcement.id, status: announcement.status };
  }

  async createIssue(userId: string, source: "DASHBOARD" | "PORTAL", dto: CreateIssueReportDto, files?: Express.Multer.File[]) {
    const issue = await this.prisma.issueReport.create({
      data: {
        reporterId: userId, source, category: dto.category,
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
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      include: { attachments: true },
    }).then((issues) => Promise.all(issues.map((issue) => this.withAttachmentUrls(issue))));
  }

  async listIssues(query: { page?: number; limit?: number; search?: string; status?: IssueStatus }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Prisma.IssueReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] } : {}),
    };
    const [issues, total] = await Promise.all([
      this.prisma.issueReport.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ status: "asc" }, { createdAt: "desc" }], include: { reporter: { select: { id: true, name: true, email: true } }, attachments: true } }),
      this.prisma.issueReport.count({ where }),
    ]);
    return {
      __standardResponse: true as const,
      data: { data: await Promise.all(issues.map(async (issue) => ({
        ...await this.withAttachmentUrls(issue),
        availableTransitions: ISSUE_STATUS_TRANSITIONS[issue.status],
      }))) },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getIssue(id: string, userId?: string) {
    const issue = await this.prisma.issueReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true } }, attachments: true } },
        attachments: true,
        history: {
          orderBy: { createdAt: "asc" },
          select: { id: true, eventCode: true, createdAt: true },
        },
      },
    });
    if (!issue) throw new NotFoundException({ code: "ISSUE_NOT_FOUND" });
    if (userId && issue.reporterId !== userId) {
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
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; status: IssueStatus }>>`
        SELECT "id", "status" FROM "issue_reports" WHERE "id" = ${id} FOR UPDATE
      `;
      const existing = locked[0];
      if (!existing) throw new NotFoundException({ code: "ISSUE_NOT_FOUND" });
      if (existing.status !== dto.status && !ISSUE_STATUS_TRANSITIONS[existing.status].includes(dto.status)) {
        throw new BadRequestException({ code: "INVALID_ISSUE_STATUS_TRANSITION" });
      }
      const now = new Date();
      const issue = await tx.issueReport.update({
        where: { id },
        data: {
          status: dto.status,
          resolvedAt: dto.status === IssueStatus.RESOLVED ? now : null,
          closedAt: dto.status === IssueStatus.CLOSED ? now : null,
        },
      });
      await tx.issueHistory.create({ data: { issueId: id, changedBy: userId, eventCode: `ISSUE_STATUS_${dto.status}` } });
      return issue;
    });
  }

  async addIssueMessage(id: string, authorId: string, dto: CreateIssueMessageDto, isAdmin = false, files?: Express.Multer.File[]) {
    const issue = await this.getIssue(id);
    if (!isAdmin && issue.reporterId !== authorId) throw new ForbiddenException({ code: "PERMISSION_DENIED" });
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
