import type { Prisma } from "@prisma/client";
import { UserRole } from "@hassad/shared";

export interface RequestAccessScope {
  assignedSalesId?: string;
}

export function buildRequestAccessWhere(
  scope?: RequestAccessScope,
): Prisma.RequestWhereInput {
  return scope?.assignedSalesId
    ? { assignedSalesId: scope.assignedSalesId }
    : {};
}

export function getSalesRequestAccessScope(user: {
  id: string;
  role?: string | null;
}): RequestAccessScope {
  if (user.role === UserRole.ADMIN) {
    return {};
  }

  return { assignedSalesId: user.id };
}

export function getGenericRequestAccessScope(user: {
  id: string;
  role?: string | null;
}): RequestAccessScope | undefined {
  return user.role === UserRole.SALES
    ? { assignedSalesId: user.id }
    : undefined;
}
