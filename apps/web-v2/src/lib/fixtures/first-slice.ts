import { TaskPriority, UserRole } from "@hassad/shared";

import type { Permission } from "@/lib/permissions/permissions";
import type { StatusTone } from "@/components/patterns/status-badge";

export const currentUser = {
  id: "usr_admin_001",
  name: "Hassad Admin",
  initials: "HA",
  email: "admin@hassad.com",
  role: UserRole.ADMIN,
  permissions: [
    "admin.dashboard",
    "admin.users.read",
    "admin.users.manage",
    "admin.clients.read",
    "admin.commercial.read",
    "admin.projects.read",
    "admin.finance.read",
    "admin.reports",
    "admin.settings.read",
  ] satisfies Permission[],
};

export const workspaceNavigation = [
  {
    label: "Admin",
    items: [
      {
        label: "Overview",
        href: "/admin",
        icon: "overview",
        permission: "admin.dashboard",
      },
      {
        label: "Employees",
        href: "/admin/employees",
        icon: "people",
        permission: "admin.users.read",
      },
      {
        label: "Clients",
        href: "/admin/clients",
        icon: "clients",
        permission: "admin.clients.read",
      },
      {
        label: "Commercial",
        href: "/admin/leads",
        icon: "commercial",
        permission: "admin.commercial.read",
        children: [
          {
            label: "Leads",
            href: "/admin/leads",
            permission: "admin.commercial.read",
          },
          {
            label: "Requests",
            href: "/admin/requests",
            permission: "admin.commercial.read",
          },
          {
            label: "Proposals",
            href: "/admin/proposals",
            permission: "admin.commercial.read",
          },
          {
            label: "Contracts",
            href: "/admin/contracts",
            permission: "admin.commercial.read",
          },
        ],
      },
      {
        label: "Delivery",
        href: "/admin/projects",
        icon: "delivery",
        permission: "admin.projects.read",
        children: [
          {
            label: "Projects",
            href: "/admin/projects",
            permission: "admin.projects.read",
          },
          {
            label: "Tasks",
            href: "/admin/tasks",
            permission: "admin.projects.read",
          },
          {
            label: "Disputes",
            href: "/admin/disputes",
            permission: "admin.projects.read",
          },
        ],
      },
      {
        label: "Finance",
        href: "/admin/finance/invoices",
        icon: "finance",
        permission: "admin.finance.read",
        children: [
          {
            label: "Invoices",
            href: "/admin/finance/invoices",
            permission: "admin.finance.read",
          },
          {
            label: "Payments",
            href: "/admin/finance/payments",
            permission: "admin.finance.read",
          },
          {
            label: "Payroll",
            href: "/admin/finance/payroll",
            permission: "admin.finance.read",
          },
          {
            label: "Payment Issues",
            href: "/admin/finance/payment-issues",
            permission: "admin.finance.read",
          },
        ],
      },
      {
        label: "Reports & System",
        href: "/admin/reports",
        icon: "reports",
        permission: "admin.reports",
        children: [
          {
            label: "Reports",
            href: "/admin/reports",
            permission: "admin.reports",
          },
          {
            label: "Settings",
            href: "/admin/settings",
            permission: "admin.settings.read",
          },
        ],
      },
    ],
  },
] satisfies Array<{
  label: string;
  items: Array<{
    label: string;
    href: string;
    icon:
      | "overview"
      | "people"
      | "clients"
      | "commercial"
      | "delivery"
      | "finance"
      | "reports"
      | "messages"
      | "locked";
    permission: Permission;
    children?: Array<{
      label: string;
      href: string;
      permission: Permission;
    }>;
  }>;
}>;

export const adminMetrics = [
  {
    label: "Role changes pending",
    value: "3",
    description: "Sensitive access changes",
    trend: { label: TaskPriority.URGENT, tone: "warning" as const },
  },
  {
    label: "Active projects",
    value: "28",
    description: "Across PM workspaces",
    trend: { label: "Stable", tone: "success" as const },
  },
  {
    label: "Late invoices",
    value: "11",
    description: "Finance exceptions",
    trend: { label: "Attention", tone: "attention" as const },
  },
  {
    label: "Suspended accounts",
    value: "3",
    description: "Require review",
    trend: { label: "Review", tone: "neutral" as const },
  },
];

export const adminAttentionQueue = [
  {
    title: "Role change needs approval",
    description:
      "Sales lead is moving into PM coverage. Review the new role because it changes project access.",
    status: "Needs decision",
    tone: "warning" as const,
  },
  {
    title: "Suspended account review",
    description:
      "A production team member account is suspended while tasks remain assigned.",
    status: "Blocked",
    tone: "destructive" as const,
  },
  {
    title: "Employee onboarding completed",
    description:
      "New finance user profile is complete and ready for invoice queue access.",
    status: "Ready",
    tone: "success" as const,
  },
];

export const adminActivity = [
  {
    title: "Role changed",
    summary: "Mona Saleh moved from Team to Project Management with reason logged.",
    time: "Today, 09:40",
  },
  {
    title: "Session revoked",
    summary: "Suspicious browser session revoked for an inactive employee account.",
    time: "Yesterday, 17:25",
  },
  {
    title: "Department updated",
    summary: "Design department membership changed for two active project members.",
    time: "Yesterday, 14:10",
  },
];

export type EmployeeFixture = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  department: string;
  workload: string;
  stateLabel: string;
  stateTone: StatusTone;
  lastActivity: string;
  headlineSignal: string;
  performanceSignal: string;
  riskLabel: string;
  riskTone: StatusTone;
  openAssignments: number;
  accessSummary: {
    roleDefault: string;
    inheritedGroups: string[];
    customExceptions: number;
    exceptionNote: string;
  };
  roleProfile: {
    title: string;
    summary: string;
    scoreLabel: string;
    scoreValue: number;
    metrics: Array<{
      label: string;
      value: string;
      description: string;
      tone: StatusTone;
    }>;
    focusItems: Array<{
      label: string;
      value: string;
      description: string;
      tone: StatusTone;
    }>;
  };
  currentWork: Array<{
    name: string;
    type: string;
    state: string;
    due: string;
    tone: StatusTone;
  }>;
  meaningfulActivities: Array<{
    title: string;
    description: string;
    time: string;
    impact: string;
    tone: StatusTone;
  }>;
};

export const employees: EmployeeFixture[] = [
  {
    id: "emp-mona-saleh",
    name: "Mona Saleh",
    initials: "MS",
    email: "mona.saleh@hassad.com",
    role: UserRole.PM,
    department: "Project Management",
    workload: "6 active projects",
    stateLabel: "Active",
    stateTone: "success",
    lastActivity: "Today, 10:12",
    headlineSignal: "Two delivery risks need PM decision this week",
    performanceSignal: "83% milestones on time",
    riskLabel: "Delivery watch",
    riskTone: "warning",
    openAssignments: 6,
    accessSummary: {
      roleDefault:
        "PM role grants project coordination, task assignment, review, meeting, and client-delivery visibility.",
      inheritedGroups: ["Projects", "Tasks", "Deliverables", "Client updates"],
      customExceptions: 0,
      exceptionNote: "No direct permission overrides. Access is controlled by role and project membership.",
    },
    roleProfile: {
      title: "Project management performance",
      summary:
        "Mona is carrying a healthy project load, but two projects need intervention before client reporting.",
      scoreLabel: "Delivery health",
      scoreValue: 83,
      metrics: [
        {
          label: "Active projects",
          value: "6",
          description: "2 high priority",
          tone: "active",
        },
        {
          label: "Milestones on time",
          value: "83%",
          description: "Last 30 days",
          tone: "success",
        },
        {
          label: "Waiting approvals",
          value: "5",
          description: "Client or admin decision",
          tone: "warning",
        },
        {
          label: "Client escalations",
          value: "1",
          description: "Open and assigned",
          tone: "attention",
        },
      ],
      focusItems: [
        {
          label: "Stalled project",
          value: "Al Noor launch",
          description: "Client feedback is 4 days late",
          tone: "warning",
        },
        {
          label: "Review queue",
          value: "3 deliverables",
          description: "Need PM approve or revision",
          tone: "attention",
        },
      ],
    },
    currentWork: [
      {
        name: "Al Noor campaign launch",
        type: "Project",
        state: "At risk",
        due: "Aug 9, 2026",
        tone: "warning",
      },
      {
        name: "Greenline monthly report",
        type: "Client report",
        state: "Waiting review",
        due: "Today",
        tone: "attention",
      },
      {
        name: "Content sprint handoff",
        type: "Task batch",
        state: "On track",
        due: "Aug 11, 2026",
        tone: "success",
      },
    ],
    meaningfulActivities: [
      {
        title: "Approved client deliverable",
        description:
          "Approved the August creative package after one revision cycle.",
        time: "Today, 10:12",
        impact: "Project moved to client review",
        tone: "success",
      },
      {
        title: "Escalated stalled feedback",
        description:
          "Flagged Al Noor feedback delay because it threatens launch timing.",
        time: "Yesterday, 16:20",
        impact: "Needs client follow-up",
        tone: "warning",
      },
      {
        title: "Rebalanced team workload",
        description:
          "Moved two design tasks away from an overloaded team member.",
        time: "Yesterday, 11:45",
        impact: "Reduced delivery risk",
        tone: "active",
      },
    ],
  },
  {
    id: "emp-omar-nasser",
    name: "Omar Nasser",
    initials: "ON",
    email: "omar.nasser@hassad.com",
    role: UserRole.SALES,
    department: "Sales",
    workload: "18 owned leads",
    stateLabel: "Access review",
    stateTone: "warning",
    lastActivity: "Today, 08:35",
    headlineSignal: "Strong close rate, but follow-up debt is growing",
    performanceSignal: "31% lead conversion",
    riskLabel: "Follow-up debt",
    riskTone: "warning",
    openAssignments: 18,
    accessSummary: {
      roleDefault:
        "Sales role grants lead handling, proposal drafting, client handoff, and contract follow-up visibility.",
      inheritedGroups: ["Leads", "Proposals", "Contracts", "Client handoff"],
      customExceptions: 1,
      exceptionNote:
        "One temporary proposal approval exception expires after the Enterprise Foods handoff.",
    },
    roleProfile: {
      title: "Sales and CRM performance",
      summary:
        "Omar is converting well on qualified leads, but several warm leads are aging without follow-up.",
      scoreLabel: "Pipeline quality",
      scoreValue: 76,
      metrics: [
        {
          label: "Leads won",
          value: "11",
          description: "Last 30 days",
          tone: "success",
        },
        {
          label: "Leads lost",
          value: "4",
          description: "Price or no response",
          tone: "neutral",
        },
        {
          label: "Conversion rate",
          value: "31%",
          description: "Qualified leads",
          tone: "active",
        },
        {
          label: "Proposal value",
          value: "312k SAR",
          description: "Open pipeline",
          tone: "success",
        },
      ],
      focusItems: [
        {
          label: "Overdue follow-ups",
          value: "6",
          description: "Warm leads older than 48 hours",
          tone: "warning",
        },
        {
          label: "Active clients",
          value: "8",
          description: "In proposal or contract negotiation",
          tone: "active",
        },
      ],
    },
    currentWork: [
      {
        name: "Enterprise Foods rebrand",
        type: "Proposal",
        state: "Awaiting client decision",
        due: "Today",
        tone: "attention",
      },
      {
        name: "Riyadh Clinics intake",
        type: "Lead",
        state: "Follow-up overdue",
        due: "Yesterday",
        tone: "warning",
      },
      {
        name: "Oasis Retail contract",
        type: "Contract",
        state: "Signature pending",
        due: "Aug 10, 2026",
        tone: "active",
      },
    ],
    meaningfulActivities: [
      {
        title: "Closed qualified lead",
        description:
          "Converted Oasis Retail from proposal accepted to contract draft.",
        time: "Today, 08:35",
        impact: "Adds 74k SAR contract value",
        tone: "success",
      },
      {
        title: "Lost lead recorded",
        description:
          "Marked Dar Al Oud as lost with price objection and competitor note.",
        time: "Yesterday, 18:05",
        impact: "Improves loss reason reporting",
        tone: "neutral",
      },
      {
        title: "Follow-up SLA missed",
        description:
          "Riyadh Clinics has no reply logged after the required follow-up window.",
        time: "Yesterday, 13:10",
        impact: "Needs sales manager attention",
        tone: "warning",
      },
    ],
  },
  {
    id: "emp-lina-haddad",
    name: "Lina Haddad",
    initials: "LH",
    email: "lina.haddad@hassad.com",
    role: UserRole.TEAM,
    department: "Design",
    workload: "5 active tasks",
    stateLabel: "Active",
    stateTone: "success",
    lastActivity: "Yesterday, 16:48",
    headlineSignal: "Reliable delivery with one revision-heavy client",
    performanceSignal: "91% tasks accepted",
    riskLabel: "Healthy",
    riskTone: "success",
    openAssignments: 5,
    accessSummary: {
      roleDefault:
        "Team role grants assigned task work, comments, file submission, and personal workload visibility.",
      inheritedGroups: ["Assigned tasks", "Comments", "Files", "Notifications"],
      customExceptions: 0,
      exceptionNote: "No direct permission overrides. Access follows team role and task assignment.",
    },
    roleProfile: {
      title: "Design delivery performance",
      summary:
        "Lina delivers consistently and has low blocker count. One client is producing extra revision cycles.",
      scoreLabel: "Task health",
      scoreValue: 91,
      metrics: [
        {
          label: "Tasks completed",
          value: "22",
          description: "Last 30 days",
          tone: "success",
        },
        {
          label: "Accepted first pass",
          value: "91%",
          description: "No revision needed",
          tone: "success",
        },
        {
          label: "Revision rate",
          value: "9%",
          description: "Below team average",
          tone: "active",
        },
        {
          label: "Blocked tasks",
          value: "1",
          description: "Waiting client assets",
          tone: "attention",
        },
      ],
      focusItems: [
        {
          label: "Next deadline",
          value: "Brand carousel",
          description: "Due today for PM review",
          tone: "attention",
        },
        {
          label: "Client asset gap",
          value: "Al Noor",
          description: "Missing product photos",
          tone: "warning",
        },
      ],
    },
    currentWork: [
      {
        name: "Brand carousel batch",
        type: "Design task",
        state: "In review",
        due: "Today",
        tone: "attention",
      },
      {
        name: "Landing page mockup",
        type: "Design task",
        state: "In progress",
        due: "Aug 8, 2026",
        tone: "active",
      },
      {
        name: "Product photo cleanup",
        type: "Design task",
        state: "Blocked",
        due: "Aug 9, 2026",
        tone: "warning",
      },
    ],
    meaningfulActivities: [
      {
        title: "Submitted design package",
        description:
          "Submitted Greenline social creative batch with source files attached.",
        time: "Yesterday, 16:48",
        impact: "Ready for PM review",
        tone: "success",
      },
      {
        title: "Blocked task with reason",
        description:
          "Marked product photo cleanup blocked because client assets are missing.",
        time: "Yesterday, 12:30",
        impact: "PM needs client request",
        tone: "warning",
      },
      {
        title: "Revision closed",
        description:
          "Completed requested typography changes on the clinic campaign landing page.",
        time: "Aug 5, 2026",
        impact: "Task moved to done",
        tone: "success",
      },
    ],
  },
  {
    id: "emp-fahad-ali",
    name: "Fahad Ali",
    initials: "FA",
    email: "fahad.ali@hassad.com",
    role: UserRole.ACCOUNTANT,
    department: "Finance",
    workload: "6 invoice queues",
    stateLabel: "Suspended",
    stateTone: "destructive",
    lastActivity: "Aug 4, 2026",
    headlineSignal: "Account is suspended while payment work remains open",
    performanceSignal: "6 unresolved finance items",
    riskLabel: "Action required",
    riskTone: "destructive",
    openAssignments: 6,
    accessSummary: {
      roleDefault:
        "Accountant role grants invoice handling, payment confirmation, receivable follow-up, and finance queue visibility.",
      inheritedGroups: ["Invoices", "Payments", "Receivables", "Payroll queue"],
      customExceptions: 0,
      exceptionNote:
        "Role access is currently inactive because the employee account is suspended.",
    },
    roleProfile: {
      title: "Finance operations",
      summary:
        "Fahad owns unresolved invoice work, but the account is suspended. Reassign or reactivate before due dates slip.",
      scoreLabel: "Finance queue health",
      scoreValue: 42,
      metrics: [
        {
          label: "Invoices handled",
          value: "37",
          description: "Last 30 days",
          tone: "active",
        },
        {
          label: "Overdue invoices",
          value: "5",
          description: "Still assigned",
          tone: "warning",
        },
        {
          label: "Payments confirmed",
          value: "18",
          description: "Last 30 days",
          tone: "success",
        },
        {
          label: "Unresolved issues",
          value: "6",
          description: "Need reassignment",
          tone: "destructive",
        },
      ],
      focusItems: [
        {
          label: "Highest risk",
          value: "Late payment confirmation",
          description: "Client paid but invoice is not reconciled",
          tone: "destructive",
        },
        {
          label: "Recommended action",
          value: "Reassign queue",
          description: "Move open items before reactivation decision",
          tone: "warning",
        },
      ],
    },
    currentWork: [
      {
        name: "Enterprise Foods invoice #1048",
        type: "Invoice",
        state: "Payment reported",
        due: "Aug 5, 2026",
        tone: "destructive",
      },
      {
        name: "Oasis Retail receivable",
        type: "Collection",
        state: "Follow-up pending",
        due: "Today",
        tone: "warning",
      },
      {
        name: "August payroll review",
        type: "Payroll",
        state: "Unassigned backup needed",
        due: "Aug 12, 2026",
        tone: "attention",
      },
    ],
    meaningfulActivities: [
      {
        title: "Account suspended",
        description:
          "Admin suspended the account after a security review. Open finance work remains assigned.",
        time: "Aug 4, 2026",
        impact: "Requires reassignment",
        tone: "destructive",
      },
      {
        title: "Payment confirmation delayed",
        description:
          "Enterprise Foods payment was reported by client but not reconciled.",
        time: "Aug 4, 2026",
        impact: "May affect client trust",
        tone: "warning",
      },
      {
        title: "Invoice batch completed",
        description:
          "Closed four routine invoice confirmations before suspension.",
        time: "Aug 3, 2026",
        impact: "No action needed",
        tone: "success",
      },
    ],
  },
];

export const notifications = [
  {
    title: "Access review due",
    summary: "Omar Nasser has a permission escalation waiting for approval.",
    href: "/admin/employees/emp-omar-nasser",
  },
  {
    title: "Suspended account with work",
    summary: "Fahad Ali still owns finance queue items while suspended.",
    href: "/admin/employees/emp-fahad-ali",
  },
  {
    title: "Onboarding ready",
    summary: "A finance user profile is ready for final activation.",
    href: "/admin/employees",
  },
];
