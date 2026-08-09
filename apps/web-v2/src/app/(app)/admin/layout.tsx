import { UserRole } from "@hassad/shared";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { requireServerSession } from "@/lib/auth/server-session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireServerSession();

  if (session.role !== UserRole.ADMIN) {
    redirect("/forbidden");
  }

  return children;
}
