import type { Permission } from "@/lib/permissions/permissions";

export type WorkspaceNavigationGroup = {
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
};

export const workspaceNavigation: WorkspaceNavigationGroup[] = [
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
        href: "/admin/leads",
        icon: "commercial",
        permission: "admin.leads.read",
        children: [
          {
            label: "Leads",
            href: "/admin/leads",
            permission: "admin.leads.read",
          },
          {
            label: "Proposals",
            href: "/admin/proposals",
            permission: "proposals.read",
          },
          {
            label: "Contracts",
            href: "/admin/contracts",
            permission: "contracts.read",
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
            permission: "tasks.read",
          },
          {
            label: "Disputes",
            href: "/admin/disputes",
            permission: "disputes.admin",
          },
        ],
      },
      {
        label: "Finance",
        href: "/admin/finance",
        icon: "finance",
        permission: "finance.read",
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
];
