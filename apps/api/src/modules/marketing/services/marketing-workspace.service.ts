import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CampaignPlatform, CampaignStatus, MarketingStrategyStatus, TaskDepartment, TaskStatus, UserRole } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { TasksService } from "../../tasks/services/tasks.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { ClientProfileService } from "../../crm/services/client-profile.service";
import { CampaignsService } from "./campaigns.service";
import { MarketingStrategyService } from "./marketing-strategy.service";
import { MarketingCampaignKpiDto, MarketingCampaignKpiQueryDto, MarketingTaskQueryDto, MarketingStrategyQueryDto, MarketingCampaignQueryDto } from "../dto/marketing-workspace.dto";
import { CreateCampaignDto, UpdateCampaignDto } from "../dto/campaign.dto";

@Injectable()
export class MarketingWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
    private readonly campaigns: CampaignsService,
    private readonly strategies: MarketingStrategyService,
    private readonly storage: StorageService,
    private readonly clientProfile: ClientProfileService,
  ) {}

  private taskScope(userId: string) {
    return { assignedTo: userId, archivedAt: null, department: { name: TaskDepartment.MARKETING } };
  }

  private async ownedTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, ...this.taskScope(userId) }, select: { id: true } });
    if (!task) throw new NotFoundException({ code: "MARKETING_TASK_NOT_FOUND", details: {} });
    return task;
  }

  private async findMarketingTasks(userId: string, query: MarketingTaskQueryDto, pagination = true) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const term = query.search?.trim();
    const where: Prisma.TaskWhereInput = {
      ...this.taskScope(userId),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.dueBefore || query.dueAfter ? { dueDate: { ...(query.dueBefore ? { lte: new Date(query.dueBefore) } : {}), ...(query.dueAfter ? { gte: new Date(query.dueAfter) } : {}) } } : {}),
      ...(term ? { OR: [{ title: { contains: term, mode: "insensitive" } }, { project: { name: { contains: term, mode: "insensitive" } } }, { project: { client: { companyName: { contains: term, mode: "insensitive" } } } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({ where, orderBy: { dueDate: "asc" }, ...(pagination ? { skip: (page - 1) * limit, take: limit } : {}), include: { project: { include: { client: { select: { companyName: true, businessType: true } } } }, period: true, campaigns: { where: { isArchived: false }, include: { kpiSnapshots: { orderBy: { recordedAt: "desc" }, take: 1 } } } } }),
      this.prisma.task.count({ where }),
    ]);
    const items = rows.map((task) => ({ ...task, dueDate: task.dueDate.toISOString(), isOverdue: task.dueDate < new Date() && task.status !== TaskStatus.DONE, campaigns: task.campaigns.map((campaign) => ({ ...campaign, conversions: campaign.kpiSnapshots[0]?.conversions ?? 0 })) }));
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async overview(userId: string, query: MarketingTaskQueryDto) {
    const [tasks, strategies, campaigns] = await Promise.all([
      this.findMarketingTasks(userId, query, false),
      this.prisma.marketingStrategy.findMany({ where: { task: this.taskScope(userId) }, select: { status: true } }),
      this.prisma.campaign.findMany({ where: { managedBy: userId, isArchived: false }, select: { status: true, needsOptimization: true } }),
    ]);
    const byStatus = (status: TaskStatus) => tasks.items.filter((item) => item.status === status);
    return { summary: { totalTasks: tasks.total, todo: byStatus(TaskStatus.TODO).length, inProgress: byStatus(TaskStatus.IN_PROGRESS).length, inReview: byStatus(TaskStatus.IN_REVIEW).length, revision: byStatus(TaskStatus.REVISION).length, overdue: tasks.items.filter((item) => item.isOverdue).length, strategiesWaitingForClient: strategies.filter((item) => item.status === MarketingStrategyStatus.SENT).length, strategiesNeedingRevision: strategies.filter((item) => item.status === MarketingStrategyStatus.REVISION_REQUESTED).length, approvedStrategies: strategies.filter((item) => item.status === MarketingStrategyStatus.APPROVED).length, activeCampaigns: campaigns.filter((item) => item.status === CampaignStatus.ACTIVE).length, campaignsNeedingOptimization: campaigns.filter((item) => item.needsOptimization).length }, kanban: Object.fromEntries(Object.values(TaskStatus).map((status) => [status, byStatus(status)])), items: tasks.items };
  }

  async listTasks(userId: string, query: MarketingTaskQueryDto) {
    return this.findMarketingTasks(userId, query);
  }

  async clientView(userId: string, clientId: string) {
    const access = await this.prisma.task.findFirst({ where: { ...this.taskScope(userId), project: { clientId } }, select: { id: true } });
    if (!access) throw new NotFoundException({ code: "MARKETING_CLIENT_NOT_FOUND", details: {} });
    return this.clientProfile.getTeamView(clientId);
  }

  async taskDetail(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    const task = await this.tasks.findOne(taskId);
    const [strategy, campaigns] = await Promise.all([this.strategies.findByTask(taskId), this.campaigns.findByTask(taskId)]);
    return { ...task, comments: task.comments.filter((comment) => !comment.isInternal), marketing: { strategy, campaigns } };
  }

  async changeTaskStatus(userId: string, taskId: string, status: TaskStatus) {
    await this.ownedTask(userId, taskId);
    if (status === TaskStatus.TODO || status === TaskStatus.DONE) throw new BadRequestException({ code: "MARKETING_TASK_STATUS_FORBIDDEN", details: {} });
    return this.tasks.changeStatus(taskId, userId, status);
  }

  async taskComments(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    return { items: (await this.tasks.getComments(taskId)).filter((comment) => !comment.isInternal) };
  }

  async addTaskComment(userId: string, taskId: string, content: string) {
    await this.ownedTask(userId, taskId);
    return this.tasks.addComment(taskId, userId, { content, isInternal: false });
  }

  async taskFiles(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    return { items: await this.tasks.getFiles(taskId) };
  }

  async deleteTaskFile(userId: string, taskId: string, fileId: string) { await this.ownedTask(userId, taskId); return this.tasks.deleteFile(taskId, fileId); }

  async uploadTaskFile(userId: string, taskId: string, file: Express.Multer.File, purpose?: string) {
    await this.ownedTask(userId, taskId);
    if (!file) throw new BadRequestException({ code: "FILE_REQUIRED", details: {} });
    const upload = await this.storage.upload({ category: StorageCategory.TASK_FILE, entityId: taskId, file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size } });
    return this.tasks.addFile(taskId, userId, { key: upload.key, originalName: file.originalname, mimeType: file.mimetype, size: file.size, purpose });
  }

  async downloadTaskFile(userId: string, taskId: string, fileId: string) {
    await this.ownedTask(userId, taskId);
    return { url: await this.tasks.getDownloadUrl(taskId, fileId) };
  }

  async strategiesList(userId: string, query: MarketingStrategyQueryDto) {
    const where: Prisma.MarketingStrategyWhereInput = { task: this.taskScope(userId) };
    if (query.status) where.status = query.status;
    if (query.taskId) where.taskId = query.taskId;
    if (query.projectId) where.projectId = query.projectId;
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.marketingStrategy.findMany({ where, include: { task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } }, creator: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.marketingStrategy.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  private async ownedStrategy(userId: string, id: string) {
    const strategy = await this.prisma.marketingStrategy.findFirst({ where: { id, task: this.taskScope(userId) } });
    if (!strategy) throw new NotFoundException({ code: "MARKETING_STRATEGY_NOT_FOUND", details: {} });
    return strategy;
  }

  async strategyDetail(userId: string, id: string) { await this.ownedStrategy(userId, id); return this.strategies.findOne(id); }
  async sendStrategy(userId: string, id: string) { await this.ownedStrategy(userId, id); return this.strategies.sendToClient(id, userId); }
  async resubmitStrategy(userId: string, id: string, file: { key: string; originalName: string; size: number; mimeType: string }) { await this.ownedStrategy(userId, id); return this.strategies.resubmit(id, file, userId); }
  async strategyDownload(userId: string, id: string) { await this.ownedStrategy(userId, id); return { url: await this.strategies.getDownloadUrl(id) }; }

  async campaignStats(userId: string, role: string) { return this.campaigns.myStats(userId, role as UserRole); }

  async campaignsList(userId: string, query: MarketingCampaignQueryDto) {
    const where: Prisma.CampaignWhereInput = {
      isArchived: false,
      OR: [{ managedBy: userId }, { createdBy: userId }],
    };
    if (query.status) where.status = query.status; if (query.platform) where.platform = query.platform; if (query.taskId) where.taskId = query.taskId; if (query.projectId) where.projectId = query.projectId;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.AND = [
        { OR: [{ managedBy: userId }, { createdBy: userId }] },
        { OR: [{ name: { contains: search, mode: "insensitive" } }, { client: { companyName: { contains: search, mode: "insensitive" } } }] },
      ];
      delete where.OR;
    }
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? "createdAt";
    const orderBy: Prisma.CampaignOrderByWithRelationInput = { [sortBy]: query.sortOrder ?? "desc" };
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({ where, include: { client: { select: { id: true, companyName: true } }, task: { select: { id: true, title: true } }, project: { select: { id: true, name: true } }, kpiSnapshots: { orderBy: { recordedAt: "desc" }, take: 1 } }, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.campaign.count({ where }),
    ]);
    return { items: data.map(({ kpiSnapshots, ...campaign }) => ({ ...campaign, analytics: kpiSnapshots[0] ?? { impressions: 0, clicks: 0, conversions: 0, revenue: 0, cpc: 0, cpa: 0, ctr: 0, conversionRate: 0, roas: 0 } })), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async ownedCampaign(userId: string, id: string, includeArchived = false) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        ...(includeArchived ? {} : { isArchived: false }),
        OR: [{ managedBy: userId }, { createdBy: userId }],
      },
    });
    if (!campaign) throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    return campaign;
  }

  async campaignDetail(userId: string, id: string) { await this.ownedCampaign(userId, id, true); return this.campaigns.findOne(id, userId); }
  async createCampaign(userId: string, dto: CreateCampaignDto) { await this.ownedTask(userId, dto.taskId); return this.campaigns.create(dto, userId); }
  async updateCampaign(userId: string, id: string, dto: UpdateCampaignDto) { await this.ownedCampaign(userId, id); return this.campaigns.update(id, dto, userId); }
  async campaignStatus(userId: string, id: string, status: CampaignStatus) { await this.ownedCampaign(userId, id); return this.campaigns.updateStatus(id, status, userId, userId); }
  async campaignKpi(userId: string, id: string, dto: MarketingCampaignKpiDto) { await this.ownedCampaign(userId, id); return this.campaigns.createKpiSnapshot(id, dto, userId, userId); }
  async campaignKpis(userId: string, id: string, query: MarketingCampaignKpiQueryDto) {
    await this.ownedCampaign(userId, id);
    return this.campaigns.getKpiSnapshots(id, query, userId);
  }
  async optimization(userId: string, id: string, value: boolean) { await this.ownedCampaign(userId, id); return this.campaigns.flagOptimization(id, value, userId, userId); }
  async duplicateCampaign(userId: string, id: string) { await this.ownedCampaign(userId, id); return this.campaigns.duplicate(id, userId); }
  async archiveCampaign(userId: string, id: string) { await this.ownedCampaign(userId, id); return this.campaigns.archive(id, userId); }
  async unarchiveCampaign(userId: string, id: string) { await this.ownedCampaign(userId, id, true); return this.campaigns.unarchive(id, userId); }
}
