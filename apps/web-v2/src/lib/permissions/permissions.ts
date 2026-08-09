export type Permission =
  | "admin.dashboard"
  | "admin.users.read"
  | "admin.clients.read"
  | "admin.leads.read"
  | "admin.projects.read"
  | "finance.read"
  | "admin.reports"
  | "admin.settings"
  | "proposals.read"
  | "contracts.read"
  | "tasks.read"
  | "disputes.admin"
  | (string & {});

export function can(
  permissions: readonly string[],
  permission: Permission
): boolean {
  return permissions.includes(permission);
}
