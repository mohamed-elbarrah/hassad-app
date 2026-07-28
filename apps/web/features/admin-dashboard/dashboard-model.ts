import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import type {
  AdminAlertsResponse,
  AdminAttentionResponse,
  AdminDashboardTeamWorkload,
  AdminFunnel,
  AdminStats,
  AdminTrendsResponse,
} from "@/features/admin/adminApi";

export const PERIODS = {
  "7d": { label: "7 أيام", days: 7 },
  "30d": { label: "30 يومًا", days: 30 },
  "90d": { label: "90 يومًا", days: 90 },
} as const;

export type PeriodKey = keyof typeof PERIODS;
export type TrendKey = "revenue" | "newUsers" | "newClients" | "newProjects" | "tasksCompleted";

export type TrendOption = {
  key: TrendKey;
  label: string;
  format: "currency" | "number";
  color: string;
  data: number[];
};

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export function toPeriodParams(period: PeriodKey) {
  const days = PERIODS[period].days;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function computePercentChange(data: number[]) {
  if (data.length < 14) return null;
  const recent = data.slice(0, 7).reduce((sum, value) => sum + value, 0);
  const previous = data.slice(7, 14).reduce((sum, value) => sum + value, 0);
  if (previous === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - previous) / previous) * 100);
}

export function buildTrendOptions(trends: AdminTrendsResponse | undefined): TrendOption[] {
  return [
    { key: "revenue", label: "الإيرادات", format: "currency", color: "var(--chart-1)", data: trends?.revenue ?? [] },
    { key: "newUsers", label: "المستخدمون", format: "number", color: "var(--chart-2)", data: trends?.newUsers ?? [] },
    { key: "newClients", label: "العملاء", format: "number", color: "var(--chart-3)", data: trends?.newClients ?? [] },
    { key: "newProjects", label: "المشاريع", format: "number", color: "var(--chart-4)", data: trends?.newProjects ?? [] },
    { key: "tasksCompleted", label: "المهام المنجزة", format: "number", color: "var(--chart-5)", data: trends?.tasksCompleted ?? [] },
  ];
}

export function buildSupportAlerts(
  alerts: AdminAlertsResponse | undefined,
  attention: AdminAttentionResponse | undefined,
) {
  return [
    alerts?.overdueTasks.count
      ? {
          key: "overdueTasks",
          title: alerts.overdueTasks.label,
          count: alerts.overdueTasks.count,
          href: alerts.overdueTasks.link,
          tone: "danger" as const,
          items: alerts.overdueTasks.items.slice(0, 3).map((item) => ({
            title: item.title,
            meta: [item.assignee, item.dueDate ? formatDate(item.dueDate) : null].filter(Boolean).join(" • "),
          })),
        }
      : null,
    alerts?.agedInvoices.count
      ? {
          key: "agedInvoices",
          title: alerts.agedInvoices.label,
          count: alerts.agedInvoices.count,
          href: alerts.agedInvoices.link,
          tone: "danger" as const,
          items: alerts.agedInvoices.items.slice(0, 3).map((item) => ({
            title: `فاتورة ${item.invoiceNumber}`,
            meta: [item.clientName, formatCurrency(item.amount)].filter(Boolean).join(" • "),
          })),
        }
      : null,
    alerts?.expiringContracts.count
      ? {
          key: "expiringContracts",
          title: alerts.expiringContracts.label,
          count: alerts.expiringContracts.count,
          href: alerts.expiringContracts.link,
          tone: "warning" as const,
          items: alerts.expiringContracts.items.slice(0, 3).map((item) => ({
            title: item.title,
            meta: [item.clientName, item.endDate ? formatDate(item.endDate) : null].filter(Boolean).join(" • "),
          })),
        }
      : null,
    alerts?.pendingRequests.count
      ? {
          key: "pendingRequests",
          title: alerts.pendingRequests.label,
          count: alerts.pendingRequests.count,
          href: alerts.pendingRequests.link,
          tone: "warning" as const,
          items: alerts.pendingRequests.items.slice(0, 3).map((item) => ({
            title: item.companyName,
            meta: [item.contactName, formatRelativeTime(item.createdAt)].filter(Boolean).join(" • "),
          })),
        }
      : null,
    attention?.stalledProjects.length
      ? {
          key: "stalledProjects",
          title: "مشاريع متعطلة",
          count: attention.stalledProjects.length,
          href: "/dashboard/admin/projects",
          tone: "neutral" as const,
          items: attention.stalledProjects.slice(0, 3).map((item) => ({
            title: item.name,
            meta: item.client.companyName,
          })),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    count: number;
    href: string;
    tone: "danger" | "warning" | "neutral";
    items: Array<{ title: string; meta: string }>;
  }>;
}

export function buildExecutiveCards(stats: AdminStats | undefined) {
  if (!stats) return [];

  return [
    { label: "الإيرادات الشهرية", value: formatCurrency(stats.monthlyRevenue), tone: stats.monthlyRevenue > 0 ? "success" : ("neutral" as StatusTone) },
    { label: "العملاء النشطون", value: formatNumber(stats.activeClients), tone: stats.activeClients > 0 ? "success" : ("neutral" as StatusTone) },
    { label: "المشاريع الجارية", value: formatNumber(stats.activeProjects), tone: stats.activeProjects > 0 ? "success" : ("neutral" as StatusTone) },
    { label: "المهام المتأخرة", value: formatNumber(stats.overdueTasks), tone: stats.overdueTasks > 0 ? "danger" : ("success" as StatusTone) },
  ];
}

export function buildHeroSummary(stats: AdminStats | undefined) {
  if (!stats) return [];

  return [
    { label: "طلبات العملاء", value: formatNumber(stats.pendingRequests), tone: stats.pendingRequests > 0 ? "warning" : ("success" as StatusTone) },
    { label: "العقود المفتوحة", value: formatNumber(stats.totalInvoices - stats.unpaidInvoicesCount), tone: "neutral" as StatusTone },
    { label: "المهام الكلية", value: formatNumber(stats.totalTasks), tone: "neutral" as StatusTone },
    { label: "رضا العملاء", value: `${formatNumber(stats.satisfactionRate ?? 0)}%`, tone: (stats.satisfactionRate ?? 0) >= 80 ? "success" : ("warning" as StatusTone) },
  ];
}

export function buildCrmStages(funnel: AdminFunnel | undefined) {
  if (!funnel) return [];

  return [
    { label: "العملاء المتوقعون", value: funnel.leads, color: "var(--chart-1)" },
    { label: "العملاء", value: funnel.clients, color: "var(--chart-2)" },
    { label: "العروض", value: funnel.proposals, color: "var(--chart-3)" },
    { label: "العقود", value: funnel.contracts, color: "var(--chart-4)" },
    { label: "المشاريع", value: funnel.projects, color: "var(--chart-5)" },
  ];
}

export function buildProjectSeries(
  trends: AdminTrendsResponse | undefined,
  stats: AdminStats | undefined,
) {
  const labels = trends?.labels ?? [];
  return labels.map((label, index) => ({
    label,
    newProjects: trends?.newProjects?.[index] ?? 0,
    tasksCompleted: trends?.tasksCompleted?.[index] ?? 0,
    activeProjects: index === 0 ? stats?.activeProjects ?? 0 : 0,
  }));
}

export function buildTeamRadar(stats: AdminStats | undefined, workload: AdminDashboardTeamWorkload | undefined) {
  if (!stats) return [];

  const members = workload?.members ?? [];
  const avgSpeed = members.length
    ? members.reduce((sum, member) => sum + (member.avgCompletionSpeedDays ?? 0), 0) / members.length
    : 0;
  const avgQuality = members.length
    ? members.reduce((sum, member) => sum + (member.avgQualityScore ?? 0), 0) / members.length
    : 0;
  const activeLoad = members.length
    ? members.reduce((sum, member) => sum + member.activeTasksCount, 0) / members.length
    : 0;
  const maxLoad = Math.max(...members.map((member) => member.activeTasksCount), 1);
  const balance = members.length
    ? Math.max(35, 100 - Math.round((maxLoad / Math.max(activeLoad, 1)) * 20))
    : 50;

  return [
    { metric: "السعة", value: Math.min(100, Math.round((stats.totalTasks / Math.max(stats.activeProjects, 1)) * 10)), color: "var(--chart-1)" },
    { metric: "الإنتاجية", value: Math.min(100, Math.round((stats.completedProjects / Math.max(stats.activeProjects + 1, 1)) * 25)), color: "var(--chart-2)" },
    { metric: "الجودة", value: Math.round(avgQuality || 70), color: "var(--chart-3)" },
    { metric: "السرعة", value: Math.round(avgSpeed ? Math.max(25, 100 - avgSpeed * 10) : 65), color: "var(--chart-4)" },
    { metric: "التوازن", value: balance, color: "var(--chart-5)" },
    { metric: "ضغط التأخير", value: Math.max(10, Math.round(100 - (stats.overdueTasks / Math.max(stats.totalTasks, 1)) * 100)), color: "var(--chart-1)" },
  ];
}

export function buildClientMix(
  stats: AdminStats | undefined,
  alerts: AdminAlertsResponse | undefined,
  attention: AdminAttentionResponse | undefined,
) {
  if (!stats) return [];

  return [
    { name: "نشط", value: stats.activeClients, fill: "var(--chart-1)" },
    { name: "جديد", value: stats.newClientsThisMonth, fill: "var(--chart-2)" },
    { name: "معرّض", value: (alerts?.agedInvoices.count ?? 0) + (alerts?.expiringContracts.count ?? 0), fill: "var(--chart-3)" },
    { name: "قيد الانتظار", value: attention?.newRequests.length ?? 0, fill: "var(--chart-4)" },
  ];
}

export function buildBusinessPulse(stats: AdminStats | undefined) {
  if (!stats) return 0;

  const delivery = Math.max(0, 100 - Math.round((stats.overdueTasks / Math.max(stats.totalTasks, 1)) * 100));
  const retention = stats.retentionRate;
  const satisfaction = stats.satisfactionRate ?? 72;
  const momentum = Math.max(0, Math.min(100, 50 + (stats.revenueChange ?? 0)));
  return Math.round((delivery * 0.25) + (retention * 0.3) + (satisfaction * 0.25) + (momentum * 0.2));
}
