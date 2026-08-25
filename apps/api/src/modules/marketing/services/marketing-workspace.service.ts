import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CampaignPlatform, CampaignStatus, MarketingStrategyStatus, TaskDepartment, TaskStatus } from "@hassad/shared";
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
    if (!task) throw new NotFoundException("Marketing task not found");
    return task;
  }

  async overview(userId: string, query: MarketingTaskQueryDto) {
    const tasks = await this.tasks.findMine(userId, {
      status: query.status,
      priority: query.priority,
      projectId: query.projectId,
      dueBefore: query.dueBefore,
      dueAfter: query.dueAfter,
      deptName: TaskDepartment.MARKETING,
    });
    const term = query.search?.trim().toLowerCase();
    const items = tasks.filter((task: any) => !term || [task.title, task.project?.name].filter(Boolean).join(" ").toLowerCase().includes(term)).map((task: any) => ({
      id: task.id, title: task.title, description: task.description ?? null, status: task.status, priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString(), isOverdue: new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE,
      revisionCount: task.revisionCount ?? 0, project: task.project ? { id: task.project.id, name: task.project.name } : null,
      period: task.period ? { id: task.period.id, label: `P${task.period.periodNumber}` } : null,
    }));
    const [strategies, campaigns] = await Promise.all([
      this.prisma.marketingStrategy.findMany({ where: { task: this.taskScope(userId) }, select: { status: true } }),
      this.prisma.campaign.findMany({ where: { managedBy: userId, isArchived: false }, select: { status: true, needsOptimization: true } }),
    ]);
    const byStatus = (status: TaskStatus) => items.filter((item) => item.status === status);
    return {
      summary: {
        totalTasks: items.length,
        todo: byStatus(TaskStatus.TODO).length,
        inProgress: byStatus(TaskStatus.IN_PROGRESS).length,
        inReview: byStatus(TaskStatus.IN_REVIEW).length,
        revision: byStatus(TaskStatus.REVISION).length,
        overdue: items.filter((item) => item.isOverdue).length,
        strategiesWaitingForClient: strategies.filter((item) => item.status === MarketingStrategyStatus.SENT).length,
        strategiesNeedingRevision: strategies.filter((item) => item.status === MarketingStrategyStatus.REVISION_REQUESTED).length,
        approvedStrategies: strategies.filter((item) => item.status === MarketingStrategyStatus.APPROVED).length,
        activeCampaigns: campaigns.filter((item) => item.status === CampaignStatus.ACTIVE).length,
        campaignsNeedingOptimization: campaigns.filter((item) => item.needsOptimization).length,
      },
      kanban: Object.fromEntries(Object.values(TaskStatus).map((status) => [status, byStatus(status)])),
      items,
    };
  }

  async listTasks(userId: string, query: MarketingTaskQueryDto) {
    const result = await this.overview(userId, query);
    const limit = query.limit ?? 50; const page = query.page ?? 1;
    return { items: result.items.slice((page - 1) * limit, page * limit), page, limit, total: result.items.length, totalPages: Math.ceil(result.items.length / limit) };
  }

  async clientView(userId: string, clientId: string) {
    const access = await this.prisma.task.findFirst({ where: { ...this.taskScope(userId), project: { clientId } }, select: { id: true } });
    if (!access) throw new NotFoundException("Client not found");
    return this.clientProfile.getTeamView(clientId);
  }

  async taskDetail(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    const task = await this.tasks.findOne(taskId);
    const [strategy, campaigns] = await Promise.all([this.strategies.findByTask(taskId), this.campaigns.findByTask(taskId)]);
    return { ...task, comments: task.comments.filter((comment: any) => !comment.isInternal), marketing: { strategy, campaigns } };
  }

  async changeTaskStatus(userId: string, taskId: string, status: TaskStatus) {
    await this.ownedTask(userId, taskId);
    if (status === TaskStatus.TODO || status === TaskStatus.DONE) throw new BadRequestException("Marketing users cannot make this transition");
    return this.tasks.changeStatus(taskId, userId, status);
  }

  async taskComments(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    return { items: (await this.tasks.getComments(taskId)).filter((comment: any) => !comment.isInternal) };
  }

  async addTaskComment(userId: string, taskId: string, content: string) {
    await this.ownedTask(userId, taskId);
    return this.tasks.addComment(taskId, userId, { content, isInternal: false });
  }

  async taskFiles(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    return { items: await this.tasks.getFiles(taskId) };
  }

  async uploadTaskFile(userId: string, taskId: string, file: Express.Multer.File, purpose?: string) {
    await this.ownedTask(userId, taskId);
    if (!file) throw new BadRequestException("Task file is required");
    const upload = await this.storage.upload({ category: StorageCategory.TASK_FILE, entityId: taskId, file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size } });
    return this.tasks.addFile(taskId, userId, { key: upload.key, originalName: file.originalname, mimeType: file.mimetype, size: file.size, purpose });
  }

  async downloadTaskFile(userId: string, taskId: string, fileId: string) {
    await this.ownedTask(userId, taskId);
    return { url: await this.tasks.getDownloadUrl(taskId, fileId) };
  }

  async strategiesList(userId: string, query: MarketingStrategyQueryDto) {
    const where: any = { task: this.taskScope(userId) };
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
    if (!strategy) throw new NotFoundException("Marketing strategy not found");
    return strategy;
  }

  async strategyDetail(userId: string, id: string) { await this.ownedStrategy(userId, id); return this.strategies.findOne(id); }
  async sendStrategy(userId: string, id: string) { await this.ownedStrategy(userId, id); return this.strategies.sendToClient(id, userId); }
  async resubmitStrategy(userId: string, id: string, file: any) { await this.ownedStrategy(userId, id); return this.strategies.resubmit(id, file, userId); }
  async strategyDownload(userId: string, id: string) { await this.ownedStrategy(userId, id); return { url: await this.strategies.getDownloadUrl(id) }; }

  async campaignsList(userId: string, query: MarketingCampaignQueryDto) {
    const where: Prisma.CampaignWhereInput = {
      isArchived: false,
      OR: [{ managedBy: userId }, { createdBy: userId }],
    };
    if (query.status) where.status = query.status; if (query.platform) where.platform = query.platform; if (query.taskId) where.taskId = query.taskId; if (query.projectId) where.projectId = query.projectId;
    if (query.search?.trim()) { const search = query.search.trim(); where.OR = [{ name: { contains: search, mode: "insensitive" } }, { client: { companyName: { contains: search, mode: "insensitive" } } }]; }
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
    if (!campaign) throw new NotFoundException("Marketing campaign not found");
    return campaign;
  }

  async campaignDetail(userId: string, id: string) { await this.ownedCampaign(userId, id, true); return this.campaigns.findOne(id); }
  async createCampaign(userId: string, dto: CreateCampaignDto) { await this.ownedTask(userId, dto.taskId); return this.campaigns.create(dto, userId); }
  async updateCampaign(userId: string, id: string, dto: UpdateCampaignDto) { await this.ownedCampaign(userId, id); return this.campaigns.update(id, dto); }
  async campaignStatus(userId: string, id: string, status: CampaignStatus) { await this.ownedCampaign(userId, id); return this.campaigns.updateStatus(id, status, userId); }
  async campaignKpi(userId: string, id: string, dto: MarketingCampaignKpiDto) { await this.ownedCampaign(userId, id); return this.campaigns.createKpiSnapshot(id, dto, userId); }
  async campaignKpis(userId: string, id: string, query: MarketingCampaignKpiQueryDto) {
    await this.ownedCampaign(userId, id);
    return this.campaigns.getKpiSnapshots(id, query);
  }
  async optimization(userId: string, id: string, value: boolean) { await this.ownedCampaign(userId, id); return this.campaigns.flagOptimization(id, value, userId); }
  async duplicateCampaign(userId: string, id: string) { await this.ownedCampaign(userId, id); return this.campaigns.duplicate(id, userId); }
  async archiveCampaign(userId: string, id: string) { await this.ownedCampaign(userId, id); return this.campaigns.archive(id, userId); }
  async unarchiveCampaign(userId: string, id: string) { await this.ownedCampaign(userId, id, true); return this.campaigns.unarchive(id, userId); }
}
