import { type UserRole as UserRoleValue } from "@hassad/shared";
import { redirect } from "next/navigation";

import { requireServerSession } from "@/lib/auth/server-session";

export async function requireRoleSession(role: UserRoleValue) {
  const session = await requireServerSession();

  if (session.role !== role) {
    redirect("/forbidden");
  }

  return session;
}
