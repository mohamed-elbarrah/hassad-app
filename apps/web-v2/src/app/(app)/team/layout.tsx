import { UserRole } from "@hassad/shared";
import type { ReactNode } from "react";

import { requireRoleSession } from "@/lib/auth/require-role";

export default async function TeamLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRoleSession(UserRole.TEAM);

  return children;
}
