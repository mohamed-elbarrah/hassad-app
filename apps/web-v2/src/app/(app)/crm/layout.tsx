import { UserRole } from "@hassad/shared";
import type { ReactNode } from "react";

import { requireRoleSession } from "@/lib/auth/require-role";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  await requireRoleSession(UserRole.SALES);

  return children;
}
