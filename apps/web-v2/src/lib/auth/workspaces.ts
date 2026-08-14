import { UserRole, type UserRole as UserRoleValue } from "@hassad/shared";

import type { Permission } from "@/lib/permissions/permissions";

export type WorkspaceIconKey =
  | "overview"
  | "people"
  | "clients"
  | "commercial"
  | "delivery"
  | "finance"
  | "reports"
  | "messages"
  | "campaigns"
  | "locked";

export type WorkspaceNavigationChild = {
  label: string;
  href: string;
  permission?: Permission;
};

export type WorkspaceNavigationItem = {
  label: string;
  href: string;
  icon: WorkspaceIconKey;
  permission?: Permission;
  children?: WorkspaceNavigationChild[];
};

export type WorkspaceDefinition = {
  key: "admin" | "sales" | "pm" | "team" | "marketing" | "restricted";
  label: string;
  home: string;
  roles: UserRoleValue[];
  groups: Array<{
    label: string;
    items: WorkspaceNavigationItem[];
  }>;
  commands: Array<{
    label: string;
    href: string;
  }>;
};

const adminWorkspace: WorkspaceDefinition = {
  key: "admin",
  label: "Admin",
  home: "/admin",
  roles: [UserRole.ADMIN],
  groups: [
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
          label: "CRM",
          href: "/admin/crm/orders",
          icon: "commercial",
          permission: "admin.commercial.read",
          children: [
            {
              label: "Orders",
              href: "/admin/crm/orders",
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
          label: "Chat",
          href: "/admin/chat",
          icon: "messages",
          permission: "chat.read",
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
              permission: "admin.settings",
            },
          ],
        },
      ],
    },
  ],
  commands: [
    { label: "Admin overview", href: "/admin" },
    { label: "Employees", href: "/admin/employees" },
    { label: "Clients", href: "/admin/clients" },
    { label: "CRM orders", href: "/admin/crm/orders" },
    { label: "Projects", href: "/admin/projects" },
    { label: "Tasks", href: "/admin/tasks" },
    { label: "Disputes", href: "/admin/disputes" },
    { label: "Finance", href: "/admin/finance/invoices" },
    { label: "Chat", href: "/admin/chat" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Settings", href: "/admin/settings" },
  ],
};

const salesWorkspace: WorkspaceDefinition = {
  key: "sales",
  label: "Sales",
  home: "/crm",
  roles: [UserRole.SALES],
  groups: [
    {
      label: "Sales",
      items: [
        {
          label: "Overview",
          href: "/crm",
          icon: "overview",
        },
        {
          label: "Clients",
          href: "/crm/clients",
          icon: "clients",
        },
        {
          label: "Proposals",
          href: "/crm/proposals",
          icon: "commercial",
        },
        {
          label: "Contracts",
          href: "/crm/contracts",
          icon: "finance",
        },
        {
          label: "Chat",
          href: "/crm/chat",
          icon: "messages",
        },
      ],
    },
  ],
  commands: [
    { label: "CRM overview", href: "/crm" },
    { label: "Clients", href: "/crm/clients" },
    { label: "Proposals", href: "/crm/proposals" },
    { label: "Contracts", href: "/crm/contracts" },
    { label: "Chat", href: "/crm/chat" },
  ],
};

const pmWorkspace: WorkspaceDefinition = {
  key: "pm",
  label: "PM",
  home: "/pm",
  roles: [UserRole.PM],
  groups: [
    {
      label: "PM",
      items: [
        {
          label: "Overview",
          href: "/pm",
          icon: "overview",
        },
        {
          label: "Tasks",
          href: "/pm/tasks",
          icon: "delivery",
        },
        {
          label: "Disputes",
          href: "/pm/disputes",
          icon: "locked",
        },
        {
          label: "Chat",
          href: "/pm/chat",
          icon: "messages",
        },
      ],
    },
  ],
  commands: [
    { label: "PM overview", href: "/pm" },
    { label: "Tasks", href: "/pm/tasks" },
    { label: "Disputes", href: "/pm/disputes" },
    { label: "Chat", href: "/pm/chat" },
  ],
};

const teamWorkspace: WorkspaceDefinition = {
  key: "team",
  label: "Team",
  home: "/team",
  roles: [UserRole.TEAM],
  groups: [
    {
      label: "Team",
      items: [
        {
          label: "Overview",
          href: "/team",
          icon: "overview",
        },
        {
          label: "Chat",
          href: "/team/chat",
          icon: "messages",
        },
      ],
    },
  ],
  commands: [
    { label: "Team overview", href: "/team" },
    { label: "Chat", href: "/team/chat" },
  ],
};

const marketingWorkspace: WorkspaceDefinition = {
  key: "marketing",
  label: "Marketing",
  home: "/marketing",
  roles: [UserRole.MARKETING],
  groups: [
    {
      label: "Marketing",
      items: [
        {
          label: "Overview",
          href: "/marketing",
          icon: "overview",
        },
        {
          label: "Campaigns",
          href: "/marketing/campaigns",
          icon: "campaigns",
        },
        {
          label: "Marketing Strategies",
          href: "/marketing/strategies",
          icon: "campaigns",
        },
        {
          label: "Chat",
          href: "/marketing/chat",
          icon: "messages",
        },
      ],
    },
  ],
  commands: [
    { label: "Marketing overview", href: "/marketing" },
    { label: "Campaigns", href: "/marketing/campaigns" },
    { label: "Marketing Strategies", href: "/marketing/strategies" },
    { label: "Chat", href: "/marketing/chat" },
  ],
};

const restrictedWorkspace: WorkspaceDefinition = {
  key: "restricted",
  label: "Restricted",
  home: "/forbidden",
  roles: [UserRole.ACCOUNTANT, UserRole.CLIENT],
  groups: [],
  commands: [],
};

export const workspaceDefinitions: WorkspaceDefinition[] = [
  adminWorkspace,
  salesWorkspace,
  pmWorkspace,
  teamWorkspace,
  marketingWorkspace,
  restrictedWorkspace,
];

export function resolveWorkspaceDefinition(role: UserRoleValue): WorkspaceDefinition {
  return (
    workspaceDefinitions.find((workspace) => workspace.roles.includes(role)) ??
    restrictedWorkspace
  );
}

export function resolveRoleHome(role: UserRoleValue): string {
  return resolveWorkspaceDefinition(role).home;
}

export function canAccessPath(role: UserRoleValue, path: string): boolean {
  const normalizedPath = path.split(/[?#]/)[0] ?? path;

  if (normalizedPath === "/forbidden") {
    return true;
  }

  if (role === UserRole.SALES && (normalizedPath === "/crm" || normalizedPath.startsWith("/crm/"))) {
    return true;
  }

  const workspace = resolveWorkspaceDefinition(role);

  if (
    workspace.home !== "/forbidden" &&
    (normalizedPath === workspace.home || normalizedPath.startsWith(`${workspace.home}/`))
  ) {
    return true;
  }

  return false;
}
