export type Permission =
  | "admin.dashboard"
  | "admin.users.read"
  | "admin.users.manage"
  | "admin.clients.read"
  | "admin.commercial.read"
  | "admin.projects.read"
  | "admin.finance.read"
  | "admin.reports"
  | "admin.settings.read";

export function can(
  permissions: readonly Permission[],
  permission: Permission
): boolean {
  return permissions.includes(permission);
}
