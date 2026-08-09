import { UserRole, type UserRole as UserRoleValue } from "@hassad/shared";

import type { AuthSession } from "@/lib/auth/auth-types";

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

export function resolveRoleHome(
  role: UserRoleValue,
): "/admin" | "/forbidden" {
  if (role === UserRole.ADMIN) {
    return "/admin";
  }

  return "/forbidden";
}

export function resolveSessionHome(session: AuthSession): "/admin" | "/forbidden" {
  return resolveRoleHome(session.role);
}

export function canAccessPath(session: AuthSession, path: string): boolean {
  if (path === "/admin" || path.startsWith("/admin/")) {
    return session.role === UserRole.ADMIN;
  }

  if (path === "/forbidden") {
    return true;
  }

  return false;
}
