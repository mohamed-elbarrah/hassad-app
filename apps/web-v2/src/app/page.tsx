import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/server-session";
import { resolveSessionHome } from "@/lib/auth/auth-utils";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  redirect(resolveSessionHome(session));
}
