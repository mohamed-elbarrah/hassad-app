import type { AuthSession } from "@/lib/auth/auth-types";
import {
  canAccessPath as canAccessWorkspacePath,
  resolveRoleHome,
} from "@/lib/auth/workspaces";

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

export function resolveSessionHome(session: AuthSession): string {
  return resolveRoleHome(session.role);
}

export function canAccessPath(session: AuthSession, path: string): boolean {
  return canAccessWorkspacePath(session.role, path);
}
