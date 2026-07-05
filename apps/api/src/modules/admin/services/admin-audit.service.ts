import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuditLogQueryDto } from "../dto/admin.dto";

const ACTION_AR: Record<string, string> = {
  "ADMIN_FORCE_INVOICE_STATUS": "تغيير حالة فاتورة",
  "admin.tasks.reassign": "إعادة تعيين مهمة",
  "admin.tasks.force-transition": "تغيير حالة مهمة",
  "admin.users.create": "إنشاء مستخدم",
  "admin.users.reset-password": "إعادة تعيين كلمة مرور",
  "admin.users.impersonate": "انتحال هوية مستخدم",
  "admin.users.revoke-sessions": "إنهاء جلسات مستخدم",
  "admin.users.set-permissions": "تعيين صلاحيات مستخدم",
  "admin.users.activate": "تفعيل مستخدم",
  "admin.users.deactivate": "تعطيل مستخدم",
  "admin.users.changeRole": "تغيير دور مستخدم",
  "admin.users.reassignDepartment": "إعادة تعيين قسم لمستخدم",
  "admin.projects.reassign-pm": "إعادة تعيين مدير مشروع",
  "admin.projects.archive": "أرشفة مشروع",
  "admin.projects.force-status": "تغيير حالة مشروع",
  "admin.leads.reassign": "إعادة تعيين عميل متوقع",
  "ADMIN_TRIGGER_REFUND": "تنفيذ استرداد مالي",
  "ADMIN_RETRY_WEBHOOK": "إعادة محاولة ويب هوك",
};

const ENTITY_AR: Record<string, string> = {
  Invoice: "فاتورة",
  Task: "مهمة",
  Project: "مشروع",
  User: "مستخدم",
  Lead: "عميل متوقع",
  Client: "عميل",
  Contract: "عقد",
  Payment: "دفعة",
  Proposal: "عرض",
  WebhookLog: "سجل ويب هوك",
  user: "مستخدم",
  task: "مهمة",
  project: "مشروع",
  lead: "عميل متوقع",
  disputeTicket: "تذكرة نزاع",
};

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLog(query: AuditLogQueryDto) {
    const {
      userId,
      action,
      entity,
      entityId,
      from,
      to,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };
    if (entityId) where.entityId = entityId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.ledger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.ledger.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        actionAr: ACTION_AR[item.action] ?? null,
        entity: item.entity,
        entityAr: ENTITY_AR[item.entity] ?? null,
        entityId: item.entityId,
        userId: item.userId,
        userName: item.user?.name ?? null,
        userEmail: item.user?.email ?? null,
        before: item.before,
        after: item.after,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Write an audit log entry — used by controllers/services throughout the app */
  async write(entry: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    before?: any;
    after?: any;
    metadata?: any;
  }) {
    return this.prisma.ledger.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId ?? null,
        before: entry.before ?? undefined,
        after: entry.after ?? undefined,
        metadata: entry.metadata ?? undefined,
      },
    });
  }

  /** Get available filter values for dropdowns */
  async getFilterOptions() {
    const [actions, entities, users] = await Promise.all([
      this.prisma.ledger.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
        take: 100,
      }),
      this.prisma.ledger.findMany({
        select: { entity: true },
        distinct: ["entity"],
        orderBy: { entity: "asc" },
        take: 50,
      }),
      this.prisma.ledger.findMany({
        select: {
          user: { select: { id: true, name: true } },
        },
        where: { userId: { not: null } },
        distinct: ["userId"],
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      actions: actions.map((a) => a.action),
      entities: entities.map((e) => e.entity),
      users: users
        .filter((u) => u.user)
        .map((u) => ({ id: u.user!.id, name: u.user!.name })),
    };
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [mostCommonActions, mostActiveUsers, actionsByDay, totalEntries] = await Promise.all([
      this.prisma.ledger.groupBy({
        by: ["action"],
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      this.prisma.ledger.groupBy({
        by: ["userId"],
        _count: true,
        where: { userId: { not: null } },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      this.prisma.ledger.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
      }),
      this.prisma.ledger.count(),
    ]);

    const userIds = mostActiveUsers
      .filter((u) => u.userId)
      .map((u) => u.userId);
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const dayCounts: Record<string, number> = {};
    for (const entry of actionsByDay) {
      const day = entry.createdAt.toISOString().slice(0, 10);
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    return {
      mostCommonActions: mostCommonActions.map((a) => ({
        action: a.action,
        count: a._count,
      })),
      mostActiveUsers: mostActiveUsers.map((u) => ({
        userId: u.userId,
        userName: userMap.get(u.userId) ?? null,
        count: u._count,
      })),
      actionsByDay: Object.entries(dayCounts).map(([date, count]) => ({
        date,
        count,
      })),
      totalEntries,
    };
  }
}
