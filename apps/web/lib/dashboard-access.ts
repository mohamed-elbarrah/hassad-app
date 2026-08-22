import { UserRole } from "@hassad/shared";

/**
 * Routes that are available to every authenticated staff dashboard.
 * Workspace-specific routes must stay in rolePrefixes instead of being added
 * here, otherwise the client and edge guards will allow the wrong workspace.
 */
export const sharedDashboardPrefixes = [
  "/dashboard/account",
  "/dashboard/notifications",
  "/dashboard/messages",
  "/dashboard/tasks",
] as const;

export const roleHome: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.PM]: "/dashboard/pm",
  [UserRole.SALES]: "/dashboard/sales",
  [UserRole.ACCOUNTANT]: "/dashboard/finance",
  [UserRole.MARKETING]: "/dashboard/marketing",
  [UserRole.TEAM]: "/dashboard/team",
  [UserRole.CLIENT]: "/portal",
};

export const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "الإدارة",
  [UserRole.PM]: "إدارة المشاريع",
  [UserRole.SALES]: "المبيعات",
  [UserRole.ACCOUNTANT]: "المالية",
  [UserRole.MARKETING]: "التسويق",
  [UserRole.TEAM]: "الفريق",
  [UserRole.CLIENT]: "العميل",
};

export const rolePrefixes: Record<UserRole, readonly string[]> = {
  [UserRole.ADMIN]: ["/dashboard/admin"],
  [UserRole.PM]: ["/dashboard/pm"],
  [UserRole.SALES]: ["/dashboard/sales"],
  [UserRole.ACCOUNTANT]: ["/dashboard/finance"],
  [UserRole.MARKETING]: ["/dashboard/marketing"],
  [UserRole.TEAM]: ["/dashboard/team", "/dashboard/designer"],
  [UserRole.CLIENT]: ["/portal"],
};

export function pathMatchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * This is a navigation/redirect guard, not the security boundary. APIs and
 * server-side route checks must still enforce the same capabilities.
 *
 * ADMIN intentionally keeps its existing superuser behavior for now. If that
 * policy changes, replace this branch with explicit admin capabilities.
 */
export function canAccessDashboardPath(
  role: UserRole | string,
  pathname: string,
) {
  if (pathname === "/dashboard") return true;
  if (role === UserRole.ADMIN) return true;

  const typedRole = role as UserRole;
  const prefixes = [
    ...sharedDashboardPrefixes,
    ...(rolePrefixes[typedRole] ?? []),
  ];

  return prefixes.some((prefix) => pathMatchesPrefix(pathname, prefix));
}

export function getRoleHome(role: UserRole | string) {
  return roleHome[role as UserRole] ?? "/dashboard";
}
