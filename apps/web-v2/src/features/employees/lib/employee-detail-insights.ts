import type { EmployeeFixture } from "@/lib/fixtures/first-slice";
import type { StatusTone } from "@/components/patterns/status-badge";

export type DetailSummaryItem = {
  label: string;
  value: string;
  helper: string;
};

export type PerformanceTrendPoint = {
  label: string;
  onTrack: number;
  delayed: number;
};

export type CapacityMixPoint = {
  label: string;
  active: number;
  review: number;
  blocked: number;
};

export type RiskProjectRow = {
  project: string;
  client: string;
  riskType: string;
  blocker: string;
  due: string;
  action: string;
  tone: StatusTone;
};

export type EmployeeDetailInsights = {
  summary: DetailSummaryItem[];
  performanceTrend: PerformanceTrendPoint[];
  capacityMix: CapacityMixPoint[];
  riskProjects: RiskProjectRow[];
};

const insightsByEmployeeId: Record<string, EmployeeDetailInsights> = {
  "emp-mona-saleh": {
    summary: [
      {
        label: "Active projects",
        value: "6",
        helper: "2 high priority",
      },
      {
        label: "Milestones on time",
        value: "83%",
        helper: "Last 30 days",
      },
      {
        label: "Pending approvals",
        value: "5",
        helper: "Client or admin decision",
      },
      {
        label: "Client escalations",
        value: "1",
        helper: "Open and assigned",
      },
    ],
    performanceTrend: [
      { label: "Week 1", onTrack: 86, delayed: 14 },
      { label: "Week 2", onTrack: 82, delayed: 18 },
      { label: "Week 3", onTrack: 88, delayed: 12 },
      { label: "Week 4", onTrack: 84, delayed: 16 },
      { label: "Week 5", onTrack: 81, delayed: 19 },
      { label: "Week 6", onTrack: 83, delayed: 17 },
    ],
    capacityMix: [
      { label: "Mon", active: 6, review: 2, blocked: 1 },
      { label: "Tue", active: 6, review: 3, blocked: 1 },
      { label: "Wed", active: 5, review: 3, blocked: 2 },
      { label: "Thu", active: 6, review: 2, blocked: 1 },
      { label: "Fri", active: 4, review: 4, blocked: 1 },
    ],
    riskProjects: [
      {
        project: "Al Noor campaign launch",
        client: "Al Noor",
        riskType: "Client feedback delay",
        blocker: "Final creative feedback is 4 days late",
        due: "Aug 9, 2026",
        action: "Escalate client follow-up",
        tone: "warning",
      },
      {
        project: "Greenline monthly report",
        client: "Greenline",
        riskType: "Approval backlog",
        blocker: "Three deliverables are still waiting PM review",
        due: "Today",
        action: "Clear review queue",
        tone: "attention",
      },
      {
        project: "Northstar onboarding",
        client: "Northstar",
        riskType: "Capacity pressure",
        blocker: "Two design tasks need reassignment before Friday handoff",
        due: "Aug 11, 2026",
        action: "Rebalance workload",
        tone: "active",
      },
    ],
  },
  "emp-omar-nasser": {
    summary: [
      {
        label: "Leads won",
        value: "11",
        helper: "Last 30 days",
      },
      {
        label: "Conversion rate",
        value: "31%",
        helper: "Qualified leads",
      },
      {
        label: "Overdue follow-ups",
        value: "6",
        helper: "Warm leads older than 48 hours",
      },
      {
        label: "Open proposal value",
        value: "312k SAR",
        helper: "Active pipeline",
      },
    ],
    performanceTrend: [
      { label: "Week 1", onTrack: 24, delayed: 8 },
      { label: "Week 2", onTrack: 26, delayed: 7 },
      { label: "Week 3", onTrack: 29, delayed: 9 },
      { label: "Week 4", onTrack: 31, delayed: 10 },
      { label: "Week 5", onTrack: 30, delayed: 11 },
      { label: "Week 6", onTrack: 31, delayed: 9 },
    ],
    capacityMix: [
      { label: "Mon", active: 18, review: 4, blocked: 2 },
      { label: "Tue", active: 17, review: 5, blocked: 2 },
      { label: "Wed", active: 16, review: 5, blocked: 3 },
      { label: "Thu", active: 18, review: 4, blocked: 2 },
      { label: "Fri", active: 15, review: 6, blocked: 3 },
    ],
    riskProjects: [
      {
        project: "Riyadh Clinics intake",
        client: "Riyadh Clinics",
        riskType: "Follow-up overdue",
        blocker: "No reply logged after the required follow-up window",
        due: "Yesterday",
        action: "Sales manager intervention",
        tone: "warning",
      },
      {
        project: "Enterprise Foods rebrand",
        client: "Enterprise Foods",
        riskType: "Decision pending",
        blocker: "Proposal is waiting for client decision before handoff",
        due: "Today",
        action: "Push decision call",
        tone: "attention",
      },
      {
        project: "Oasis Retail contract",
        client: "Oasis Retail",
        riskType: "Signature dependency",
        blocker: "Contract is ready but signature is still pending",
        due: "Aug 10, 2026",
        action: "Close signature loop",
        tone: "active",
      },
    ],
  },
  "emp-lina-haddad": {
    summary: [
      {
        label: "Tasks completed",
        value: "22",
        helper: "Last 30 days",
      },
      {
        label: "Accepted first pass",
        value: "91%",
        helper: "No revision needed",
      },
      {
        label: "Revision rate",
        value: "9%",
        helper: "Below team average",
      },
      {
        label: "Blocked tasks",
        value: "1",
        helper: "Waiting client assets",
      },
    ],
    performanceTrend: [
      { label: "Week 1", onTrack: 88, delayed: 12 },
      { label: "Week 2", onTrack: 92, delayed: 8 },
      { label: "Week 3", onTrack: 90, delayed: 10 },
      { label: "Week 4", onTrack: 91, delayed: 9 },
      { label: "Week 5", onTrack: 93, delayed: 7 },
      { label: "Week 6", onTrack: 91, delayed: 9 },
    ],
    capacityMix: [
      { label: "Mon", active: 5, review: 1, blocked: 1 },
      { label: "Tue", active: 4, review: 2, blocked: 1 },
      { label: "Wed", active: 5, review: 1, blocked: 1 },
      { label: "Thu", active: 5, review: 1, blocked: 0 },
      { label: "Fri", active: 4, review: 2, blocked: 1 },
    ],
    riskProjects: [
      {
        project: "Product photo cleanup",
        client: "Al Noor",
        riskType: "Asset blocker",
        blocker: "Product photos are still missing from the client",
        due: "Aug 9, 2026",
        action: "PM to request assets",
        tone: "warning",
      },
      {
        project: "Brand carousel batch",
        client: "Greenline",
        riskType: "Review dependency",
        blocker: "The task is waiting for PM review before release",
        due: "Today",
        action: "Clear review queue",
        tone: "attention",
      },
      {
        project: "Landing page mockup",
        client: "Clinic campaign",
        riskType: "Execution load",
        blocker: "Parallel revisions can delay the mockup handoff",
        due: "Aug 8, 2026",
        action: "Protect focus time",
        tone: "active",
      },
    ],
  },
  "emp-fahad-ali": {
    summary: [
      {
        label: "Invoices handled",
        value: "37",
        helper: "Last 30 days",
      },
      {
        label: "Overdue invoices",
        value: "5",
        helper: "Still assigned",
      },
      {
        label: "Payments confirmed",
        value: "18",
        helper: "Last 30 days",
      },
      {
        label: "Unresolved issues",
        value: "6",
        helper: "Need reassignment",
      },
    ],
    performanceTrend: [
      { label: "Week 1", onTrack: 58, delayed: 42 },
      { label: "Week 2", onTrack: 55, delayed: 45 },
      { label: "Week 3", onTrack: 49, delayed: 51 },
      { label: "Week 4", onTrack: 45, delayed: 55 },
      { label: "Week 5", onTrack: 44, delayed: 56 },
      { label: "Week 6", onTrack: 42, delayed: 58 },
    ],
    capacityMix: [
      { label: "Mon", active: 6, review: 2, blocked: 3 },
      { label: "Tue", active: 6, review: 1, blocked: 3 },
      { label: "Wed", active: 5, review: 2, blocked: 4 },
      { label: "Thu", active: 4, review: 2, blocked: 4 },
      { label: "Fri", active: 4, review: 1, blocked: 5 },
    ],
    riskProjects: [
      {
        project: "Enterprise Foods invoice #1048",
        client: "Enterprise Foods",
        riskType: "Reconciliation delay",
        blocker: "Client payment was reported but not reconciled",
        due: "Aug 5, 2026",
        action: "Reassign and reconcile",
        tone: "destructive",
      },
      {
        project: "Oasis Retail receivable",
        client: "Oasis Retail",
        riskType: "Collection follow-up",
        blocker: "Receivable follow-up is pending while the owner is suspended",
        due: "Today",
        action: "Move collection owner",
        tone: "warning",
      },
      {
        project: "August payroll review",
        client: "Internal payroll",
        riskType: "Backup coverage",
        blocker: "No backup owner has been assigned yet",
        due: "Aug 12, 2026",
        action: "Assign payroll backup",
        tone: "attention",
      },
    ],
  },
};

function buildFallbackSummary(employee: EmployeeFixture): DetailSummaryItem[] {
  return employee.roleProfile.metrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    helper: metric.description,
  }));
}

function buildFallbackPerformanceTrend(
  employee: EmployeeFixture
): PerformanceTrendPoint[] {
  const base = employee.roleProfile.scoreValue;

  return [
    { label: "Week 1", onTrack: Math.max(base - 6, 45), delayed: Math.min(100 - (base - 6), 55) },
    { label: "Week 2", onTrack: Math.max(base - 3, 48), delayed: Math.min(100 - (base - 3), 52) },
    { label: "Week 3", onTrack: base, delayed: 100 - base },
    { label: "Week 4", onTrack: Math.min(base + 2, 96), delayed: Math.max(100 - (base + 2), 4) },
  ];
}

function buildFallbackCapacityMix(employee: EmployeeFixture): CapacityMixPoint[] {
  const reviewCount = employee.currentWork.filter((item) =>
    item.state.toLowerCase().includes("review")
  ).length;
  const blockedCount = employee.currentWork.filter((item) =>
    item.tone === "warning" || item.state.toLowerCase().includes("blocked")
  ).length;

  return [
    {
      label: "Current",
      active: employee.openAssignments,
      review: reviewCount,
      blocked: blockedCount,
    },
  ];
}

function buildFallbackRiskProjects(employee: EmployeeFixture): RiskProjectRow[] {
  return employee.currentWork.map((item) => ({
    project: item.name,
    client: "Assigned client",
    riskType: item.state,
    blocker: item.state,
    due: item.due,
    action: item.tone === "success" ? "No action needed" : "Review with manager",
    tone: item.tone,
  }));
}

export function getEmployeeDetailInsights(
  employee: EmployeeFixture
): EmployeeDetailInsights {
  const roleInsights = insightsByEmployeeId[employee.id];

  if (roleInsights) {
    return roleInsights;
  }

  return {
    summary: buildFallbackSummary(employee),
    performanceTrend: buildFallbackPerformanceTrend(employee),
    capacityMix: buildFallbackCapacityMix(employee),
    riskProjects: buildFallbackRiskProjects(employee),
  };
}
