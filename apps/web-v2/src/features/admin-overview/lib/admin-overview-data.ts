import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  subDays,
} from "date-fns";

import type {
  ReportingGranularity,
  ReportingPreset,
  ReportingRange,
} from "@/features/reporting/lib/reporting-period";
import type { StatusTone } from "@/components/patterns/status-badge";

type MonthlyOverviewPoint = {
  month: string;
  revenue: number;
  qualifiedLeads: number;
  closedDeals: number;
  offersSent: number;
  activeContracts: number;
  activeProjectAmount: number;
  paidInvoicesAmount: number;
  unpaidInvoicesAmount: number;
};

type OverviewBucket = {
  date: Date;
  label: string;
  revenue: number;
  qualifiedLeads: number;
  closedDeals: number;
  offersSent: number;
  activeContracts: number;
  activeProjectAmount: number;
  paidInvoicesAmount: number;
  unpaidInvoicesAmount: number;
};

type KpiItem = {
  label: string;
  value: string;
  description: string;
  trend?: {
    label: string;
    tone: "success" | "warning" | "neutral";
  };
};

export type AdminOverviewSnapshot = {
  granularity: ReportingGranularity;
  kpis: KpiItem[];
  projectAmountChart: Array<{
    label: string;
    amount: number;
  }>;
  invoiceChart: Array<{
    label: string;
    paid: number;
    unpaid: number;
  }>;
  commercialChart: Array<{
    label: string;
    contracts: number;
    offers: number;
  }>;
  summaries: {
    projectAmount: string;
    paidInvoices: string;
    unpaidInvoices: string;
    activeContracts: string;
    offersSent: string;
  };
  leadOrders: Array<{
    id: string;
    clientName: string;
    companyName: string;
    stage: string;
    stageTone: StatusTone;
    calls: number;
    meetings: number;
    projects: string;
    projectsTone: StatusTone;
    owner: string;
    ownerInitials: string;
    nextAction: string;
    value: string;
  }>;
  salesLeaders: Array<{
    id: string;
    name: string;
    initials: string;
    role: string;
    deals: number;
    contracts: number;
    revenue: string;
    winRate: string;
  }>;
  activeProjects: Array<{
    id: string;
    name: string;
    clientName: string;
    state: string;
    stateTone: StatusTone;
    progress: string;
    pm: string;
    pmInitials: string;
    activeTasks: number;
    value: string;
  }>;
  clients: Array<{
    id: string;
    clientName: string;
    companyName: string;
    totalProjects: number;
    activeProjects: number;
    lastSeen: string;
    onlineTone: StatusTone;
    balance: string;
  }>;
};

const monthlyOverviewSeries: MonthlyOverviewPoint[] = [
  {
    month: "2025-08-01",
    revenue: 420000,
    qualifiedLeads: 68,
    closedDeals: 18,
    offersSent: 41,
    activeContracts: 33,
    activeProjectAmount: 1350000,
    paidInvoicesAmount: 310000,
    unpaidInvoicesAmount: 54000,
  },
  {
    month: "2025-09-01",
    revenue: 465000,
    qualifiedLeads: 72,
    closedDeals: 20,
    offersSent: 45,
    activeContracts: 35,
    activeProjectAmount: 1420000,
    paidInvoicesAmount: 326000,
    unpaidInvoicesAmount: 58000,
  },
  {
    month: "2025-10-01",
    revenue: 452000,
    qualifiedLeads: 70,
    closedDeals: 19,
    offersSent: 43,
    activeContracts: 34,
    activeProjectAmount: 1465000,
    paidInvoicesAmount: 319000,
    unpaidInvoicesAmount: 62000,
  },
  {
    month: "2025-11-01",
    revenue: 498000,
    qualifiedLeads: 78,
    closedDeals: 23,
    offersSent: 49,
    activeContracts: 37,
    activeProjectAmount: 1540000,
    paidInvoicesAmount: 341000,
    unpaidInvoicesAmount: 59000,
  },
  {
    month: "2025-12-01",
    revenue: 536000,
    qualifiedLeads: 80,
    closedDeals: 24,
    offersSent: 52,
    activeContracts: 38,
    activeProjectAmount: 1610000,
    paidInvoicesAmount: 368000,
    unpaidInvoicesAmount: 67000,
  },
  {
    month: "2026-01-01",
    revenue: 510000,
    qualifiedLeads: 77,
    closedDeals: 22,
    offersSent: 48,
    activeContracts: 39,
    activeProjectAmount: 1660000,
    paidInvoicesAmount: 352000,
    unpaidInvoicesAmount: 71000,
  },
  {
    month: "2026-02-01",
    revenue: 548000,
    qualifiedLeads: 84,
    closedDeals: 26,
    offersSent: 54,
    activeContracts: 41,
    activeProjectAmount: 1725000,
    paidInvoicesAmount: 381000,
    unpaidInvoicesAmount: 74000,
  },
  {
    month: "2026-03-01",
    revenue: 562000,
    qualifiedLeads: 86,
    closedDeals: 27,
    offersSent: 57,
    activeContracts: 42,
    activeProjectAmount: 1790000,
    paidInvoicesAmount: 392000,
    unpaidInvoicesAmount: 69000,
  },
  {
    month: "2026-04-01",
    revenue: 590000,
    qualifiedLeads: 88,
    closedDeals: 29,
    offersSent: 60,
    activeContracts: 44,
    activeProjectAmount: 1865000,
    paidInvoicesAmount: 407000,
    unpaidInvoicesAmount: 73000,
  },
  {
    month: "2026-05-01",
    revenue: 618000,
    qualifiedLeads: 91,
    closedDeals: 31,
    offersSent: 63,
    activeContracts: 45,
    activeProjectAmount: 1940000,
    paidInvoicesAmount: 426000,
    unpaidInvoicesAmount: 76000,
  },
  {
    month: "2026-06-01",
    revenue: 636000,
    qualifiedLeads: 94,
    closedDeals: 32,
    offersSent: 66,
    activeContracts: 47,
    activeProjectAmount: 2010000,
    paidInvoicesAmount: 438000,
    unpaidInvoicesAmount: 79000,
  },
  {
    month: "2026-07-01",
    revenue: 664000,
    qualifiedLeads: 97,
    closedDeals: 35,
    offersSent: 71,
    activeContracts: 49,
    activeProjectAmount: 2140000,
    paidInvoicesAmount: 462000,
    unpaidInvoicesAmount: 72000,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? "compact" : "standard",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatStandardCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBucketLabel(date: Date, granularity: ReportingGranularity) {
  if (granularity === "day") {
    return format(date, "dd MMM");
  }

  if (granularity === "quarter") {
    return `Q${Math.floor(date.getMonth() / 3) + 1} ${format(date, "yy")}`;
  }

  return format(date, "MMM");
}

function getMonthlyAnchors(range: ReportingRange) {
  return eachMonthOfInterval({
    start: startOfMonth(range.from),
    end: startOfMonth(range.to),
  });
}

function clampToSeriesRange(date: Date) {
  const min = parseISO(monthlyOverviewSeries[0].month);
  const max = parseISO(monthlyOverviewSeries.at(-1)!.month);

  if (isBefore(date, min)) {
    return min;
  }

  if (isAfter(date, max)) {
    return max;
  }

  return date;
}

function getNearestMonthlyPoint(date: Date) {
  const clamped = clampToSeriesRange(date);
  const targetMonth = format(startOfMonth(clamped), "yyyy-MM-01");

  return (
    monthlyOverviewSeries.find((point) => point.month === targetMonth) ??
    monthlyOverviewSeries.at(-1)!
  );
}

function buildDailyBuckets(range: ReportingRange): OverviewBucket[] {
  return eachDayOfInterval({
    start: range.from,
    end: range.to,
  }).map((date) => {
    const monthPoint = getNearestMonthlyPoint(date);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const daysInMonth = differenceInCalendarDays(monthEnd, monthStart) + 1;
    const dayIndex = differenceInCalendarDays(date, monthStart);
    const position = daysInMonth > 1 ? dayIndex / (daysInMonth - 1) : 0;

    return {
      date,
      label: formatBucketLabel(date, "day"),
      revenue: Math.round(
        monthPoint.revenue / daysInMonth + (position - 0.5) * (monthPoint.revenue / daysInMonth) * 0.18
      ),
      qualifiedLeads: Math.max(
        0,
        Math.round(
          monthPoint.qualifiedLeads / daysInMonth +
            Math.sin((position + 0.1) * Math.PI * 2) * 0.9
        )
      ),
      closedDeals: Math.max(
        0,
        Math.round(
          monthPoint.closedDeals / daysInMonth +
            Math.cos((position + 0.25) * Math.PI * 2) * 0.55
        )
      ),
      offersSent: Math.max(
        0,
        Math.round(
          monthPoint.offersSent / daysInMonth +
            Math.sin((position + 0.4) * Math.PI * 2) * 0.8
        )
      ),
      activeContracts: monthPoint.activeContracts,
      activeProjectAmount: Math.round(
        monthPoint.activeProjectAmount + Math.sin(position * Math.PI * 2) * 18000
      ),
      paidInvoicesAmount: Math.round(
        monthPoint.paidInvoicesAmount / daysInMonth +
          (0.7 - position) * (monthPoint.paidInvoicesAmount / daysInMonth) * 0.22
      ),
      unpaidInvoicesAmount: Math.max(
        0,
        Math.round(
          monthPoint.unpaidInvoicesAmount / daysInMonth +
            Math.cos((position + 0.2) * Math.PI * 2) * 420
        )
      ),
    };
  });
}

function buildMonthlyBuckets(range: ReportingRange): OverviewBucket[] {
  return getMonthlyAnchors(range).map((date) => {
    const point = getNearestMonthlyPoint(date);

    return {
      date,
      label: formatBucketLabel(date, "month"),
      revenue: point.revenue,
      qualifiedLeads: point.qualifiedLeads,
      closedDeals: point.closedDeals,
      offersSent: point.offersSent,
      activeContracts: point.activeContracts,
      activeProjectAmount: point.activeProjectAmount,
      paidInvoicesAmount: point.paidInvoicesAmount,
      unpaidInvoicesAmount: point.unpaidInvoicesAmount,
    };
  });
}

function buildQuarterlyBuckets(range: ReportingRange): OverviewBucket[] {
  const monthlyBuckets = buildMonthlyBuckets(range);
  const groups = new Map<string, OverviewBucket[]>();

  for (const bucket of monthlyBuckets) {
    const key = `${bucket.date.getFullYear()}-${Math.floor(bucket.date.getMonth() / 3)}`;
    const items = groups.get(key) ?? [];
    items.push(bucket);
    groups.set(key, items);
  }

  return Array.from(groups.values()).map((items) => {
    const first = items[0];

    return {
      date: first.date,
      label: formatBucketLabel(first.date, "quarter"),
      revenue: items.reduce((sum, item) => sum + item.revenue, 0),
      qualifiedLeads: items.reduce((sum, item) => sum + item.qualifiedLeads, 0),
      closedDeals: items.reduce((sum, item) => sum + item.closedDeals, 0),
      offersSent: items.reduce((sum, item) => sum + item.offersSent, 0),
      activeContracts: items.at(-1)!.activeContracts,
      activeProjectAmount: items.at(-1)!.activeProjectAmount,
      paidInvoicesAmount: items.reduce((sum, item) => sum + item.paidInvoicesAmount, 0),
      unpaidInvoicesAmount: items.reduce((sum, item) => sum + item.unpaidInvoicesAmount, 0),
    };
  });
}

function getOverviewBuckets(
  range: ReportingRange,
  granularity: ReportingGranularity
) {
  if (granularity === "day") {
    return buildDailyBuckets(range);
  }

  if (granularity === "quarter") {
    return buildQuarterlyBuckets(range);
  }

  return buildMonthlyBuckets(range);
}

export function getAdminOverviewSnapshot(
  range: ReportingRange,
  preset: ReportingPreset,
  granularity: ReportingGranularity
): AdminOverviewSnapshot {
  const buckets = getOverviewBuckets(range, granularity);
  const previousRangeDays = differenceInCalendarDays(range.to, range.from);
  const previousRange = {
    from: subDays(range.from, previousRangeDays + 1),
    to: subDays(range.to, previousRangeDays + 1),
  };
  const previousBuckets = getOverviewBuckets(previousRange, granularity);

  const revenue = buckets.reduce((sum, bucket) => sum + bucket.revenue, 0);
  const qualifiedLeads = buckets.reduce(
    (sum, bucket) => sum + bucket.qualifiedLeads,
    0
  );
  const closedDeals = buckets.reduce((sum, bucket) => sum + bucket.closedDeals, 0);
  const offersSent = buckets.reduce((sum, bucket) => sum + bucket.offersSent, 0);
  const paidInvoices = buckets.reduce(
    (sum, bucket) => sum + bucket.paidInvoicesAmount,
    0
  );
  const unpaidInvoices = buckets.reduce(
    (sum, bucket) => sum + bucket.unpaidInvoicesAmount,
    0
  );
  const lastBucket = buckets.at(-1) ?? buildMonthlyBuckets(range).at(-1)!;
  const previousLastBucket = previousBuckets.at(-1) ?? lastBucket;
  const conversionRate = qualifiedLeads > 0 ? (closedDeals / qualifiedLeads) * 100 : 0;
  const contractDelta = lastBucket.activeContracts - previousLastBucket.activeContracts;
  const offerDelta = offersSent - previousBuckets.reduce((sum, bucket) => sum + bucket.offersSent, 0);
  const scale = granularity === "day" ? 1 : granularity === "month" ? buckets.length : buckets.length * 2;

  return {
    granularity,
    kpis: [
      {
        label: "Revenue",
        value: formatCurrency(revenue),
        description:
          preset === "30d"
            ? "Closed revenue in the last 30 days"
            : "Revenue across selected period",
        trend: {
          label:
            granularity === "day"
              ? `${buckets.length} days`
              : `${buckets.length} ${granularity === "month" ? "months" : "quarters"}`,
          tone: "neutral",
        },
      },
      {
        label: "Conversion",
        value: formatPercent(conversionRate),
        description: "Closed deals from qualified leads",
        trend: {
          label: `${closedDeals} wins`,
          tone: "success",
        },
      },
      {
        label: "Active contracts",
        value: `${lastBucket.activeContracts}`,
        description: "Live commercial commitments",
        trend: {
          label: contractDelta >= 0 ? `+${contractDelta}` : `${contractDelta}`,
          tone: contractDelta >= 0 ? "success" : "warning",
        },
      },
      {
        label: "Offers sent",
        value: `${offersSent}`,
        description: "Offers issued in selected period",
        trend: {
          label: offerDelta >= 0 ? `+${offerDelta}` : `${offerDelta}`,
          tone: offerDelta >= 0 ? "success" : "warning",
        },
      },
    ],
    projectAmountChart: buckets.map((bucket) => ({
      label: bucket.label,
      amount: bucket.activeProjectAmount,
    })),
    invoiceChart: buckets.map((bucket) => ({
      label: bucket.label,
      paid: bucket.paidInvoicesAmount,
      unpaid: bucket.unpaidInvoicesAmount,
    })),
    commercialChart: buckets.map((bucket) => ({
      label: bucket.label,
      contracts: bucket.activeContracts,
      offers: bucket.offersSent,
    })),
    summaries: {
      projectAmount: formatCurrency(lastBucket.activeProjectAmount),
      paidInvoices: formatCurrency(paidInvoices),
      unpaidInvoices: formatCurrency(unpaidInvoices),
      activeContracts: `${lastBucket.activeContracts}`,
      offersSent: `${offersSent}`,
    },
    leadOrders: [
      {
        id: "lead-01",
        clientName: "Amina Khaled",
        companyName: "Northstar Foods",
        stage: "Proposal sent",
        stageTone: "attention",
        calls: 3 * scale,
        meetings: scale,
        projects: "1 active project",
        projectsTone: "success",
        owner: "Rami Hassan",
        ownerInitials: "RH",
        nextAction: "Pricing follow-up due Monday",
        value: formatStandardCurrency(86000 + scale * 7000),
      },
      {
        id: "lead-02",
        clientName: "Omar Adel",
        companyName: "Cedar Logistics",
        stage: "Negotiation",
        stageTone: "warning",
        calls: 5 * scale,
        meetings: 2 * scale,
        projects: "2 completed projects",
        projectsTone: "active",
        owner: "Lina Fares",
        ownerInitials: "LF",
        nextAction: "Contract revision requested",
        value: formatStandardCurrency(132000 + scale * 4000),
      },
      {
        id: "lead-03",
        clientName: "Sara Maher",
        companyName: "Blue Horizon Clinics",
        stage: "Qualified",
        stageTone: "neutral",
        calls: 2 * scale,
        meetings: scale,
        projects: "No prior projects",
        projectsTone: "neutral",
        owner: "Youssef Ali",
        ownerInitials: "YA",
        nextAction: "Discovery workshop booked",
        value: formatStandardCurrency(54000 + scale * 3000),
      },
      {
        id: "lead-04",
        clientName: "Hassan Tariq",
        companyName: "Atlas Properties",
        stage: "Contract review",
        stageTone: "success",
        calls: 4 * scale,
        meetings: 2 * scale,
        projects: "1 completed, 1 active",
        projectsTone: "success",
        owner: "Mona Salem",
        ownerInitials: "MS",
        nextAction: "Legal approval pending",
        value: formatStandardCurrency(164000 + scale * 6000),
      },
      {
        id: "lead-05",
        clientName: "Nour Samir",
        companyName: "Vertex Retail",
        stage: "Needs attention",
        stageTone: "destructive",
        calls: 6 * scale,
        meetings: scale,
        projects: "1 completed project",
        projectsTone: "attention",
        owner: "Rami Hassan",
        ownerInitials: "RH",
        nextAction: "No response after final offer",
        value: formatStandardCurrency(47000 + scale * 2000),
      },
      {
        id: "lead-06",
        clientName: "Maya Yasin",
        companyName: "Pulse Manufacturing",
        stage: "Meeting scheduled",
        stageTone: "active",
        calls: 3 * scale,
        meetings: scale,
        projects: "3 completed projects",
        projectsTone: "success",
        owner: "Lina Fares",
        ownerInitials: "LF",
        nextAction: "Workshop tomorrow 11:00",
        value: formatStandardCurrency(99000 + scale * 5000),
      },
    ],
    salesLeaders: [
      {
        id: "sales-01",
        name: "Rami Hassan",
        initials: "RH",
        role: "Senior Sales Manager",
        deals: 14 + scale,
        contracts: 9 + Math.floor(scale / 2),
        revenue: formatStandardCurrency(540000 + scale * 24000),
        winRate: formatPercent(41.8),
      },
      {
        id: "sales-02",
        name: "Lina Fares",
        initials: "LF",
        role: "Enterprise Sales Manager",
        deals: 12 + scale,
        contracts: 8 + Math.floor(scale / 2),
        revenue: formatStandardCurrency(486000 + scale * 19000),
        winRate: formatPercent(39.4),
      },
      {
        id: "sales-03",
        name: "Youssef Ali",
        initials: "YA",
        role: "Account Executive",
        deals: 10 + scale,
        contracts: 7 + Math.floor(scale / 2),
        revenue: formatStandardCurrency(431000 + scale * 17000),
        winRate: formatPercent(36.1),
      },
      {
        id: "sales-04",
        name: "Mona Salem",
        initials: "MS",
        role: "Commercial Lead",
        deals: 9 + scale,
        contracts: 6 + Math.floor(scale / 2),
        revenue: formatStandardCurrency(398000 + scale * 15000),
        winRate: formatPercent(34.7),
      },
      {
        id: "sales-05",
        name: "Fahad Karim",
        initials: "FK",
        role: "Sales Manager",
        deals: 8 + scale,
        contracts: 5 + Math.floor(scale / 2),
        revenue: formatStandardCurrency(352000 + scale * 13000),
        winRate: formatPercent(31.9),
      },
    ],
    activeProjects: [
      {
        id: "proj-01",
        name: "Northstar Commerce Relaunch",
        clientName: "Northstar Foods",
        state: "In delivery",
        stateTone: "active",
        progress: "72%",
        pm: "Mona Saleh",
        pmInitials: "MS",
        activeTasks: 18 + scale,
        value: formatStandardCurrency(184000),
      },
      {
        id: "proj-02",
        name: "Atlas Investor Portal",
        clientName: "Atlas Properties",
        state: "Client review",
        stateTone: "attention",
        progress: "88%",
        pm: "Karim Adel",
        pmInitials: "KA",
        activeTasks: 9 + scale,
        value: formatStandardCurrency(126000),
      },
      {
        id: "proj-03",
        name: "Pulse CRM Rollout",
        clientName: "Pulse Manufacturing",
        state: "In delivery",
        stateTone: "active",
        progress: "54%",
        pm: "Lina Haddad",
        pmInitials: "LH",
        activeTasks: 23 + scale,
        value: formatStandardCurrency(212000),
      },
      {
        id: "proj-04",
        name: "Cedar Logistics Automation",
        clientName: "Cedar Logistics",
        state: "Blocked",
        stateTone: "destructive",
        progress: "41%",
        pm: "Mona Saleh",
        pmInitials: "MS",
        activeTasks: 14 + scale,
        value: formatStandardCurrency(97000),
      },
      {
        id: "proj-05",
        name: "Blue Horizon Lead Engine",
        clientName: "Blue Horizon Clinics",
        state: "In delivery",
        stateTone: "active",
        progress: "63%",
        pm: "Rami Youssef",
        pmInitials: "RY",
        activeTasks: 16 + scale,
        value: formatStandardCurrency(143000),
      },
    ],
    clients: [
      {
        id: "client-01",
        clientName: "Amina Khaled",
        companyName: "Northstar Foods",
        totalProjects: 3,
        activeProjects: 1,
        lastSeen: "Online",
        onlineTone: "active",
        balance: formatStandardCurrency(22000),
      },
      {
        id: "client-02",
        clientName: "Hassan Tariq",
        companyName: "Atlas Properties",
        totalProjects: 4,
        activeProjects: 2,
        lastSeen: "1 hour ago",
        onlineTone: "neutral",
        balance: formatStandardCurrency(48000),
      },
      {
        id: "client-03",
        clientName: "Maya Yasin",
        companyName: "Pulse Manufacturing",
        totalProjects: 5,
        activeProjects: 2,
        lastSeen: "Online",
        onlineTone: "active",
        balance: formatStandardCurrency(31000),
      },
      {
        id: "client-04",
        clientName: "Omar Adel",
        companyName: "Cedar Logistics",
        totalProjects: 2,
        activeProjects: 1,
        lastSeen: "Yesterday",
        onlineTone: "neutral",
        balance: formatStandardCurrency(17000),
      },
      {
        id: "client-05",
        clientName: "Sara Maher",
        companyName: "Blue Horizon Clinics",
        totalProjects: 2,
        activeProjects: 1,
        lastSeen: "Online",
        onlineTone: "active",
        balance: formatStandardCurrency(12500),
      },
    ],
  };
}
